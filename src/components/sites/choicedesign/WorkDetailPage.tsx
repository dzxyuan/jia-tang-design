"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ContactButton from "./ContactButton";
import Cursor from "./Cursor";
import Footer from "./Footer";
import Header from "./Header";
import Menu from "./Menu";
import { type WorkDetailData, type WorkRecommendItem } from "./workDetails";

export default function WorkDetailPage({
  detail,
  recommend,
}: {
  detail: WorkDetailData;
  recommend: WorkRecommendItem[];
}) {
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState<{ srcs: string[]; index: number } | null>(
    null,
  );
  const previewOpen = preview !== null;
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState<"fit" | "width">("fit");
  const [previewNatural, setPreviewNatural] = useState({ w: 0, h: 0 });
  const [previewViewport, setPreviewViewport] = useState({ w: 0, h: 0 });
  const previewStageRef = useRef<HTMLDivElement | null>(null);

  const zoomBy = (factor: number) =>
    setPreviewZoom((zoom) =>
      Math.min(5, Math.max(0.5, Math.round(zoom * factor * 100) / 100)),
    );

  // 换图时重置缩放；预览打开期间跟踪窗口尺寸
  useEffect(() => {
    setPreviewZoom(1);
    setPreviewNatural({ w: 0, h: 0 });
  }, [previewOpen, preview?.index]);

  useEffect(() => {
    if (!previewOpen) return;
    const sync = () =>
      setPreviewViewport({ w: window.innerWidth, h: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [previewOpen]);

  // 预览时隐藏站点顶栏等悬浮元素
  useEffect(() => {
    if (!previewOpen) return;
    document.documentElement.classList.add("is-img-preview");
    return () => document.documentElement.classList.remove("is-img-preview");
  }, [previewOpen]);

  // Ctrl/⌘ + 滚轮缩放（长图仍可直接滚轮上下浏览）
  useEffect(() => {
    if (!previewOpen) return;
    const stage = previewStageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [previewOpen]);

  // 按当前模式 + 缩放比例算出图片显示宽度（宽高比由 height:auto 保持）
  const previewImgStyle = (() => {
    const { w: nw, h: nh } = previewNatural;
    if (!nw || !nh || !previewViewport.w) return undefined;
    const fitScale = Math.min(
      (previewViewport.w * 0.9) / nw,
      (previewViewport.h * 0.84) / nh,
    );
    const base =
      previewMode === "fit"
        ? fitScale
        : (previewViewport.w * 0.96) / nw;
    return {
      width: `${Math.round(nw * base * previewZoom)}px`,
      maxWidth: "none",
      maxHeight: "none",
    };
  })();

  // 从首页作品封面进来的：回到浏览器上一页并由首页还原滚动位置；
  // 直接打开详情页的：退回首页作品区
  const goBack = () => {
    if (sessionStorage.getItem("works:from-home")) {
      const y = Number(sessionStorage.getItem("works:click-y") ?? "0");
      sessionStorage.removeItem("works:from-home");
      sessionStorage.setItem("works:back-y", String(y));
      router.back();
      return;
    }
    router.push("/#case");
  };

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 与原站一致：竖版视频限制最大宽度
  useEffect(() => {
    const videos = document.querySelectorAll<HTMLVideoElement>(
      ".work-detail-content video",
    );
    const cleanups: (() => void)[] = [];
    videos.forEach((video) => {
      const mark = () => {
        if (!video.videoWidth || !video.videoHeight) return;
        video.classList.toggle("portrait", video.videoHeight > video.videoWidth);
      };
      if (video.readyState >= 1) {
        mark();
        return;
      }
      video.addEventListener("loadedmetadata", mark);
      cleanups.push(() => video.removeEventListener("loadedmetadata", mark));
    });
    return () => cleanups.forEach((fn) => fn());
  }, [detail.id]);

  // 正文图片点击 → 全屏预览（同一张原图，不做二次压缩）
  useEffect(() => {
    const root = document.querySelector(".work-detail-content");
    if (!root) return;
    const srcs = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
      .map((img) => img.getAttribute("src") ?? "")
      .filter(Boolean);
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      const src = (target as HTMLImageElement).getAttribute("src") ?? "";
      const index = srcs.indexOf(src);
      if (index < 0) return;
      setPreview({ srcs, index });
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [detail.id]);

  // 预览打开时：锁定页面滚动 + 支持 ← → 翻页、Esc 关闭
  useEffect(() => {
    if (!previewOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const step = (delta: number) =>
      setPreview((prev) =>
        prev
          ? {
              ...prev,
              index: (prev.index + delta + prev.srcs.length) % prev.srcs.length,
            }
          : prev,
      );
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "+" || event.key === "=") zoomBy(1.25);
      else if (event.key === "-" || event.key === "_") zoomBy(1 / 1.25);
      else if (event.key === "0") setPreviewZoom(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen]);

  return (
    <div className={`fr-wrapper ${mobile ? "mobile" : "pc"} page-workDetail`}>
      <Header
        skin="white"
        visible
        center="WorkDetail"
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <div className="fr-container">
        <div className="work-detail">
          <div className="work-detail-inner">
            <button
              type="button"
              className="page-back"
              onClick={goBack}
              aria-label="返回作品列表"
            />
            <div className="work-detail-header">
              <div className="work-detail-header-left">
                <div className="work-detail-tag">
                  <span>{detail.tags[0] ?? ""}</span>
                </div>
                <div className="work-detail-title-en">{detail.titleEn}</div>
                <div className="work-detail-title">{detail.title}</div>
              </div>
              <div className="work-detail-header-right">
                <ul className="work-detail-info">
                  <li className="work-detail-info-item">
                    <span className="work-detail-info-label">Client</span>
                    <span className="work-detail-info-text">{detail.client}</span>
                  </li>
                  <li className="work-detail-info-item">
                    <span className="work-detail-info-label">Year</span>
                    <span className="work-detail-info-text">{detail.year}-01-01</span>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className="work-detail-content"
              dangerouslySetInnerHTML={{ __html: detail.content }}
            />
            <div className="work-recommend">
              <div className="work-recommend-title">其他精选案例</div>
              <div className="work-recommend-list">
                <ul>
                  {recommend.map((item) => (
                    <li className="work-recommend-item" key={item.id}>
                      <Link href={`/works/${item.id}`} aria-label={item.title}>
                        <div className="work-recommend-item-img">
                          <img src={item.cover} alt={item.title} loading="lazy" />
                        </div>
                        <div className="work-recommend-item-inner">
                          <div className="work-recommend-item-inner-work">
                            {item.title}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ContactButton dark />
      <Cursor />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {preview && (
        <div
          className="work-preview"
          role="dialog"
          aria-modal="true"
          aria-label="作品图片预览"
          onClick={() => setPreview(null)}
        >
          <div
            ref={previewStageRef}
            className="work-preview-stage"
            onClick={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) setPreview(null);
            }}
          >
            <img
              className="work-preview-img"
              src={preview.srcs[preview.index]}
              alt=""
              draggable={false}
              style={previewImgStyle}
              onLoad={(event) =>
                setPreviewNatural({
                  w: event.currentTarget.naturalWidth,
                  h: event.currentTarget.naturalHeight,
                })
              }
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={() => setPreviewZoom((zoom) => (zoom > 1 ? 1 : 2))}
            />
          </div>
          <div
            className="work-preview-bar"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="work-preview-bar-btn"
              aria-label="缩小"
              onClick={() => zoomBy(1 / 1.25)}
            >
              −
            </button>
            <span className="work-preview-zoom">
              {Math.round(previewZoom * 100)}%
            </span>
            <button
              type="button"
              className="work-preview-bar-btn"
              aria-label="放大"
              onClick={() => zoomBy(1.25)}
            >
              ＋
            </button>
            <i className="work-preview-bar-sep" />
            <button
              type="button"
              className={`work-preview-bar-btn text ${
                previewMode === "fit" ? "is-on" : ""
              }`}
              onClick={() => setPreviewMode("fit")}
            >
              适应屏幕
            </button>
            <button
              type="button"
              className={`work-preview-bar-btn text ${
                previewMode === "width" ? "is-on" : ""
              }`}
              onClick={() => setPreviewMode("width")}
            >
              适应宽度
            </button>
          </div>
          <div className="work-preview-count">
            {preview.index + 1} / {preview.srcs.length}
          </div>
          <button
            type="button"
            className="work-preview-close"
            aria-label="关闭预览"
            onClick={() => setPreview(null)}
          >
            ×
          </button>
          {preview.srcs.length > 1 && (
            <>
              <button
                type="button"
                className="work-preview-arrow prev"
                aria-label="上一张"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreview((prev) =>
                    prev
                      ? {
                          ...prev,
                          index:
                            (prev.index - 1 + prev.srcs.length) %
                            prev.srcs.length,
                        }
                      : prev,
                  );
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
                  setPreview((prev) =>
                    prev
                      ? { ...prev, index: (prev.index + 1) % prev.srcs.length }
                      : prev,
                  );
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
