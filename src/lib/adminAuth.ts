import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "jtadmin_session";
const SESSION_DAYS = 7;

/** 后台密码：生产环境通过 JTADMIN_ACCESS_CODE 配置（平台不允许含 PASSWORD 的变量名）；本地开发默认 admin */
export function getAdminPassword(): string {
  const configured = (
    process.env.JTADMIN_ACCESS_CODE ?? process.env.ADMIN_PASSWORD
  )?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? "" : "admin";
}

export function isPasswordConfigured(): boolean {
  return getAdminPassword().length > 0;
}

function secret() {
  return (
    process.env.JTADMIN_SESSION_SALT?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    `jtadmin::${getAdminPassword()}`
  );
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${sign(String(expires))}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  const expected = sign(expires);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(expires) > Date.now();
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function checkPassword(input: unknown): boolean {
  const password = getAdminPassword();
  if (!password || typeof input !== "string") return false;
  return timingSafeEqual(digest(input), digest(password));
}

/** 校验请求是否已登录 */
export function isAuthorized(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
};
