import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
  isPasswordConfigured,
  sessionCookieOptions,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { error: "后台密码未配置（缺少 JTADMIN_ACCESS_CODE）" },
      { status: 500 },
    );
  }

  let password: unknown = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = body.password;
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}
