// ============================================================
// 内容配置入口
// - 文案、图片路径都在 siteContent.json（可用 /admin 可视化后台修改）
// - 素材文件放在 public/sites/choicedesign/ 下
// - 路径写法：/sites/choicedesign/xxx 对应 public/sites/choicedesign/xxx
// ============================================================

import raw from "./siteContent.json";

export const SITE = "/sites/choicedesign";
export const ASSETS = `${SITE}/assets`;

export const SPRITE = `${ASSETS}/sprite.svg`;
export const LOGO_SYMBOL = "04dc25b799ea521a3e09e9d548f9140e";
export const WORKS_SYMBOL = "0b61e9ced43e8a634dc2ecba9b57c4a1";

export type IntroItem = {
  title: string;
  lines: string[];
  en: string[];
  className: string;
  isForward: boolean;
  /** 小标题字号（rem），不填用默认 0.4 */
  titleSize?: number;
  /** 正文字号（rem），不填用默认 0.9 */
  fontSize?: number;
  /** 每行单独字号（rem），按下标对应 lines，null 表示跟随 fontSize */
  lineSizes?: (number | null)[];
  /** 每行单独行间距（rem），按下标对应 lines，null 表示用默认间距 */
  lineGaps?: (number | null)[];
};

export type WorkItem = {
  id: string;
  title: string;
  labels: string[];
  cover: string;
  href: string;
};

export const SITE_CONTENT = raw;

export const CONTACT_LINK = SITE_CONTENT.contact.link;
export const INTRO_ITEMS = SITE_CONTENT.intro.items;
export const CASE_ITEMS = SITE_CONTENT.works.items as WorkItem[];
export const CASE_CATEGORIES = SITE_CONTENT.works.categories;
export const HERO_ICONS = SITE_CONTENT.hero.icons;
export const PARTNER_GROUPS = SITE_CONTENT.partners.groups;
export const SOCIAL_LINKS = SITE_CONTENT.contact.socials;
export const CONTACTS = SITE_CONTENT.contact.rows;
export const MENU_ITEMS = SITE_CONTENT.nav;
