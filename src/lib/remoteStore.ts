// 外部存储适配层：Supabase Storage（私有桶）
// 配置环境变量后自动启用，未配置时回退到本地文件（仅适合本机开发）。
export const REMOTE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "") ?? "";
export const REMOTE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
export const REMOTE_BUCKET =
  process.env.SUPABASE_BUCKET?.trim() || "choice-data";

export const remoteEnabled = Boolean(REMOTE_URL && REMOTE_KEY);

function endpoint(kind: "object" | "authenticated", objectPath: string) {
  const encoded = objectPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return kind === "object"
    ? `${REMOTE_URL}/storage/v1/object/${REMOTE_BUCKET}/${encoded}`
    : `${REMOTE_URL}/storage/v1/object/authenticated/${REMOTE_BUCKET}/${encoded}`;
}

function authHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${REMOTE_KEY}`,
    apikey: REMOTE_KEY,
    ...extra,
  };
}

/** 读取文本对象；对象不存在时返回 null */
export async function readObject(objectPath: string): Promise<string | null> {
  const res = await fetch(endpoint("authenticated", objectPath), {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`存储读取失败（${res.status}）：${await res.text()}`);
  }
  return res.text();
}

/** 读取二进制对象 */
export async function readObjectBytes(objectPath: string): Promise<Uint8Array | null> {
  const res = await fetch(endpoint("authenticated", objectPath), {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`存储读取失败（${res.status}）：${await res.text()}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/** 读取对象为原始 Response（支持 Range，用于视频等大文件流式/分段读取） */
export async function fetchObject(
  objectPath: string,
  opts: { range?: string } = {},
): Promise<Response | null> {
  const res = await fetch(endpoint("authenticated", objectPath), {
    headers: authHeaders(opts.range ? { Range: opts.range } : undefined),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`存储读取失败（${res.status}）：${await res.text()}`);
  }
  return res;
}

/** 写入/覆盖对象 */
export async function writeObject(
  objectPath: string,
  body: string | Uint8Array,
  contentType: string,
) {
  const payload =
    typeof body === "string"
      ? body
      : new Blob([new Uint8Array(body)], { type: contentType });
  const res = await fetch(endpoint("object", objectPath), {
    method: "POST",
    headers: authHeaders({
      "x-upsert": "true",
      "content-type": contentType,
      "cache-control": "no-store",
    }),
    body: payload,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`存储写入失败（${res.status}）：${await res.text()}`);
  }
}
