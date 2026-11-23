type MotionOptions = {
  onSkin: (skin: "black" | "white") => void;
  onFold: (visible: boolean) => void;
};

export async function initHomeMotion({ onSkin, onFold }: MotionOptions) {
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  const { ScrollToPlugin } = await import("gsap/ScrollToPlugin");
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* intro 三段文案：直接按滚动位置推断，不依赖 ScrollTrigger 事件的触发时机。
     这样"刚好停在 intro 顶部"（progress 仍为 0）时第一组文案也能被激活。 */
  const introItems = Array.from(
    document.querySelectorAll<HTMLElement>(".introduce-item"),
  );
  let introStage = -1;
  const setIntroStage = (next: number) => {
    if (next === introStage) return;
    introStage = next;
    introItems.forEach((item, i) => item.classList.toggle("active", i === next));
  };
  const syncIntroStage = () => {
    const intro = document.querySelector<HTMLElement>(".mod-introduce");
    const caseEl = document.querySelector<HTMLElement>(".mod-case");
    if (!intro || !caseEl) return;
    const start = intro.offsetTop;
    const end = caseEl.offsetTop - window.innerHeight;
    const y = window.scrollY;
    if (y < start - 1) {
      setIntroStage(-1);
      return;
    }
    if (y > end + 1) return;
    const p = end > start ? (y - start) / (end - start) : 1;
    setIntroStage(p < 0.35 ? 0 : p < 0.7 ? 1 : 2);
  };

  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        onFold(!(y > 160 && self.direction === 1));
      },
    });

    /* ---------------- KV ---------------- */
    ScrollTrigger.create({
      trigger: ".mod-kv",
      start: "center center",
      end: "center+=1000px center",
      pin: true,
      scrub: true,
    });

    gsap.fromTo(
      ".mod-kv .kv-title-2",
      { x: 0 },
      {
        x: "7.5rem",
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".mod-kv .kv-wrap",
          scrub: true,
          start: "center center",
          end: "center+=800px center",
        },
      },
    );
    gsap.fromTo(
      [
        ".mod-kv .kv-title-1",
        ".mod-kv .kv-title-3",
        ".mod-kv .kv-pic",
        ".mod-kv .kv-title-brackets",
      ],
      { x: 0 },
      {
        x: "-0.5rem",
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".mod-kv .kv-wrap",
          scrub: true,
          start: "center center",
          end: "center+=800px center",
        },
      },
    );

    ScrollTrigger.create({
      trigger: ".mod-kv .kv-wrap",
      scrub: true,
      start: "center+=200px center",
      end: () =>
        `center+=${1000 + document.documentElement.clientHeight}px center`,
      toggleClass: { className: "enter", targets: ".kv-title-bottom" },
    });

    const kvTl = gsap.timeline();
    kvTl.fromTo(
      ".mod-kv .kv-title-bottom-1",
      { x: 0 },
      { x: "0.3rem", ease: "none", duration: 0.1 },
      0,
    );
    kvTl.fromTo(
      ".mod-kv .kv-title-bottom-2",
      { x: 0 },
      { x: "13.3rem", ease: "none" },
      0,
    );
    kvTl.fromTo(
      ".mod-kv .kv-pic li",
      { x: -20, scale: 0, opacity: 0 },
      {
        x: 0,
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.6)",
        stagger: 0.07,
      },
      0,
    );
    ScrollTrigger.create({
      trigger: ".mod-kv .kv-wrap",
      scrub: true,
      start: "center+=200px center",
      end: "center+=1000px center",
      animation: kvTl,
    });

    const kvFade = gsap.timeline();
    kvFade.fromTo(
      ".kv-title-1",
      { y: 0, opacity: 1 },
      { y: -300, opacity: 0, ease: "none" },
      0,
    );
    kvFade.fromTo(
      ".kv-title-2",
      { y: 0, opacity: 1 },
      { y: -300, opacity: 0, ease: "none" },
      0.1,
    );
    kvFade.fromTo(
      [".kv-title-3", ".kv-title-brackets", ".mod-kv .kv-pic"],
      { y: 0, opacity: 1 },
      { y: -300, opacity: 0, ease: "none" },
      0.2,
    );
    ScrollTrigger.create({
      trigger: ".mod-kv .kv-wrap",
      scrub: true,
      start: "center+=900px center",
      end: () =>
        `bottom+=${1000 + document.documentElement.clientHeight}px top`,
      animation: kvFade,
    });

    /* ---------------- INTRODUCE ---------------- */
    // intro fixed 无缝衔接 case fixed：intro fixed 延长到 case.top 到 viewport.bottom 时才结束
    ScrollTrigger.create({
      trigger: ".mod-introduce",
      start: "top top",
      end: () => {
        const intro = document.querySelector(".mod-introduce") as HTMLElement | null;
        const caseEl = document.querySelector(".mod-case") as HTMLElement | null;
        if (intro && caseEl) {
          // intro start 绝对 scrollY = intro.offsetTop (top top)
          // case start 绝对 scrollY = case.offsetTop - vh (top bottom)
          // intro end 相对 intro start = caseStart - introStart
          const introStart = intro.offsetTop;
          const caseStart = caseEl.offsetTop - window.innerHeight;
          return `+=${Math.max(0, caseStart - introStart)}`;
        }
        return "bottom top";
      },
      toggleClass: { className: "fixed", targets: ".mod-introduce" },
    });

    // intro 三段文案的激活统一由 syncIntroStage（scroll 监听）处理，见函数上方说明


    /* ---------------- CASE ---------------- */
    const caseEl = () => document.querySelector(".mod-case");
    // 模块进入视口的第一刻就加 enter，遮罩图 0.5s 从中心放大（换肤仍按贴顶时机）
    ScrollTrigger.create({
      trigger: ".mod-case",
      start: "top bottom",
      end: "bottom bottom",
      toggleClass: { className: "fixed", targets: ".mod-case" },
      onEnter: () => {
        caseEl()?.classList.remove("leave");
        caseEl()?.classList.add("enter");
      },
      onEnterBack: () => {
        caseEl()?.classList.remove("leave");
        caseEl()?.classList.add("enter");
      },
      onLeave: () => {
        caseEl()?.classList.add("leave");
        caseEl()?.classList.remove("enter");
      },
      onLeaveBack: () => {
        caseEl()?.classList.add("leave");
        caseEl()?.classList.remove("enter");
      },
    });

    const caseTl = gsap.timeline();
    caseTl.fromTo(
      ".case-title",
      { x: 0 },
      {
        x: () => {
          const el = document.querySelector<HTMLElement>(".case-title");
          const width = el ? el.clientWidth : 0;
          return width ? -width + window.innerWidth / 1.5 : 0;
        },
        ease: "none",
      },
      0,
    );
    caseTl.fromTo(".case-list ul", { x: 0 }, { x: "-85%", ease: "none" }, 0.02);

    // 横向滚动 + 换肤仍从模块贴顶开始
    ScrollTrigger.create({
      trigger: ".mod-case",
      scrub: true,
      start: "top top",
      end: "bottom top",
      animation: caseTl,
      onEnter: () => onSkin("white"),
      onEnterBack: () => onSkin("white"),
      onLeaveBack: () => onSkin("black"),
    });

    /* ---------------- PARTNER ---------------- */
    ScrollTrigger.create({
      trigger: ".mod-partner",
      start: "top top",
      end: "bottom top",
      toggleClass: { className: "fixed", targets: ".mod-partner" },
    });

    const partnerIn = gsap.timeline();
    partnerIn.fromTo(
      ".mod-partner .partner-title",
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0 },
      0,
    );
    partnerIn.fromTo(
      ".mod-partner .partner-list-group",
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, stagger: 0.1 },
      0.1,
    );
    ScrollTrigger.create({
      trigger: ".mod-partner",
      start: "top+=200px bottom",
      end: "top center",
      animation: partnerIn,
    });

    const partnerOut = gsap.timeline();
    partnerOut.fromTo(
      ".mod-partner .partner-wrap",
      { opacity: 1, y: 0 },
      { opacity: 0, y: -300, ease: "none" },
    );
    ScrollTrigger.create({
      trigger: ".mod-partner",
      start: "top top",
      end: "top+=100% top",
      animation: partnerOut,
      scrub: true,
    });

    /* ---------------- RECOMMEND ---------------- */
    const rec = document.querySelector(".mod-recommend");
    ScrollTrigger.create({
      trigger: ".mod-recommend",
      start: "top bottom",
      end: "bottom top",
      onEnter: () => rec?.classList.add("enter"),
      onEnterBack: () => rec?.classList.add("enter"),
      onLeave: () => rec?.classList.remove("enter"),
      onLeaveBack: () => rec?.classList.remove("enter"),
    });
    const recTl = gsap.timeline();
    recTl.fromTo(
      ".recommend-inner .recommend-title",
      { y: 200, opacity: 0 },
      { y: 0, opacity: 1 },
      0,
    );
    recTl.fromTo(
      ".recommend-inner .btn-more",
      { y: 200, opacity: 0 },
      { y: 0, opacity: 1 },
      0.2,
    );
    ScrollTrigger.create({
      trigger: ".mod-recommend",
      scrub: true,
      start: "top center",
      end: "top top",
      animation: recTl,
    });

    /* ---------------- ABOUT ---------------- */
    ScrollTrigger.create({
      trigger: ".mod-about",
      start: "top top",
      end: "bottom top",
      toggleClass: { className: "fixed", targets: ".mod-about" },
    });

    const aboutTl = gsap.timeline();
    aboutTl.fromTo(
      ".about-title p",
      { y: 300, scale: 0.8, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, stagger: 0.1 },
      0,
    );
    aboutTl.fromTo(
      ".about-wrap .btn-more",
      { y: 300, scale: 0.8, opacity: 0 },
      { y: 0, scale: 1, opacity: 1 },
      0.2,
    );
    ScrollTrigger.create({
      trigger: ".mod-about",
      scrub: true,
      start: "top bottom",
      end: "top top",
      animation: aboutTl,
    });

    gsap.fromTo(
      ".about-inner",
      { y: 0 },
      {
        y: "-50%",
        scrollTrigger: {
          trigger: ".mod-about",
          scrub: true,
          start: "top+=200px top",
          end: "center top",
        },
      },
    );
  });

  ScrollTrigger.refresh();
  // 页面刷新/直接落地在某个滚动位置时，立刻按当前位置校正 intro 文案状态
  syncIntroStage();
  window.addEventListener("scroll", syncIntroStage, { passive: true });

  /* ---------------- KV → INTRODUCE 整屏吸附 ----------------
     过渡带内（KV 固定段结束 → intro 顶到视口顶、刚好铺满一屏）
     一次滚轮直接整屏定位，避免出现上半屏 KV / 下半屏 intro。*/
  let snapping = false;
  let snapTween: { kill: () => void } | null = null;

  const snapTo = (y: number) => {
    snapping = true;
    snapTween?.kill();
    snapTween = gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration: 0.9,
      ease: "power2.inOut",
      onComplete: () => {
        snapping = false;
        snapTween = null;
        syncIntroStage();
      },
    });
  };

  const onSnapWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    if (snapping) {
      event.preventDefault();
      return;
    }
    if (!event.deltaY) return;

    const introEl = document.querySelector<HTMLElement>(".mod-introduce");
    if (!introEl) return;

    const bandEnd = introEl.offsetTop; // intro 贴顶：刚好占满一屏
    const bandStart = bandEnd - window.innerHeight; // KV 固定段结束点
    const y = window.scrollY;
    if (y < bandStart - 1 || y > bandEnd + 1) return;

    const target = event.deltaY > 0 ? bandEnd : bandStart;
    if (Math.abs(y - target) < 2) return;

    event.preventDefault();
    snapTo(target);
  };

  window.addEventListener("wheel", onSnapWheel, { passive: false });

  /* 用滚动条拖拽 / 键盘 / 惯性滚动停在过渡带中间时，停下后自动吸附到最近的整屏位置，
     避免卡在半屏 KV + 半屏 intro 的空档（intro 文案还没激活的空白状态） */
  const snapBand = () => {
    const introEl = document.querySelector<HTMLElement>(".mod-introduce");
    if (!introEl) return null;
    const end = introEl.offsetTop;
    return { start: end - window.innerHeight, end };
  };
  const snapToNearest = () => {
    if (snapping) return;
    const band = snapBand();
    if (!band) return;
    const y = window.scrollY;
    if (y < band.start || y > band.end) return;
    const target = y - band.start <= band.end - y ? band.start : band.end;
    if (Math.abs(y - target) < 2) return;
    snapTo(target);
  };
  let idleTimer = 0;
  // 推荐视频区：停下时若只滚进/滚出一小段，吸附到刚好铺满一屏的位置，避免下方露出黑边
  const snapRecommend = () => {
    if (snapping) return false;
    const recEl = document.querySelector<HTMLElement>(".mod-recommend");
    if (!recEl) return false;
    const top = recEl.getBoundingClientRect().top + window.scrollY;
    const distance = Math.abs(window.scrollY - top);
    if (distance < 2 || distance > window.innerHeight * 0.6) return false;
    snapTo(top);
    return true;
  };
  // 合作伙伴：停在"刚好从视口顶部开始"的位置，避免上面露出上一屏的黑边、下面第三行被裁
  const snapPartner = () => {
    if (snapping) return false;
    const partnerEl = document.querySelector<HTMLElement>(".mod-partner");
    if (!partnerEl) return false;
    const top = partnerEl.getBoundingClientRect().top + window.scrollY;
    // 只有"还差一点没到伙伴区顶部"时才补上，避免把正在看上一屏的人强行拉下来
    const delta = top - window.scrollY;
    if (delta < 2 || delta > window.innerHeight * 0.5) return false;
    snapTo(top);
    return true;
  };
  const onSnapScroll = () => {
    if (snapping) return;
    const y = window.scrollY;
    const band = snapBand();
    if (band && y >= band.start && y <= band.end) {
      if (Math.abs(y - band.start) < 2 || Math.abs(y - band.end) < 2) return;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(snapToNearest, 160);
      return;
    }
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (snapping) return;
      if (snapPartner()) return;
      snapRecommend();
    }, 160);
  };
  window.addEventListener("scroll", onSnapScroll, { passive: true });

  return () => {
    window.removeEventListener("wheel", onSnapWheel);
    window.removeEventListener("scroll", onSnapScroll);
    window.removeEventListener("scroll", syncIntroStage);
    window.clearTimeout(idleTimer);
    snapTween?.kill();
    ctx.revert();
  };
}
