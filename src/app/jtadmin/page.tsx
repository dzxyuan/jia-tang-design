"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import "./admin.css";
import { getLargePartnerRows } from "../../components/sites/choicedesign/partnerLayout";

type Msg = { type: "info" | "error"; text: string };

const SECTIONS = [
  { id: "help", label: "使用说明" },
  { id: "basic", label: "站点信息" },
  { id: "brand", label: "品牌信息" },
  { id: "contact", label: "联系方式 / 页脚" },
  { id: "hero", label: "首屏" },
  { id: "intro", label: "第二屏" },
  { id: "works", label: "作品列表" },
  { id: "partners", label: "合作伙伴" },
  { id: "recommend", label: "更多创意" },
  { id: "about", label: "关于" },
  { id: "detail", label: "作品详情" },
];

function setAt(obj: any, keys: (string | number)[], value: any) {
  const clone = structuredClone(obj);
  let cur: any = clone;
  for (let i = 0; i < keys.length - 1; i += 1) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
  return clone;
}

/* ---- 作品详情正文：纯文字段落提取 / 回写（不含图片、视频的 <p>） ---- */
const decodeText = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const isTextParagraph = (inner: string) => !/<(img|video|iframe)\b/i.test(inner);

function getParagraphs(html: string): string[] {
  return Array.from(html.matchAll(/<p>([\s\S]*?)<\/p>/g))
    .filter((m) => isTextParagraph(m[1]))
    .map((m) => decodeText(m[1]));
}

