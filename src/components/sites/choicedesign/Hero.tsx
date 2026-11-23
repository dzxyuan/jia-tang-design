"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSiteContent } from "./contentContext";

function AniText({ text }: { text: string }) {
  return (
    <span className="ani-text">
      {text.split("").map((char, i) => (
        <span className="ani-text-item" key={`${char}-${i}`}>
          {char}
        </span>
      ))}
    </span>
  );
}

function Bracket() {
  return (
    <svg
      width="430"
      height="262"
      viewBox="0 0 430 262"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 30 27 C 30 60 30 100 30 120 C 40 120 60 120 95 120"
        stroke="currentColor"
        strokeWidth="20"
      />
    </svg>
  );
}

export default function Hero({ enter }: { enter: boolean }) {
  const { words, icons, tips, video } = useSiteContent().hero;

  const [videoOpen, setVideoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeVideo = useCallback(() => setVideoOpen(false), []);

  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVideo();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [videoOpen, closeVideo]);

  const renderTips = (
    <span
      className="kv-pic-tips"
      style={
        tips?.image
          ? { backgroundImage: `url(${tips.image})` }
          : undefined
      }
    >
      {!tips?.image && tips?.text ? (
        <span className="kv-pic-tips-text">{tips.text}</span>
      ) : null}
    </span>
  );

  const wrapTips = tips?.href ? (
    <a
      href={tips.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {renderTips}
    </a>
  ) : (
    renderTips
  );

  const modal =
    mounted && videoOpen && video
      ? createPortal(
          <div className="mod-video-modal open" onClick={closeVideo}>
            <div className="mod-video-modal-box">
              <button
                type="button"
                className="mod-video-modal-close"
                aria-label="关闭视频"
                onClick={closeVideo}
              >
                ✕
              </button>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={video}
                controls
                autoPlay
                playsInline
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`mod-kv${enter ? " enter" : ""}`} id="kv">
      <div className="kv-wrap">
        <div className="kv-bd">
          <div className="kv-title">
            <div className="kv-title-text kv-title-1">
              <AniText text={words[0]} />
            </div>
            <div className="kv-title-text kv-title-2">
              <AniText text={words[1]} />
            </div>
            <div className="kv-title-text kv-title-3">
              <AniText text={words[2]} />
            </div>
            <div className="kv-title-brackets">
              <div className="kv-title-bottom kv-title-bottom-1">
                <span className="kv-title-icon">
                  <Bracket />
                </span>
              </div>
              <div className="kv-title-bottom kv-title-bottom-2">
                <span className="kv-title-icon">
                  <Bracket />
                </span>
              </div>
            </div>
            <div className="kv-pic">
              <ul>
                {icons.map((icon, i) => {
                  const isVideoBtn = i === 4 && Boolean(video);
                  return (
                    <li
                      key={icon.src}
                      className={isVideoBtn ? "kv-pic-video-btn" : undefined}
                      onClick={isVideoBtn ? () => setVideoOpen(true) : undefined}
                      role={isVideoBtn ? "button" : undefined}
                      tabIndex={isVideoBtn ? 0 : undefined}
                      aria-label={isVideoBtn ? "播放介绍视频" : undefined}
                      onKeyDown={
                        isVideoBtn
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setVideoOpen(true);
                              }
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`ui-image${i === 4 ? " ui-image-light" : ""}`}
                        style={
                          i === 4
                            ? { maskImage: `url(${icon.src})` }
                            : undefined
                        }
                      >
                        <img
                          className="ui-image-pic"
                          src={icon.src}
                          alt=""
                          loading="lazy"
                        />
                      </div>
                      {i === 4 && tips && wrapTips}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {modal}
    </div>
  );
}
