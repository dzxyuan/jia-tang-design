export type PartnerLogo = { src: string };

/**
 * 3×5 模式的固定 15 个位置（3 行 × 5 列）。
 * 后台可单独配置（partners.large）；没有配置时用原 48 个里的前 15 个兜底，
 * 保证老数据切到 3×5 时不会空白。
 */
export function getLargePartnerRows(partners: any): PartnerLogo[][] {
  const stored = partners?.large;
  const flat: PartnerLogo[] = (partners?.groups ?? []).flat();
  return [0, 1, 2].map((row) =>
    [0, 1, 2, 3, 4].map((col) => {
      const saved = stored?.[row]?.[col];
      if (saved && typeof saved.src === "string") return saved;
      return flat[row * 5 + col] ?? { src: "" };
    }),
  );
}
