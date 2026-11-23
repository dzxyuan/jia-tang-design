import path from "node:path";
import { NextRequest } from "next/server";
import { readUploadStream } from "@/lib/siteData";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".glb": "model/gltf-binary",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (segments.some((segment) => segment.includes(".."))) {
    return new Response("Not found", { status: 404 });
  }
  const relative = segments.join("/");
  const range = request.headers.get("range");

  try {
    const result = await readUploadStream(relative, range);
    if (!result) return new Response("Not found", { status: 404 });
    const ext = path.extname(relative).toLowerCase();
    const headers = new Headers({
      "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "cache-control": "public, max-age=300",
      "accept-ranges": result.acceptRanges,
    });
    if (result.contentLength) {
      headers.set("content-length", result.contentLength);
    }
    if (result.contentRange) {
      headers.set("content-range", result.contentRange);
    }
    return new Response(result.body, { status: result.status, headers });
  } catch (error) {
    return new Response(`读取失败：${(error as Error).message}`, {
      status: 500,
    });
  }
}
