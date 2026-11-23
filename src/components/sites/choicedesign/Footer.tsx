"use client";

import { useSiteContent } from "./contentContext";

export default function Footer() {
  const { contact, brand } = useSiteContent();

  return (
    <div className="fr-footer" id="footer">
      <div className="fr-footer-hd">
        <a href={contact.link} target="_blank" rel="noreferrer" aria-label="Let's Talk" />
      </div>
      <div className="fr-footer-bd">
        <div className="fr-footer-left">
          <div className="footer-location">
            {contact.location.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="footer-contact">
            <ul>
              {contact.rows.map((row) => (
                <li className="footer-contact-item" key={row.label}>
                  <span className="footer-contact-label">{row.label}</span>
                  <span className="footer-contact-value">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fr-footer-center">
          <div className="footer-name">{brand.sloganEn}</div>
          <div className="footer-slogan">{brand.sloganCn}</div>
          <div className="footer-link">
            {contact.socials.map((link) => (
              <div className="footer-link-icon" key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                  <img src={link.icon} alt={link.label} />
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="fr-footer-right">
          <div className="footer-qrcode">
            {contact.qrcodes.map((item, i) => (
              <div className="footer-qrcode-item" key={`${item.image}-${i}`}>
                <img src={item.image} alt={item.alt} />
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="fr-footer-ft">
        <div className="fr-footer-left">
          <div className="footer-description">{contact.copyright}</div>
        </div>
        <div className="fr-footer-center">
          <div className="footer-description">{contact.icp}</div>
        </div>
        <div className="fr-footer-right">
          <div className="footer-description">
            {contact.legal.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
