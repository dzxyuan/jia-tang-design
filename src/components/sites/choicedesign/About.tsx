"use client";

import { useSiteContent } from "./contentContext";

export default function About() {
  const about = useSiteContent().about;

  return (
    <div className="mod-about" id="about">
      <div className="about-wrap">
        <div className="about-inner">
          <div className="about-title">
            {about.title.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div
            className="btn-more"
            onClick={() => window.open(about.moreLink, "_blank")}
          >
            <span>{about.moreText}</span>
          </div>
        </div>
        <div className="about-image" />
      </div>
    </div>
  );
}
