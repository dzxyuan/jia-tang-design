"use client";

import Link from "next/link";
import { useState } from "react";
import { useSiteContent } from "./contentContext";

export default function Works() {
  const [active, setActive] = useState(0);
  const { categories, items, sprite } = useSiteContent().works;

  // 记住进入详情页前的滚动位置，返回时用于还原作品封面所在位置
  const markFromHome = () => {
    sessionStorage.setItem("works:from-home", "1");
    sessionStorage.setItem("works:click-y", String(window.scrollY));
  };

  return (
    <div className="mod-case" id="case">
      <div className="case-background" />
      <div className="case-wrap">
        <div className="case-title">
          <svg viewBox="0 0 4863 617">
            <use href={sprite} />
          </svg>
        </div>
        <div className="case-list" style={{ paddingLeft: "3rem" }}>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <div className="case-item-wrap" onClick={markFromHome}>
                  <Link
                    className="case-item-link"
                    href={item.href}
                    aria-label={item.title}
                  >
                    <div className="case-item-pic">
                      <div className="ui-image">
                        <img
                          className="ui-image-pic"
                          src={item.cover}
                          alt={item.title}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </Link>
                  <div className="case-item-bottom">
                    <Link className="case-item-title" href={item.href}>
                      {item.title}
                    </Link>
                    <div className="case-item-label">
                      {item.labels.slice(0, 2).map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="case-menu">
          <ul>
            {categories.map((label, i) => (
              <li
                className={`case-menu-item${active === i ? " active" : ""}`}
                key={label}
                onClick={() => setActive(i)}
              >
                <span className="case-menu-text">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
