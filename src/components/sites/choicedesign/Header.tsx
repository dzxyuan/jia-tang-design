"use client";

import { LOGO_SYMBOL, SPRITE } from "./content";
import { useSiteContent } from "./contentContext";

type HeaderProps = {
  skin: "black" | "white";
  visible: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  /** 中间路由名文案（原站非首页会显示 WorkDetail / More Things 等） */
  center?: string;
};

export default function Header({
  skin,
  visible,
  menuOpen,
  onToggleMenu,
  center = "",
}: HeaderProps) {
  const SITE_CONTENT = useSiteContent();
  const classes = [
    "fr-header",
    menuOpen ? "header-active" : skin === "white" ? "header-white" : "header-black",
    visible ? "" : "fr-header--fold",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes}>
      <div className="fr-header-left">
        <span>
          {SITE_CONTENT.brand.logo.image ? (
            <img className="header-logo-img" src={SITE_CONTENT.brand.logo.image} alt={SITE_CONTENT.brand.name} />
          ) : (
            <svg viewBox="0 0 157 30" width="100%" height="100%">
              <use href={`${SPRITE}#${LOGO_SYMBOL}`} />
            </svg>
          )}
        </span>
      </div>
      <div className="fr-header-center">{center}</div>
      <div className="fr-header-right">
        <a
          className="btn-talk"
          href={SITE_CONTENT.contact.link}
          target="_blank"
          rel="noreferrer"
        >
          <span>{SITE_CONTENT.contact.talk}</span>
        </a>
        <a
          className={`btn-nav${menuOpen ? " active" : ""}`}
          onClick={onToggleMenu}
          role="button"
          aria-label="菜单"
          aria-expanded={menuOpen}
        >
          <span className="nav-line">
            <span className="nav-line-1" />
            <span className="nav-line-2" />
            <span className="nav-line-3" />
          </span>
          <span
            className="nav-icon"
            style={
              SITE_CONTENT.brand?.navIcon
                ? { backgroundImage: `url(${SITE_CONTENT.brand.navIcon})` }
                : undefined
            }
          />
        </a>
      </div>
    </header>
  );
}
