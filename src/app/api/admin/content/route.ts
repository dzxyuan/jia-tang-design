import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import {
  getSiteContent,
  getWorkDetails,
  saveSiteContent,
  saveWorkDetails,
} from "@/lib/siteData";

type FileKey = "site" | "works";

export const dynamic = "force-dynamic";

const UNAUTHORIZED = () =>
  NextResponse.json({ error: "请先登录后台" }, { status: 401 });

function isFileKey(value: unknown): value is FileKey {
  return value === "site" || value === "works";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return UNAUTHORIZED();

  const key = request.nextUrl.searchParams.get("file") ?? "site";
  if (!isFileKey(key)) {
    return NextResponse.json({ error: "未知的数据文件" }, { status: 400 });
  }

  try {
    const data = key === "site" ? await getSiteContent() : await getWorkDetails();
    // 显式声明 UTF-8，避免部分客户端把中文按单字节编码解析
    return new NextResponse(JSON.stringify(data), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `读取失败：${(error as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return UNAUTHORIZED();

  try {
    const body = (await request.json()) as { file?: string; data?: unknown };
    const key = body.file;
    if (!isFileKey(key)) {
      return NextResponse.json({ error: "未知的数据文件" }, { status: 400 });
    }
    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json({ error: "数据格式不正确" }, { status: 400 });
    }
    if (key === "site") await saveSiteContent(body.data);
    else await saveWorkDetails(body.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: `保存失败：${(error as Error).message}` },
      { status: 500 },
    );
  }
}
