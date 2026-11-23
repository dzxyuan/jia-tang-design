import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkDetailPage from "@/components/sites/choicedesign/WorkDetailPage";
import { SiteContentProvider } from "@/components/sites/choicedesign/contentContext";
import type { WorkRecommendItem } from "@/components/sites/choicedesign/workDetails";
import { getSiteContent, getWorkDetails } from "@/lib/siteData";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const details = await getWorkDetails();
  const detail = details[id as keyof typeof details];
  if (!detail) return {};
  return {
    title: `${detail.title} | CHOICE 俏思品牌设计`,
    description: `${detail.client} · ${detail.tags.join(" / ")}`,
  };
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  const [content, details] = await Promise.all([
    getSiteContent(),
    getWorkDetails(),
  ]);
  const detail = details[id as keyof typeof details];
  if (!detail) notFound();
  const recommend: WorkRecommendItem[] = Object.keys(details).map((key) => ({
    id: key,
    title: details[key as keyof typeof details].title,
    cover: details[key as keyof typeof details].cover,
  }));
  return (
    <SiteContentProvider value={content}>
      <WorkDetailPage detail={detail} recommend={recommend} />
    </SiteContentProvider>
  );
}