function setParagraph(html: string, index: number, value: string): string {
  let count = 0;
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (whole, inner: string) => {
    if (!isTextParagraph(inner)) return whole;
    const current = count;
    count += 1;
    if (current !== index) return whole;
    if (!value.trim()) return "";
    const safe = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<p>${safe}</p>`;
  });
}

function Text({
  label,
  value,
  onChange,
  hint,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  area?: boolean;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {hint ? <span className="hint">（{hint}）</span> : null}
      </label>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Img({
  label,
  value,
  onChange,
  onFile,
  onRemove,
  hidePath,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  onRemove?: () => void;
  hidePath?: boolean;
}) {
  return (
    <div className="img-field">
      {value ? (
        <a
          className="thumb"
          href={value}
          target="_blank"
          rel="noreferrer"
          title="点击查看大图"
        >
          <img src={value} alt={label} />
        </a>
      ) : (
        <span className="thumb empty">无图</span>
      )}
      <div className="meta">
        <span className="img-label">{label}</span>
        {hidePath ? null : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title="图片路径"
          />
        )}
        <label className="upload-btn">
          上传替换
          <input
            type="file"
            accept="image/*,video/mp4"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {onRemove ? (
          <button type="button" className="mini-btn" onClick={onRemove}>
            删除
          </button>
        ) : null}
      </div>
    </div>
  );
}

function VideoField({
  label,
  value,
  onChange,
  onFile,
  onRemove,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="img-field">
      {value ? (
        <a
          className="thumb"
          href={value}
          target="_blank"
          rel="noreferrer"
          title="点击查看视频"
        >
          <video src={value} muted playsInline preload="metadata" />
        </a>
      ) : (
        <span className="thumb empty">无视频</span>
      )}
      <div className="meta">
        <span className="img-label">{label}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="视频地址"
          placeholder="视频地址，如 /api/uploads/sites/choicedesign/uploads/xxx.mp4"
        />
        <label className="upload-btn">
          上传视频
          <input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {onRemove ? (
          <button type="button" className="mini-btn" onClick={onRemove}>
            删除
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModelField({
  label,
  value,
  onChange,
  onFile,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  onReset?: () => void;
}) {
  const name = value ? value.split("/").pop() : "";
  return (
    <div className="img-field">
      {value ? (
        <a
          className="thumb"
          href={value}
          target="_blank"
          rel="noreferrer"
          title="点击下载 / 查看模型文件"
        >
          <span
            style={{
              fontSize: 10,
              lineHeight: 1.3,
              color: "#4b5563",
              padding: 4,
              textAlign: "center",
              wordBreak: "break-all",
            }}
          >
            {name}
          </span>
        </a>
      ) : (
        <span className="thumb empty">无模型</span>
      )}
      <div className="meta">
        <span className="img-label">{label}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="3D 模型路径"
          placeholder="/api/uploads/sites/choicedesign/uploads/xxx.glb"
        />
        <label className="upload-btn">
          上传 GLB
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {onReset ? (
          <button type="button" className="mini-btn" onClick={onReset}>
            恢复默认
          </button>
        ) : null}
      </div>
    </div>
  );
}

function List({
  label,
  values,
  onChange,
  hint,
  addable = true,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  addable?: boolean;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {hint ? <span className="hint">（{hint}）</span> : null}
      </label>
      <div className="list-field">
        {values.map((v, i) => (
          <div className="row" key={i}>
            <input
              type="text"
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="mini-btn"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            >
              删除
            </button>
          </div>
        ))}
        {addable ? (
          <button type="button" className="add-btn" onClick={() => onChange([...values, ""])}>
            + 添加一项
          </button>
        ) : null}
      </div>
    </div>
  );
}

function LineList({
  lines,
  sizes,
  gaps,
  fallback,
  onChange,
}: {
  lines: string[];
  sizes?: (number | null)[];
  gaps?: (number | null)[];
  fallback: number;
  onChange: (
    lines: string[],
    sizes: (number | null)[],
    gaps: (number | null)[],
  ) => void;
}) {
  const numAt = (arr: (number | null)[] | undefined, i: number) => {
    const v = arr?.[i];
    return typeof v === "number" ? v : null;
  };
  const sizesNow = () => lines.map((_, idx) => numAt(sizes, idx));
  const gapsNow = () => lines.map((_, idx) => numAt(gaps, idx));

  return (
    <div className="field">
      <label>
        正文文字
        <span className="hint">
          （每行一段；右侧两个数字依次是这一行的字号、行间距，单位 rem，留空用默认）
        </span>
      </label>
      <div className="list-field">
        {lines.map((line, i) => (
          <div className="row" key={i}>
            <input
              type="text"
              value={line}
              onChange={(e) => {
                const next = [...lines];
                next[i] = e.target.value;
                onChange(next, sizesNow(), gapsNow());
              }}
            />
            <input
              className="size-input"
              type="number"
              min={0.2}
              max={1.2}
              step={0.02}
              placeholder={fallback.toFixed(2)}
              title="这一行的字号（rem）"
              value={numAt(sizes, i) ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                const next = sizesNow();
                next[i] = raw === "" ? null : Number(raw);
                onChange([...lines], next, gapsNow());
              }}
            />
            <input
              className="gap-input"
              type="number"
              min={-0.4}
              max={1}
              step={0.02}
              placeholder="间距"
              title="这一行的行间距（rem），数字越大间距越大，可为负"
              value={numAt(gaps, i) ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                const next = gapsNow();
                next[i] = raw === "" ? null : Number(raw);
                onChange([...lines], sizesNow(), next);
              }}
            />
            <button
              type="button"
              className="mini-btn"
              onClick={() =>
                onChange(
                  lines.filter((_, idx) => idx !== i),
                  sizesNow().filter((_, idx) => idx !== i),
                  gapsNow().filter((_, idx) => idx !== i),
                )
              }
            >
              删除
            </button>
          </div>
        ))}
        <button
          type="button"
          className="add-btn"
          onClick={() =>
            onChange([...lines, ""], sizesNow().concat(null), gapsNow().concat(null))
          }
        >
          + 添加一行
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  fallback,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  label: string;
  value?: number;
  fallback: number;
  min: number;
  max: number;
  step: number;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const v = typeof value === "number" ? value : fallback;
  return (
    <div className="field">
      <label>
        {label}
        <span className="hint">
          （当前 {v.toFixed(2)} rem{hint ? `，${hint}` : ""}）
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function AdminPage() {
  const [site, setSite] = useState<any>(null);
  const [works, setWorks] = useState<any>(null);
  const [activeWork, setActiveWork] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dirtyTabs, setDirtyTabs] = useState<string[]>([]);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [tab, setTab] = useState("help");
  const [showTop, setShowTop] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  // 登录状态：checking → 校验中；guest → 需输入密码；authed → 可编辑
  const [auth, setAuth] = useState<"checking" | "guest" | "authed">("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/session", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
      .then((res) => res.json())
      .then((data) => {
        if (alive) setAuth(data.authed ? "authed" : "guest");
      })
      .catch(() => {
        if (alive) setAuth("guest");
      });
    return () => {
      alive = false;
    };
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "登录失败");
      setPassword("");
      setLoginError("");
      setAuth("authed");
    } catch (error) {
      setLoginError((error as Error).message);
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    setSite(null);
    setWorks(null);
    setAuth("guest");
  };

  const load = useCallback(async () => {
    try {
      setMsg({ type: "info", text: "正在读取配置…" });
      const [siteRes, worksRes] = await Promise.all([
        fetch("/api/admin/content?file=site", { cache: "no-store" }),
        fetch("/api/admin/content?file=works", { cache: "no-store" }),
      ]);
      const siteJson = await siteRes.json();
      const worksJson = await worksRes.json();
      if (!siteRes.ok) throw new Error(siteJson.error);
      if (!worksRes.ok) throw new Error(worksJson.error);
      setSite(siteJson);
      setWorks(worksJson);
      setActiveWork(Object.keys(worksJson)[0] ?? "");
      setDirty(false);
      setDirtyTabs([]);
      setMsg(null);
    } catch (error) {
      setMsg({
        type: "error",
        text: `读取失败：${(error as Error).message}\n请检查服务是否正常运行后刷新重试。`,
      });
    }
  }, []);

  useEffect(() => {
    if (auth !== "authed") return;
    load();
  }, [auth, load]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const markDirty = () => {
    setDirty(true);
    setDirtyTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  };

  const upSite = (keys: (string | number)[], value: any) => {
    setSite((prev: any) => setAt(prev, keys, value));
    markDirty();
  };
  const upWorks = (keys: (string | number)[], value: any) => {
    setWorks((prev: any) => setAt(prev, keys, value));
    markDirty();
  };
  // 3×5 模式的第 g 行第 i 个，直接写进 partners.large（位置与前台一一对应）
  const setLargeLogo = (g: number, i: number, v: string) => {
    const rows = getLargePartnerRows(site.partners).map((row) => row.map((x) => ({ ...x })));
    rows[g][i] = { src: v };
    upSite(["partners", "large"], rows);
  };

  const moveJob = (from: number, to: number) => {
    const jobs = site?.intro?.experience?.items ?? [];
    if (to < 0 || to >= jobs.length) return;
    const next = [...jobs];
    const [job] = next.splice(from, 1);
    next.splice(to, 0, job);
    upSite(["intro", "experience", "items"], next);
  };

  const upload = async (file: File) => {
    setMsg({ type: "info", text: `正在上传 ${file.name}…` });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: "info", text: "上传成功，别忘了点右上角「保存修改」" });
      return data.path as string;
    } catch (error) {
      setMsg({ type: "error", text: `上传失败：${(error as Error).message}` });
      return "";
    }
  };

  const save = useCallback(async () => {
    if (!site || !works) return;
    setSaving(true);
    setMsg({ type: "info", text: "正在保存…" });
    try {
      const res = await Promise.all([
        fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ file: "site", data: site }),
        }),
        fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ file: "works", data: works }),
        }),
      ]);
      const errors: string[] = [];
      for (const r of res) {
        if (!r.ok) {
          const data = await r.json();
          errors.push(data.error ?? "保存失败");
        }
      }
      if (errors.length) throw new Error(errors.join("；"));
      setDirty(false);
      setDirtyTabs([]);
      setMsg({
        type: "info",
        text: "已保存！刷新首页即可看到变化。",
      });
    } catch (error) {
      setMsg({ type: "error", text: `保存失败：${(error as Error).message}` });
    } finally {
      setSaving(false);
    }
  }, [site, works]);

  // 提示信息 4 秒后自动消失（错误保留）
  useEffect(() => {
    if (!msg || msg.type === "error") return;
    const timer = window.setTimeout(() => setMsg(null), 4000);
    return () => window.clearTimeout(timer);
  }, [msg]);

  // Ctrl / Cmd + S 保存
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, saving]);

  const goTab = (id: string) => {
    setTab(id);
    mainRef.current?.scrollTo({ top: 0 });
    setShowTop(false);
  };

  const reload = () => {
    if (dirty && !window.confirm("放弃未保存的修改，重新读取已保存的内容？")) return;
    load();
  };

  const tabIndex = SECTIONS.findIndex((s) => s.id === tab);

  if (auth === "authed" && (!site || !works)) {
    return (
      <div className="admin">
        <div className="admin-top">
          <h1>网站内容管理后台</h1>
        </div>
        <div className="admin-loading">
          {msg ? msg.text : "正在读取配置…"}
        </div>
        {msg ? (
          <div className={`admin-toast ${msg.type === "error" ? "error" : ""}`}>{msg.text}</div>
        ) : null}
      </div>
    );
  }

  const current = works?.[activeWork];
  const contentImages = current
    ? Array.from((current.content as string).matchAll(/<img[^>]*>/g)).map((m) => {
        const tag = m[0];
        const src = /src="([^"]*)"/.exec(tag)?.[1] ?? "";
        return { tag, src };
      })
    : [];

  const contentParas = current
    ? getParagraphs((current.content as string) ?? "")
    : [];

  if (auth !== "authed") {
    return (
      <div className="admin admin-login">
        <form className="admin-login-card" onSubmit={login}>
          <h1>网站内容管理后台</h1>
          <p className="admin-login-desc">
            {auth === "checking"
              ? "正在检查登录状态…"
              : "请输入后台密码后继续编辑。"}
          </p>
          {auth === "guest" ? (
            <>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="后台密码"
                autoFocus
              />
              {loginError ? (
                <p className="admin-login-error">{loginError}</p>
              ) : null}
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={loggingIn}
              >
                {loggingIn ? "登录中…" : "登录"}
              </button>
            </>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin-top">
        <div>
          <h1>网站内容管理后台</h1>
          <p>改文字 → 直接输入即可；换图片 → 点「上传替换」；改完点右上角保存。</p>
        </div>
        <div className="admin-actions">
          {dirty ? <span className="admin-dirty">未保存</span> : null}
          <button type="button" className="admin-btn admin-btn-optional" onClick={reload}>
            重新读取
          </button>
          <button type="button" className="admin-btn admin-btn-optional" onClick={logout}>
            退出登录
          </button>
          <a className="admin-btn" href="/" target="_blank" rel="noreferrer">
            预览网站
          </a>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={save}
            disabled={saving}
            title="快捷键 Ctrl+S / ⌘+S"
          >
            {saving ? "保存中…" : "保存修改"}
          </button>
        </div>
      </div>

      {msg ? (
        <div className={`admin-toast ${msg.type === "error" ? "error" : ""}`}>{msg.text}</div>
      ) : null}

      <div className="admin-body">
        <nav className="admin-nav" aria-label="栏目导航">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={tab === section.id ? "active" : ""}
              aria-current={tab === section.id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                goTab(section.id);
              }}
            >
              {section.label}
              {dirtyTabs.includes(section.id) ? (
                <span className="dot" title="这个栏目有未保存的修改" />
              ) : null}
            </a>
          ))}
        </nav>

        <main
          className="admin-main"
          data-tab={tab}
          ref={mainRef}
          onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 400)}
        >
          <section className="admin-card" id="help">
            <h2>使用说明</h2>
            <p className="desc">不需要懂代码，按下面 4 步操作即可。</p>
            <p className="tip">
              1. 想改哪块内容，就在左边点对应的栏目（右边只显示这一个栏目）。<br />
              2. 文字直接在输入框里改；图片点「上传替换」选本地文件，点缩略图可以看大图。<br />
              3. 全部改完后，点右上角「保存修改」（也可以按 Ctrl+S / ⌘+S）。<br />
              4. 打开「预览网站」或刷新首页，即可看到效果。<br />
              提示：图片建议用 png / jpg / webp，视频用 mp4；修改会保存到云端存储，重新部署也不会丢失。
            </p>
          </section>

          <section className="admin-card" id="basic">
            <h2>站点信息</h2>
            <p className="desc">浏览器标签上的标题、搜索结果里的简介。</p>
            <div className="grid2">
              <Text
                label="浏览器标签标题"
                value={site.meta.title}
                onChange={(v) => upSite(["meta", "title"], v)}
              />
              <Text
                label="搜索简介"
                value={site.meta.description}
                onChange={(v) => upSite(["meta", "description"], v)}
                area
              />
            </div>
          </section>

          <section className="admin-card" id="brand">
            <h2>品牌信息</h2>
            <p className="desc">首屏与页脚使用的品牌名和口号。</p>
            <div className="grid2">
              <Text
                label="品牌名"
                value={site.brand.name}
                onChange={(v) => upSite(["brand", "name"], v)}
              />
              <Text
                label="英文口号"
                value={site.brand.sloganEn}
                onChange={(v) => upSite(["brand", "sloganEn"], v)}
              />
              <Text
                label="中文口号"
                value={site.brand.sloganCn}
                onChange={(v) => upSite(["brand", "sloganCn"], v)}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <Img
                label="左上角 Logo 图片"
                value={site.brand.logo.image}
                onChange={(v) => upSite(["brand", "logo", "image"], v)}
                onFile={async (f) => {
                  const p = await upload(f);
                  if (p) upSite(["brand", "logo", "image"], p);
                }}
                onRemove={() => upSite(["brand", "logo", "image"], "")}
              />
              <p className="desc" style={{ marginTop: 8 }}>
                建议用透明背景的 PNG/SVG，高度方向会自适应；不上传则使用默认的 CHOICE 文字标志。
              </p>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="field">
                <span>
                  主色调
                  <span className="hint">
                    （按钮、强调文字、圆点、hover 效果都会变成这个颜色）
                  </span>
                </span>
                <div className="color-row">
                  <input
                    type="color"
                    value={site.brand?.colors?.primary ?? "#614FFD"}
                    onChange={(e) =>
                      upSite(["brand", "colors", "primary"], e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="color-text"
                    value={site.brand?.colors?.primary ?? "#614FFD"}
                    onChange={(e) =>
                      upSite(["brand", "colors", "primary"], e.target.value)
                    }
                    placeholder="#39FF14"
                  />
                </div>
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <Img
                label="右上角菜单按钮头像"
                value={site.brand?.navIcon ?? ""}
                onChange={(v) => upSite(["brand", "navIcon"], v)}
                onFile={async (f) => {
                  const p = await upload(f);
                  if (p) upSite(["brand", "navIcon"], p);
                }}
                onRemove={() => upSite(["brand", "navIcon"], "")}
              />
              <p className="desc" style={{ marginTop: 8 }}>
                三横线旁边的小头像/猫爪图标，建议透明 PNG，约 56×62px。
              </p>
            </div>
          </section>

          <section className="admin-card" id="contact">
            <h2>联系方式 / 页脚</h2>
            <p className="desc">页面底部与联系我们弹层展示的内容。</p>
            <div className="grid2">
              <Text
                label="联系按钮链接"
                hint="点击 Let&apos;s Talk 跳转的地址"
                value={site.contact.link}
                onChange={(v) => upSite(["contact", "link"], v)}
              />
              <Text
                label="联系按钮文字"
                value={site.contact.talk}
                onChange={(v) => upSite(["contact", "talk"], v)}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <List
                label="地址（每行一段）"
                values={site.contact.location}
                onChange={(v) => upSite(["contact", "location"], v)}
                addable={false}
              />
            </div>
            <div className="grid2" style={{ marginTop: 16 }}>
              {site.contact.rows.map((row: any, i: number) => (
                <div key={i} className="day-item" style={{ margin: 0 }}>
                  <h3>{row.label || `第 ${i + 1} 项`}</h3>
                  <div className="grid2">
                    <Text
                      label="名称"
                      value={row.label}
                      onChange={(v) => upSite(["contact", "rows", i, "label"], v)}
                    />
                    <Text
                      label="内容"
                      value={row.value}
                      onChange={(v) => upSite(["contact", "rows", i, "value"], v)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="desc" style={{ marginTop: 16 }}>
              社交链接（图标 + 跳转地址）
            </p>
            <div className="grid2">
              {site.contact.socials.map((item: any, i: number) => (
                <div key={i} className="day-item" style={{ margin: 0 }}>
                  <h3>{item.label}</h3>
                  <Text
                    label="名称"
                    value={item.label}
                    onChange={(v) => upSite(["contact", "socials", i, "label"], v)}
                  />
                  <div style={{ height: 10 }} />
                  <Text
                    label="跳转地址"
                    value={item.href}
                    onChange={(v) => upSite(["contact", "socials", i, "href"], v)}
                  />
                  <div style={{ height: 10 }} />
                  <Img
                    label="图标"
                    value={item.icon}
                    onChange={(v) => upSite(["contact", "socials", i, "icon"], v)}
                    onFile={async (f) => {
                      const p = await upload(f);
                      if (p) upSite(["contact", "socials", i, "icon"], p);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="grid2" style={{ marginTop: 16 }}>
              {site.contact.qrcodes.map((item: any, i: number) => (
                <div key={i} className="day-item" style={{ margin: 0 }}>
                  <h3>二维码 {i + 1}</h3>
                  <Img
                    label={item.alt || "二维码"}
                    value={item.image}
                    onChange={(v) => upSite(["contact", "qrcodes", i, "image"], v)}
                    onFile={async (f) => {
                      const p = await upload(f);
                      if (p) upSite(["contact", "qrcodes", i, "image"], p);
                    }}
                  />
                  <div style={{ height: 10 }} />
                  <Text
                    label="二维码下方文字"
                    value={item.text}
                    onChange={(v) => upSite(["contact", "qrcodes", i, "text"], v)}
                  />
                </div>
              ))}
            </div>
            <div className="grid2" style={{ marginTop: 16 }}>
              <Text
                label="版权信息"
                value={site.contact.copyright}
                onChange={(v) => upSite(["contact", "copyright"], v)}
              />
              <Text
                label="备案号"
                value={site.contact.icp}
                onChange={(v) => upSite(["contact", "icp"], v)}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <List
                label="页脚法律声明"
                values={site.contact.legal}
                onChange={(v) => upSite(["contact", "legal"], v)}
                addable={false}
              />
            </div>
          </section>

          <section className="admin-card" id="hero">
            <h2>首屏</h2>
            <p className="desc">打开网站第一眼看到的三行大字和漂浮小图标。</p>
            <div className="grid2">
              {site.hero.words.map((word: string, i: number) => (
                <Text
                  key={i}
                  label={`第 ${i + 1} 行文字`}
                  value={word}
                  onChange={(v) => upSite(["hero", "words", i], v)}
                />
              ))}
            </div>
            <p className="desc" style={{ marginTop: 16 }}>
              漂浮图标（共 9 个，可逐个替换）
            </p>
            <div className="partner-grid">
              {site.hero.icons.map((icon: any, i: number) => (
                <Img
                  key={i}
                  label={`图标 ${i + 1}`}
                  value={icon.src}
                  hidePath
                  onChange={(v) => upSite(["hero", "icons", i, "src"], v)}
                  onFile={async (f) => {
                    const p = await upload(f);
                    if (p) upSite(["hero", "icons", i, "src"], p);
                  }}
                />
              ))}
            </div>
            <p className="desc" style={{ marginTop: 16 }}>
              漂浮图标下方的小提示条（默认是第 5 个图标下的"点击播放品牌视频"）。
              填图片就用图片；不填图片、填文字就自动生成品牌色小标签；都不填则隐藏。
            </p>
            <div className="grid2">
              <Img
                label="提示条图片（不填则用文字模式）"
                value={site.hero?.tips?.image ?? ""}
                onChange={(v) => upSite(["hero", "tips", "image"], v)}
                onFile={async (f) => {
                  const p = await upload(f);
                  if (p) upSite(["hero", "tips", "image"], p);
                }}
              />
              <Text
                label="文字模式（无图片时显示）"
                value={site.hero?.tips?.text ?? ""}
                onChange={(v) => upSite(["hero", "tips", "text"], v)}
              />
              <Text
                label="点击跳转链接（可选）"
                hint="填了就变成可点击的链接"
                value={site.hero?.tips?.href ?? ""}
                onChange={(v) => upSite(["hero", "tips", "href"], v)}
              />
            </div>
            <p className="desc" style={{ marginTop: 16 }}>
              首屏播放的视频（点击第 5 个图标弹出播放器；留空则点击无反应）。
            </p>
            <VideoField
              label="介绍视频"
              value={site.hero?.video ?? ""}
              onChange={(v) => upSite(["hero", "video"], v)}
              onFile={async (f) => {
                const p = await upload(f);
                if (p) upSite(["hero", "video"], p);
              }}
              onRemove={() => upSite(["hero", "video"], "")}
            />
          </section>

          <section className="admin-card" id="intro">
            <h2>第二屏（关于我 / 工作经历 / 价值观）</h2>
            <p className="desc">
              左侧是「关于我」，右侧是「工作经历」时间轴，中间是「价值观」。每行文字的字号、行间距都能单独调整；工作经历条目从上往下就是从新到旧。
            </p>
            <p className="desc" style={{ marginTop: 16 }}>
              中间的 3D 模型（滚动时会自动播放运动轨迹，只支持未压缩的 .glb，贴图需内嵌）。
            </p>
            <ModelField
              label="3D 模型文件"
              value={site.intro?.model ?? ""}
              onChange={(v) => upSite(["intro", "model"], v)}
              onFile={async (f) => {
                const p = await upload(f);
                if (p) upSite(["intro", "model"], p);
              }}
              onReset={() =>
                upSite(["intro", "model"], "/api/uploads/sites/choicedesign/assets/choice2.glb")
              }
            />
            {site.intro.items.map((item: any, i: number) => (
              <div className="day-item" key={i}>
                <h3>{item.title || `第 ${i + 1} 组`}</h3>
                <div className="grid2">
                  <Text
                    label="小标题"
                    value={item.title}
                    onChange={(v) => upSite(["intro", "items", i, "title"], v)}
                  />
                  <Text
                    label="英文标签"
                    value={item.en.join(" ")}
                    hint="用空格分隔，如 OUR MISSION"
                    onChange={(v) => upSite(["intro", "items", i, "en"], v.split(/\s+/))}
                  />
                </div>
                <div style={{ height: 12 }} />
                <LineList
                  lines={item.lines}
                  sizes={item.lineSizes}
                  gaps={item.lineGaps}
                  fallback={item.fontSize ?? 0.9}
                  onChange={(lines, sizes, gaps) => {
                    upSite(["intro", "items", i, "lines"], lines);
                    upSite(["intro", "items", i, "lineSizes"], sizes);
                    upSite(["intro", "items", i, "lineGaps"], gaps);
                  }}
                />
                <div className="grid2" style={{ marginTop: 12 }}>
                  <Slider
                    label="小标题字号"
                    value={item.titleSize}
                    fallback={0.4}
                    min={0.2}
                    max={0.9}
                    step={0.02}
                    hint="默认 0.40"
                    onChange={(v) => upSite(["intro", "items", i, "titleSize"], v)}
                  />
                  <Slider
                    label="整组默认字号"
                    value={item.fontSize}
                    fallback={0.9}
                    min={0.2}
                    max={1.2}
                    step={0.02}
                    hint="没单独设置的行用这个字号"
                    onChange={(v) => upSite(["intro", "items", i, "fontSize"], v)}
                  />
                </div>
              </div>
            ))}
            <div className="day-item">
              <h3>工作经历（右侧时间轴）</h3>
              <div className="grid2">
                <Text
                  label="区块标题"
                  value={site.intro.experience.title}
                  onChange={(v) => upSite(["intro", "experience", "title"], v)}
                />
                <Text
                  label="英文标签"
                  value={site.intro.experience.titleEn.join(" ")}
                  hint="用空格分隔，如 WORK EXPERIENCE"
                  onChange={(v) =>
                    upSite(
                      ["intro", "experience", "titleEn"],
                      v.split(/\s+/).filter(Boolean),
                    )
                  }
                />
              </div>
              <p className="desc" style={{ marginTop: 10 }}>
                条目按下面顺序从上往下展示，最新的放最上面。
              </p>
              {site.intro.experience.items.map((job: any, j: number) => (
                <div className="job-card" key={j}>
                  <div className="grid2">
                    <Text
                      label="工作时间"
                      value={job.period}
                      hint="如 2022.06 - 至今"
                      onChange={(v) =>
                        upSite(["intro", "experience", "items", j, "period"], v)
                      }
                    />
                    <Text
                      label="公司名称"
                      value={job.company}
                      onChange={(v) =>
                        upSite(["intro", "experience", "items", j, "company"], v)
                      }
                    />
                  </div>
                  <Text
                    label="岗位名称"
                    value={job.role}
                    onChange={(v) =>
                      upSite(["intro", "experience", "items", j, "role"], v)
                    }
                  />
                  <Text
                    label="工作描述"
                    value={job.desc}
                    hint="一两句话即可"
                    onChange={(v) =>
                      upSite(["intro", "experience", "items", j, "desc"], v)
                    }
                  />
                  <div className="job-actions">
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => moveJob(j, j - 1)}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => moveJob(j, j + 1)}
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() =>
                        upSite(
                          ["intro", "experience", "items"],
                          site.intro.experience.items.filter(
                            (_: any, idx: number) => idx !== j,
                          ),
                        )
                      }
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() =>
                  upSite(["intro", "experience", "items"], [
                    ...site.intro.experience.items,
                    { period: "", company: "", role: "", desc: "" },
                  ])
                }
              >
                + 添加一条工作经历
              </button>
            </div>
            <div className="grid2">
              <Text
                label="左下角文字"
                value={site.intro.footLeft}
                onChange={(v) => upSite(["intro", "footLeft"], v)}
              />
              <Text
                label="右下角文字"
                value={site.intro.footRight}
                onChange={(v) => upSite(["intro", "footRight"], v)}
              />
            </div>
          </section>

          <section className="admin-card" id="works">
            <h2>作品列表</h2>
            <p className="desc">
              首页中间的六个作品封面。封面点击后进入对应的详情页，所以「编号」和「详情页链接」要保持一致。
            </p>
            <List
              label="筛选分类"
              values={site.works.categories}
              onChange={(v) => upSite(["works", "categories"], v)}
            />
            <div style={{ height: 16 }} />
            <div className="works-editor">
              {site.works.items.map((item: any, i: number) => (
                <div className="day-item" key={i}>
                  <h3>
                    作品 {i + 1}：{item.title}
                  </h3>
                  <div className="grid2">
                    <Text
                      label="标题"
                      value={item.title}
                      onChange={(v) => upSite(["works", "items", i, "title"], v)}
                    />
                    <Text
                      label="编号 id"
                      hint="如 25，详情页链接写 /works/25"
                      value={item.id}
                      onChange={(v) => upSite(["works", "items", i, "id"], v)}
                    />
                    <Text
                      label="两个标签"
                      hint="用逗号分隔，如 活动设计,展陈设计"
                      value={item.labels.join(",")}
                      onChange={(v) =>
                        upSite(["works", "items", i, "labels"], v.split(/[,，]/).map((s) => s.trim()))
                      }
                    />
                    <Text
                      label="详情页链接"
                      value={item.href}
                      onChange={(v) => upSite(["works", "items", i, "href"], v)}
                    />
                  </div>
                  <div style={{ height: 12 }} />
                  <Img
                    label="封面图（建议 16:9）"
                    value={item.cover}
                    onChange={(v) => upSite(["works", "items", i, "cover"], v)}
                    onFile={async (f) => {
                      const p = await upload(f);
                      if (p) upSite(["works", "items", i, "cover"], p);
                    }}
                  />
                  {works[item.id] ? (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setActiveWork(item.id);
                        goTab("detail");
                      }}
                    >
                      编辑这个作品的详情页图片 →
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="tip">如需新增或删除作品，请联系开发同学（详情页素材也要一起加）。</p>
          </section>

          <section className="admin-card" id="partners">
            <h2>合作伙伴</h2>
            <p className="desc">共 48 个 logo；展示方式在下方选择，前台按所选样式显示。</p>
            <div className="grid2">
              <Text
                label="标题（中文）"
                value={site.partners.titleCn ?? ""}
                onChange={(v) => upSite(["partners", "titleCn"], v)}
              />
              <Text
                label="标题（英文）"
                hint="每行一个词，用空格分隔"
                value={(site.partners.titleEn ?? []).join(" ")}
                onChange={(v) =>
                  upSite(["partners", "titleEn"], v.split(/\s+/).filter(Boolean))
                }
              />
            </div>
            <div className="field">
              <label>展示方式</label>
              <select
                value={site.partners.layout ?? "dense"}
                onChange={(e) => {
                  const v = e.target.value;
                  upSite(["partners", "layout"], v);
                  if (v === "large" && !site.partners.large) {
                    upSite(["partners", "large"], getLargePartnerRows(site.partners));
                  }
                }}
              >
                <option value="dense">6×8 小图标（48 个，滚动展示）</option>
                <option value="large">3×5 大图标（15 个，位置与前台一致）</option>
              </select>
            </div>
            {site.partners.layout === "large" ? (
              getLargePartnerRows(site.partners).map((group, g) => (
                <div key={g} style={{ marginBottom: 14 }}>
                  <p className="desc" style={{ margin: "0 0 8px" }}>
                    第 {g + 1} 行（共 5 个）
                  </p>
                  <div className="partner-grid rows5">
                    {group.map((logo, i) => (
                      <Img
                        key={i}
                        label={`${g * 5 + i + 1}`}
                        value={logo.src}
                        hidePath
                        onChange={(v) => setLargeLogo(g, i, v)}
                        onFile={async (f) => {
                          const p = await upload(f);
                          if (p) setLargeLogo(g, i, p);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              site.partners.groups.map((group: any[], g: number) => (
                <div key={g} style={{ marginBottom: 14 }}>
                  <p className="desc" style={{ margin: "0 0 8px" }}>
                    第 {g + 1} 行
                  </p>
                  <div className="partner-grid">
                    {group.map((logo: any, i: number) => (
                      <Img
                        key={i}
                        label={`${g * 8 + i + 1}`}
                        value={logo.src}
                        hidePath
                        onChange={(v) => upSite(["partners", "groups", g, i, "src"], v)}
                        onFile={async (f) => {
                          const p = await upload(f);
                          if (p) upSite(["partners", "groups", g, i, "src"], p);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="admin-card" id="recommend">
            <h2>更多创意（视频区）</h2>
            <p className="desc">首页视频模块的封面、视频与按钮。</p>
            <div className="grid2">
              <Img
                label="视频封面"
                value={site.recommend.poster}
                onChange={(v) => upSite(["recommend", "poster"], v)}
                onFile={async (f) => {
                  const p = await upload(f);
                  if (p) upSite(["recommend", "poster"], p);
                }}
              />
              <Img
                label="视频文件（mp4）"
                value={site.recommend.video}
                onChange={(v) => upSite(["recommend", "video"], v)}
                onFile={async (f) => {
                  const p = await upload(f);
                  if (p) upSite(["recommend", "video"], p);
                }}
              />
            </div>
            <div style={{ height: 14 }} />
            <div className="grid2">
              <Text
                label="按钮文字"
                value={site.recommend.moreText}
                onChange={(v) => upSite(["recommend", "moreText"], v)}
              />
              <Text
                label="按钮链接"
                value={site.recommend.moreLink}
                onChange={(v) => upSite(["recommend", "moreLink"], v)}
              />
              <Text
                label="左下角文字"
                value={site.recommend.footLeft}
                onChange={(v) => upSite(["recommend", "footLeft"], v)}
              />
              <Text
                label="右下角文字"
                value={site.recommend.footRight.join(" ")}
                onChange={(v) => upSite(["recommend", "footRight"], v.split(/\s+/))}
              />
            </div>
          </section>

          <section className="admin-card" id="about">
            <h2>关于 / 悬浮按钮</h2>
            <p className="desc">页面底部的 More Things 与右下角悬浮联系按钮。</p>
            <div className="grid2">
              <Text
                label="大标题第一行"
                value={site.about.title[0]}
                onChange={(v) => upSite(["about", "title", 0], v)}
              />
              <Text
                label="大标题第二行"
                value={site.about.title[1]}
                onChange={(v) => upSite(["about", "title", 1], v)}
              />
              <Text
                label="按钮文字"
                value={site.about.moreText}
                onChange={(v) => upSite(["about", "moreText"], v)}
              />
              <Text
                label="按钮链接"
                value={site.about.moreLink}
                onChange={(v) => upSite(["about", "moreLink"], v)}
              />
            </div>
            <div style={{ height: 14 }} />
            <div className="grid2">
              <Img
                label="悬浮按钮图片"
                value={site.contactButton.image}
                onChange={(v) => upSite(["contactButton", "image"], v)}
                onFile={async (f) => {
                  const p = await upload(f);
                  if (p) upSite(["contactButton", "image"], p);
                }}
              />
              <Text
                label="悬浮按钮滚动文字"
                value={site.contactButton.text}
                onChange={(v) => upSite(["contactButton", "text"], v)}
              />
            </div>
          </section>

          <section className="admin-card" id="detail">
            <h2>作品详情</h2>
            <p className="desc">
              选择作品后，可修改标题、客户、年份、标签、封面，以及正文里的文字段落和每一张图片。
            </p>
            <div className="work-picker">
              <span>选择作品：</span>
              <select value={activeWork} onChange={(e) => setActiveWork(e.target.value)}>
                {Object.entries(works).map(([id, item]: [string, any]) => (
                  <option key={id} value={id}>
                    {item.title}（{id}）
                  </option>
                ))}
              </select>
            </div>
            {current ? (
              <>
                <div className="grid2">
                  <Text
                    label="中文标题"
                    value={current.title}
                    onChange={(v) => upWorks([activeWork, "title"], v)}
                  />
                  <Text
                    label="英文标题"
                    value={current.titleEn}
                    onChange={(v) => upWorks([activeWork, "titleEn"], v)}
                  />
                  <Text
                    label="Client（客户）"
                    value={current.client}
                    onChange={(v) => upWorks([activeWork, "client"], v)}
                  />
                  <Text
                    label="Year（年份）"
                    hint="填 2026，页面显示 2026-01-01"
                    value={current.year}
                    onChange={(v) => upWorks([activeWork, "year"], v)}
                  />
                  <Text
                    label="标签"
                    hint="用逗号分隔，第一个会显示在左上角"
                    value={current.tags.join(",")}
                    onChange={(v) =>
                      upWorks([activeWork, "tags"], v.split(/[,，]/).map((s) => s.trim()))
                    }
                  />
                </div>
                <div style={{ height: 12 }} />
                <Img
                  label="精选案例缩略图"
                  value={current.cover}
                  onChange={(v) => upWorks([activeWork, "cover"], v)}
                  onFile={async (f) => {
                    const p = await upload(f);
                    if (p) upWorks([activeWork, "cover"], p);
                  }}
                />
                <p className="desc" style={{ marginTop: 18 }}>
                  正文图片（共 {contentImages.length} 张，可替换或删除）
                </p>
                <div className="detail-tools">
                  <label className="upload-btn">
                    ＋ 添加一张图片
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        const p = await upload(file);
                        if (p) {
                          upWorks(
                            [activeWork, "content"],
                            `${current.content}<p><img src="${p}" alt="" data-href="" style=""/></p>`,
                          );
                        }
                      }}
                    />
                  </label>
                  <span className="hint-text">新图片会加在正文最后；改完记得保存。</span>
                </div>
                <div className="detail-imgs">
                  {contentImages.map(({ tag, src }, i) => (
                    <Img
                      key={`${tag}-${i}`}
                      label={`第 ${i + 1} 张`}
                      value={src}
                      hidePath
                      onChange={() => undefined}
                      onRemove={() =>
                        upWorks([activeWork, "content"], current.content.replace(tag, ""))
                      }
                      onFile={async (f) => {
                        const p = await upload(f);
                        if (p) {
                          upWorks(
                            [activeWork, "content"],
                            current.content.replace(
                              tag,
                              tag.replace(`src="${src}"`, `src="${p}"`),
                            ),
                          );
                        }
                      }}
                    />
                  ))}
                </div>
                <p className="desc" style={{ marginTop: 18 }}>
                  正文文字（共 {contentParas.length} 段，可直接修改；清空内容即删除该段）
                </p>
                {contentParas.length === 0 ? (
                  <p className="tip">这篇作品正文里还没有纯文字段落。</p>
                ) : (
                  contentParas.map((text, i) => (
                    <Text
                      key={`para-${i}`}
                      label={`第 ${i + 1} 段`}
                      area
                      value={text}
                      onChange={(v) =>
                        upWorks(
                          [activeWork, "content"],
                          setParagraph(current.content, i, v),
                        )
                      }
                    />
                  ))
                )}
                <p className="tip">
                  正文文字可直接改；图片可以替换、删除，也可以在最后追加新图片。改完记得保存。
                </p>
              </>
            ) : null}
          </section>

          <div className="admin-pager">
            <button
              type="button"
              className="admin-btn"
              disabled={tabIndex <= 0}
              onClick={() => goTab(SECTIONS[tabIndex - 1].id)}
            >
              ← 上一栏目
            </button>
            <span className="page-info">
              {tabIndex + 1} / {SECTIONS.length} · {SECTIONS[tabIndex]?.label}
            </span>
            <button
              type="button"
              className="admin-btn"
              disabled={tabIndex >= SECTIONS.length - 1}
              onClick={() => goTab(SECTIONS[tabIndex + 1].id)}
            >
              下一栏目 →
            </button>
          </div>
        </main>
      </div>

      {showTop ? (
        <button
          type="button"
          className="admin-fab"
          aria-label="回到顶部"
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑
        </button>
      ) : null}
    </div>
  );
}
