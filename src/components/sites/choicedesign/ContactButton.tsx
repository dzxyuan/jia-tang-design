"use client";

import { useSiteContent } from "./contentContext";

export default function ContactButton({ dark }: { dark: boolean }) {
  const { contactButton, contact } = useSiteContent();

  return (
    <div
      className={`contact-button${dark ? " dark" : ""}`}
      onClick={() => window.open(contact.link, "_blank")}
    >
      <div className="contact-button-svg">
        <svg viewBox="0 0 100 100">
          <defs>
            <path
              id="contact-circle"
              d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
            />
          </defs>
          <text
            fill="currentColor"
            fontSize="8.6"
            letterSpacing="2.4"
            fontFamily="en_content, sans-serif"
          >
            <textPath href="#contact-circle">
              {contactButton.text}&nbsp;
            </textPath>
          </text>
        </svg>
      </div>
      <div className="contact-button-img">
        <img src={contactButton.image} alt="" />
      </div>
    </div>
  );
}
