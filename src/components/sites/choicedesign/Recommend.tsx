"use client";

import { useEffect, useRef } from "react";
import { useSiteContent } from "./contentContext";

export default function Recommend() {
  const recommend = useSiteContent().recommend;
  const videoRef = useRef<HTMLVideoElement>(null);

  // 只在模块进入视口时播放，离开即暂停，避免后台持续解码
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          // 非用户手势触发的 play 可能被自动播放策略拒绝：失败则强制静音后重试
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <div className="mod-recommend" id="recommend">
      <div className="recommend-background">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={recommend.poster}
        >
          <source src={recommend.video} type="video/mp4" />
        </video>
      </div>
      <div className="recommend-wrap">
        <div className="recommend-inner">
          <div className="recommend-title" />
          <div
            className="btn-more"
            onClick={() => window.open(recommend.moreLink, "_blank")}
          >
            <span>{recommend.moreText}</span>
          </div>
        </div>
      </div>
      <div className="recommend-foot">
        <div className="recommend-foot-left">{recommend.footLeft}</div>
        <div className="recommend-foot-right">
          {recommend.footRight.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
