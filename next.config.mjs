// 使用 .mjs 而非 .ts：生产环境运行时没有 TypeScript，
// Next 加载 next.config.ts 会尝试 npm 安装 typescript 导致进程退出。
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  // 关闭 dev StrictMode 的双挂载：否则首屏文字入场动画会因组件重挂载重放，显得不丝滑
  reactStrictMode: false,
  images: { unoptimized: true },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
