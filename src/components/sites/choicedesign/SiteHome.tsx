"use client";

import { useEffect, useRef, useState } from "react";
import About from "./About";
import ContactButton from "./ContactButton";
import Cursor from "./Cursor";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import Intro from "./Intro";
import Menu from "./Menu";
import Partners from "./Partners";
import Recommend from "./Recommend";
import Works from "./Works";
import { SiteContentProvider, type SiteContent } from "./contentContext";
import { initHomeMotion } from "./motion";

export default function SiteHome({ content }: { content: SiteContent }) {
  const [mobile, setMobile] = useState(false);
  const [skin, setSkin] = useState<"black" | "white">("black");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 从作品详情页返回时，还原进入前的滚动位置（作品封面所在处）
  useEffect(() => {
    const raw = sessionStorage.getItem("works:back-y");
    if (raw === null) return;
    sessionStorage.removeItem("works:back-y");
    const y = Number(raw);
    if (!Number.isFinite(y) || y <= 0) return;
    const restore = () => window.scrollTo(0, y);
    const timers = [0, 120, 400, 900].map((delay) =>
      window.setTimeout(restore, delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // 首屏准备：字体 + 首屏图标 + GSAP 动效（含 pin）全部就绪后进度到 100%，
  // 再一次性触发文案入场，避免 GSAP pin 移动 DOM 导致动画重播两次
  useEffect(() => {
    if (mobile) {
      setProgress(100);
      setRevealed(true);
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    let raf = 0;
    let finished = 0;
    let target = 0; // 真实就绪进度
    let shown = 0; // 平滑后的显示进度
    let lastValue = -1;
    let lastTime = performance.now();
    let revealedOnce = false;
    const icons = content.hero.icons;
    const total = icons.length + 2; // 首屏图标 + 字体 + 动效

    // 数字均匀爬升：约 1.2s 从 0 走到 100，而不是按资源完成瞬间跳变
    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min(64, now - lastTime);
      lastTime = now;
      if (shown < target) {
        shown = Math.min(target, shown + Math.max(0.2, (100 / 1200) * dt));
      }
      const value = Math.floor(shown);
      if (value !== lastValue) {
        lastValue = value;
        setProgress(value);
      }
      if (shown >= 100) {
        if (!revealedOnce) {
          revealedOnce = true;
          window.setTimeout(() => {
            if (!disposed) setRevealed(true);
          }, 260);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const step = () => {
      finished += 1;
      if (disposed) return;
      target = finished >= total ? 100 : Math.min(100, (finished / total) * 100);
    };

    icons.forEach((icon) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        step();
      };
      const img = new window.Image();
      img.onload = done;
      img.onerror = done;
      img.src = icon.src;
    });

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(step, step);

    initHomeMotion({
      onSkin: setSkin,
      onFold: setHeaderVisible,
    }).then(
      (dispose) => {
        if (disposed) dispose();
        else cleanup = dispose;
        step();
      },
      step,
    );

    raf = requestAnimationFrame(tick);

    // 兜底：任何资源异常也不能一直卡在加载页
    const failSafe = window.setTimeout(() => {
      if (!disposed) target = 100;
    }, 8000);

    return () => {
      disposed = true;
      window.clearTimeout(failSafe);
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [mobile, content]);

  return (
    <SiteContentProvider value={content}>
    <div
      ref={rootRef}
      className={`fr-wrapper ${mobile ? "mobile" : "pc"} page-home`}
    >
      <Header
        skin={skin}
        visible={headerVisible}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <div className="fr-container">
        <Hero enter={revealed} />
        <Intro />
        <Works />
        <Partners />
        <Recommend />
        <About />
      </div>
      <Footer />
      <ContactButton dark={skin === "white"} />
      <Cursor />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div
        className={`mod-loading${revealed ? " leave" : ""}`}
        aria-hidden={revealed}
      >
        <div className="mod-loading-num">{progress}%</div>
        <div className="mod-loading-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="mod-loading-label">Loading</div>
      </div>
    </div>
    </SiteContentProvider>
  );
}
