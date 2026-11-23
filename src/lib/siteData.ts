import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import siteDefaults from "@/components/sites/choicedesign/siteContent.json";
import worksDefaults from "@/components/sites/choicedesign/workDetails.json";
import {
  fetchObject,
  readObject,
  readObjectBytes,
  remoteEnabled,
  writeObject,
} from "@/lib/remoteStore";

// 本地回退目录：仅在未配置外部存储时使用（生产环境请配置 Supabase，见 remoteStore.ts）
export const DATA_DIR =
  process.env.CHOICE_DATA_DIR?.trim() || path.join(process.cwd(), "data");

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SITE_FILE = path.join(DATA_DIR, "siteContent.json");
const WORKS_FILE = path.join(DATA_DIR, "workDetails.json");

// 外部存储中的对象路径
const REMOTE_SITE = "content/siteContent.json";
const REMOTE_WORKS = "content/workDetails.json";
const remoteUploadPath = (filename: string) => `uploads/${filename}`;

export type SiteContent = typeof siteDefaults;
export type WorkDetails = typeof worksDefaults;

export const DEFAULT_SITE_CONTENT = siteDefaults as SiteContent;
export const DEFAULT_WORK_DETAILS = worksDefaults as WorkDetails;

/** 用打包内的默认值补齐已保存内容里缺失的字段，避免旧数据缺字段导致页面报错 */
function mergeDefaults<T>(defaults: unknown, saved: unknown): T {
  if (saved === null || saved === undefined) return defaults as T;
  if (Array.isArray(defaults) || Array.isArray(saved)) return saved as T;
  if (typeof defaults === "object" && typeof saved === "object") {
    const defaultsObj = defaults as Record<string, unknown>;
    const savedObj = saved as Record<string, unknown>;
    const out: Record<string, unknown> = { ...defaultsObj };
    for (const [key, value] of Object.entries(savedObj)) {
      out[key] = key in defaultsObj
        ? mergeDefaults(defaultsObj[key], value)
        : value;
    }
    return out as T;
  }
  return saved as T;
}

async function readJson(
  localFile: string,
  remotePath: string,
): Promise<unknown | null> {
  try {
    if (remoteEnabled) {
      const text = await readObject(remotePath);
      return text === null ? null : (JSON.parse(text) as unknown);
    }
    const text = await readFile(localFile, "utf8");
    return JSON.parse(text) as unknown;
  } catch (error) {
    // 存储不可用时回落到打包内默认内容，保证页面仍可访问
    console.error("[siteData] 读取已保存内容失败，使用默认内容：", error);
    return null;
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  const saved = await readJson(SITE_FILE, REMOTE_SITE);
  return mergeDefaults<SiteContent>(DEFAULT_SITE_CONTENT, saved);
}

export async function getWorkDetails(): Promise<WorkDetails> {
  const saved = await readJson(WORKS_FILE, REMOTE_WORKS);
  return mergeDefaults<WorkDetails>(DEFAULT_WORK_DETAILS, saved);
}

async function writeJson(
  localFile: string,
  remotePath: string,
  data: unknown,
) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (remoteEnabled) {
    await writeObject(remotePath, text, "application/json; charset=utf-8");
    return;
  }
  await mkdir(path.dirname(localFile), { recursive: true });
  await writeFile(localFile, text, "utf8");
}

export async function saveSiteContent(data: unknown) {
  await writeJson(SITE_FILE, REMOTE_SITE, data);
}

export async function saveWorkDetails(data: unknown) {
  await writeJson(WORKS_FILE, REMOTE_WORKS, data);
}

/** 保存上传文件（图片 / 视频 / 模型），返回可访问路径 */
export async function saveUpload(
  filename: string,
  bytes: Uint8Array,
  contentType: string,
) {
  if (remoteEnabled) {
    await writeObject(remoteUploadPath(filename), bytes, contentType);
  } else {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  }
  return `/api/uploads/${filename}`;
}

/** 读取上传文件内容；不存在返回 null */
export async function readUpload(filename: string) {
  if (remoteEnabled) {
    return readObjectBytes(remoteUploadPath(filename));
  }
  try {
    const data = await readFile(path.join(UPLOAD_DIR, filename));
    return new Uint8Array(data);
  } catch {
    return null;
  }
}

/** 支持 Range 的上传读取：远程直接透传 Response（让 Supabase 处理分段），本地读全量后切片。
 *  让浏览器能对非 faststart 的 mp4 跳到文件末尾取 moov，从而边下边播，无需等整文件下完。 */
export async function readUploadStream(
  filename: string,
  range: string | null,
): Promise<{
  status: number;
  body: BodyInit;
  contentLength?: string;
  contentRange?: string;
  acceptRanges: string;
} | null> {
  const acceptRanges = "bytes";
  if (remoteEnabled) {
    const res = await fetchObject(remoteUploadPath(filename), {
      range: range ?? undefined,
    });
    if (!res) return null;
    return {
      status: res.status,
      body: (res.body as BodyInit) ?? new Uint8Array(await res.arrayBuffer()),
      contentLength: res.headers.get("content-length") ?? undefined,
      contentRange: res.headers.get("content-range") ?? undefined,
      acceptRanges: res.headers.get("accept-ranges") ?? acceptRanges,
    };
  }
  const data = await readUpload(filename);
  if (!data) return null;
  const total = data.byteLength;
  if (range) {
    const parsed = parseRangeHeader(range, total);
    if (parsed) {
      const { start, end } = parsed;
      const slice = new Uint8Array(data.subarray(start, end + 1));
      return {
        status: 206,
        body: slice,
        contentLength: String(slice.byteLength),
        contentRange: `bytes ${start}-${end}/${total}`,
        acceptRanges,
      };
    }
  }
  return {
    status: 200,
    body: new Uint8Array(data),
    contentLength: String(total),
    acceptRanges,
  };
}

/** 解析 bytes=start-end / bytes=start- / bytes=-suffix，返回闭区间 [start, end] */
function parseRangeHeader(
  range: string,
  total: number,
): { start: number; end: number } | null {
  if (total <= 0) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m) return null;
  const [, a, b] = m;
  if (a === "" && b === "") return null;
  let start: number;
  let end: number;
  if (a === "") {
    const suffix = Number.parseInt(b, 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else if (b === "") {
    start = Number.parseInt(a, 10);
    end = total - 1;
  } else {
    start = Number.parseInt(a, 10);
    end = Number.parseInt(b, 10);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0) start = 0;
  if (end >= total) end = total - 1;
  if (start > end) return null;
  return { start, end };
}
