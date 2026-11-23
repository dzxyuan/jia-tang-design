import SiteHome from "@/components/sites/choicedesign/SiteHome";
import { getSiteContent } from "@/lib/siteData";

// 内容在每次请求时从数据目录读取，后台修改后刷新页面即可生效
export const dynamic = "force-dynamic";

export default async function Page() {
  const content = await getSiteContent();
  return <SiteHome content={content} />;
}
