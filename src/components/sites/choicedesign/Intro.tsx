"use client";

import { type IntroItem } from "./content";
import { useSiteContent } from "./contentContext";
import IntroScene from "./IntroScene";

type AniTextProps = {
  text: string;
  time: number;
  delay: number;
  isForward: boolean;
  fontSize?: number;
  gap?: number | null;
};

// 与原站 TextAniSplit 一致：按字符拆分，用 animation-delay 做逐字入场
function AniText({ text, time, delay, isForward, fontSize, gap }: AniTextProps) {
  const chars = Array.from(text);
  return (
    <span
      className="ani-text ani-text-transition"
      style={{
        ...(fontSize ? { fontSize: `${fontSize}rem` } : {}),
        ...(typeof gap === "number" ? { marginTop: `${gap}rem` } : {}),
      }}
    >
      {chars.map((char, i) => {
        const order = isForward ? i : chars.length - i + 1;
        return (
          <span
            className="ani-text-item"
            key={`${char}-${i}`}
            style={{ animationDelay: `${(time + delay * order).toFixed(3)}s` }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

type ExperienceItem = {
  period: string;
  company: string;
  role: string;
  desc: string;
};

type Experience = {
  title: string;
  titleEn: string[];
  items: ExperienceItem[];
};

export default function Intro() {
  const intro = useSiteContent().intro;
  const INTRO_ITEMS = intro.items as IntroItem[];
  const experience = intro.experience as Experience;

  const renderItem = (item: IntroItem) => (
    <div className={`introduce-item ${item.className}`} key={item.title}>
      <div
        className="introduce-title"
        style={item.titleSize ? { fontSize: `${item.titleSize}rem` } : undefined}
      >
        <AniText text={item.title} time={0} delay={0.05} isForward={item.isForward} />
      </div>
      <div
        className="introduce-description"
        style={item.fontSize ? { fontSize: `${item.fontSize}rem` } : undefined}
      >
        {item.lines.map((line, i) => (
          <AniText
            text={line}
            time={(i + 1) * 0.05}
            delay={0.02}
            isForward={item.isForward}
            fontSize={item.lineSizes?.[i] ?? item.fontSize}
            gap={item.lineGaps?.[i]}
            key={`${item.title}-cn-${i}`}
          />
        ))}
      </div>
      <div className="introduce-en">
        {item.en.map((line, i) => (
          <AniText
            text={line}
            time={item.lines.length * 0.02 + (i + 1) * 0.05}
            delay={0.02}
            isForward={item.isForward}
            key={`${item.title}-en-${i}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mod-introduce" id="introduce">
      <div className="introduce-background">
        <IntroScene />
      </div>
      <div className="introduce-wrap">
        <div className="introduce-list">
          {renderItem(INTRO_ITEMS[0])}
          <div className="introduce-item item-2 introduce-experience">
            <div className="exp-head">
              <span className="exp-title">
                <AniText
                  text={experience.title}
                  time={0}
                  delay={0.04}
                  isForward
                />
              </span>
              <span className="exp-en">
                <AniText
                  text={experience.titleEn.join(" ")}
                  time={0.28}
                  delay={0.02}
                  isForward
                />
              </span>
            </div>
            <div className="exp-list">
              {experience.items.map((job, i) => (
                <div className="exp-item" key={`${job.company}-${i}`}>
                  <span className="exp-dot" />
                  <div className="exp-period">
                    <AniText
                      text={job.period}
                      time={0.35 + i * 0.16}
                      delay={0.012}
                      isForward
                    />
                  </div>
                  <div className="exp-company">
                    <AniText
                      text={job.company}
                      time={0.42 + i * 0.16}
                      delay={0.012}
                      isForward
                    />
                  </div>
                  <div className="exp-role">
                    <AniText
                      text={job.role}
                      time={0.5 + i * 0.16}
                      delay={0.012}
                      isForward
                    />
                  </div>
                  <p className="exp-desc">
                    <AniText
                      text={job.desc}
                      time={0.58 + i * 0.16}
                      delay={0.004}
                      isForward
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
          {renderItem(INTRO_ITEMS[1])}
        </div>
      </div>
      <div className="introduce-foot">
        <div className="introduce-foot-left">{intro.footLeft}</div>
        <div className="introduce-foot-right">{intro.footRight}</div>
      </div>
    </div>
  );
}
