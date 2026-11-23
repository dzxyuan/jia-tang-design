"use client";

import { useRouter } from "next/navigation";
import { useSiteContent } from "./contentContext";

export default function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const SITE_CONTENT = useSiteContent();
  const navItems = SITE_CONTENT.nav;

  const go = (target: string) => {
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else router.push(`/${target}`);
    onClose();
  };

  return (
    <div className={`mod-nav${open ? " show" : ""}`}>
      <ul className="nav-list">
        {navItems.map((item, i) => (
          <li
            className={`nav-item${i === 0 ? " active" : ""}`}
            key={item.title}
            onClick={() => go(item.target)}
          >
            <span className="nav-title">{item.title}</span>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 12L10 7L15 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </li>
        ))}
      </ul>
      <img className="cat" src={SITE_CONTENT.menu.cat} alt="" />
    </div>
  );
}
