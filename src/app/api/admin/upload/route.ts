import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { saveUpload } from "@/lib/siteData";

const ALLOWED = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".glb"];

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".glb": "model/gltf-binary",
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "请先登录后台" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json(
        {
          error: `不支持的格式 ${ext}，请上传 png / jpg / webp / gif / svg / mp4 / glb`,
        },
        { status: 400 },
      );
    }

    const safeName = path
      .basename(file.name, ext)
      // Supabase Storage REST key 只允许 ASCII + 下划线/连字符；其他一律替换为 -
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const filename = `${Date.now()}-${safeName || "asset"}${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await saveUpload(
      filename,
      bytes,
      CONTENT_TYPES[ext] ?? file.type ?? "application/octet-stream",
    );

    return NextResponse.json({ ok: true, path: url });
  } catch (error) {
    return NextResponse.json(
      { error: `上传失败：${(error as Error).message}` },
      { status: 500 },
    );
  }
}
