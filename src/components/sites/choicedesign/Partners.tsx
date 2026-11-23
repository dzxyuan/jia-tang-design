"use client";

import { useEffect, useState } from "react";
import { getLargePartnerRows } from "./partnerLayout";
import { useSiteContent } from "./contentContext";

export default function Partners() {
  const partners = useSiteContent().partners;
  const large = partners.layout === "large";

  // 3×5：固定 15 个位置（3 行 × 5 列），与后台一一对应
  const rows = large ? getLargePartnerRows(partners) : partners.groups;
  const allSrcs = rows.flat().map((item) => item.src).filter(Boolean);

  // 点击 logo 全屏预览，左右切换
  const [preview, setPreview] = useState<number | null>(null);
  const openPreview = (src: string) => {
    const index = allSrcs.indexOf(src);
    if (index >= 0) setPreview(index);
  };
  const step = (delta: number) =>
    setPreview((index) =>
      index === null
        ? index
        : (index + delta + allSrcs.length) % allSrcs.length,
    );

  useEffect(() => {
    if (preview === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("is-img-preview");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      document.documentElement.classList.remove("is-img-preview");
    };
  }, [preview]);

  return (
    <div className={`mod-partner${large ? " partner-large" : ""}`} id="partner">
      <div className="partner-wrap">
        <div className="partner-title">
          {partners.titleCn}
          <div className="partner-title-en">
            {partners.titleEn.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className={`partner-list${large ? " large" : ""}`}>
          {rows.map((group, gi) => (
            <div className="partner-list-group" key={gi}>
              <div className="partner-list-scroll">
                {[0, 1].map((copy) => (
                  <ul key={copy}>
                    {group.map((partner, pi) => (
                      <li
                        key={`${copy}-${gi}-${pi}`}
                        onClick={() => openPreview(partner.src)}
                      >
                        <div className="ui-image">
                          <img
                            className="ui-image-pic"
                            src={partner.src}
                            alt=""
                            loading="lazy"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {preview !== null && (
        <div
          className="work-preview"
          role="dialog"
          aria-modal="true"
          aria-label="合作伙伴预览"
          onClick={() => setPreview(null)}
        >
          <div
            className="work-preview-stage"
            onClick={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) setPreview(null);
            }}
          >
            <img
              className="work-preview-img"
              src={allSrcs[preview]}
              alt=""
              draggable={false}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          <div className="work-preview-count">
            {preview + 1} / {allSrcs.length}
          </div>
          <button
            type="button"
            className="work-preview-close"
            aria-label="关闭预览"
            onClick={() => setPreview(null)}
          >
            ×
          </button>
          {allSrcs.length > 1 && (
            <>
              <button
                type="button"
                className="work-preview-arrow prev"
                aria-label="上一张"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="work-preview-arrow next"
                aria-label="下一张"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
