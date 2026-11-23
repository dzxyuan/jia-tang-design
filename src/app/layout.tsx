import type { Metadata } from "next";
import { getSiteContent } from "@/lib/siteData";
import "./globals.css";

// 内容来自远程存储（Supabase），所有页面需运行时动态读取，
// 避免构建期静态预渲染触发 no-store fetch 的 Dynamic Server Usage。
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content.meta.title,
    description: content.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = await getSiteContent();
  const primary = (content.brand?.colors?.primary?.trim() || "#614FFD").toLowerCase();
  // 把 #RRGGBB 转成 "R, G, B" 供 --ui-brand1 使用（brand1 = rgb(var(--ui-brand1))）
  const hex = primary.startsWith("#") ? primary.slice(1) : primary;
  const fullHex =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.padEnd(6, "0");
  const r = parseInt(fullHex.slice(0, 2), 16) || 0;
  const g = parseInt(fullHex.slice(2, 4), 16) || 0;
  const b = parseInt(fullHex.slice(4, 6), 16) || 0;
  const rgb = `${r}, ${g}, ${b}`;
  return (
    <html
      lang="zh-CN"
      style={
        {
          ["--color-brand2" as any]: primary,
          ["--ui-brand1" as any]: rgb,
          ["--color-brand1" as any]: `rgb(${rgb})`,
        } as React.CSSProperties
      }
    >
      <body>{children}</body>
    </html>
  );
}
