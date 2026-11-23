// 作品详情数据：可用 /admin 可视化后台修改（正文富文本/图片较多，单独放 JSON）
import raw from "./workDetails.json";

export type WorkDetailData = {
  id: string;
  title: string;
  titleEn: string;
  client: string;
  year: string;
  tags: string[];
  cover: string;
  /** 详情正文富文本（图片、视频已指向本地素材） */
  content: string;
};

export type WorkRecommendItem = { id: string; title: string; cover: string };

export const WORK_DETAILS = raw as unknown as Record<string, WorkDetailData>;

export const WORK_DETAIL_IDS = Object.keys(WORK_DETAILS);

// “其他精选案例”列表：按作品加入顺序展示
export const WORK_RECOMMEND: WorkRecommendItem[] = WORK_DETAIL_IDS.map((id) => ({
  id,
  title: WORK_DETAILS[id].title,
  cover: WORK_DETAILS[id].cover,
}));
