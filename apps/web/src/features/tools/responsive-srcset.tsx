"use client";

import { useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

const MAX_CANDIDATES = 20;
const MAX_URL_LENGTH = 2_048;
const MAX_CANDIDATE_TEXT = 12_000;
const MAX_SIZES_LENGTH = 500;
const MAX_ALT_LENGTH = 500;

interface SrcsetInput {
  candidates: string;
  fallbackSrc: string;
  sizes: string;
  alt: string;
}

export interface SrcsetResult {
  srcset: string;
  html: string;
  warnings: ("empty_alt" | "empty_sizes")[];
}

function validateText(value: string, maxLength: number, label: string): string {
  if (value.length > maxLength || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return value;
}

function validateImageUrl(value: string): string {
  const url = validateText(value.trim(), MAX_URL_LENGTH, "Image URL");
  if (!url || /[\\,\s]/u.test(url) || url.includes("#")) throw new TypeError("Image URL is invalid.");
  if (url.startsWith("/")) {
    if (url.startsWith("//")) throw new TypeError("Image URL is invalid.");
    return url;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TypeError("Image URL must be HTTPS or root-relative.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) {
    throw new TypeError("Image URL must be HTTPS or root-relative.");
  }
  return parsed.href;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildResponsiveSrcset(input: SrcsetInput): SrcsetResult {
  if (input.candidates.length > MAX_CANDIDATE_TEXT) throw new RangeError("Candidate input is too long.");
  const lines = input.candidates.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  if (!lines.length || lines.length > MAX_CANDIDATES) throw new RangeError("Provide between 1 and 20 candidates.");
  const widths = new Set<number>();
  const candidates = lines.map((line) => {
    const parts = line.split("|");
    if (parts.length !== 2) throw new TypeError("Each candidate must use URL | width.");
    const url = validateImageUrl(parts[0] ?? "");
    const widthText = (parts[1] ?? "").trim();
    if (!/^\d{1,4}$/u.test(widthText)) throw new TypeError("Candidate width is invalid.");
    const width = Number(widthText);
    if (width < 1 || width > 8192 || widths.has(width)) throw new TypeError("Candidate widths must be unique integers from 1 to 8192.");
    widths.add(width);
    return { url, width };
  }).sort((left, right) => left.width - right.width);
  const fallbackSrc = validateImageUrl(input.fallbackSrc);
  const sizes = validateText(input.sizes.trim(), MAX_SIZES_LENGTH, "Sizes");
  const alt = validateText(input.alt, MAX_ALT_LENGTH, "Alt text");
  const srcset = candidates.map((candidate) => `${candidate.url} ${candidate.width}w`).join(", ");
  const attributes = [
    `src="${escapeHtml(fallbackSrc)}"`,
    `srcset="${escapeHtml(srcset)}"`,
    ...(sizes ? [`sizes="${escapeHtml(sizes)}"`] : []),
    `alt="${escapeHtml(alt)}"`,
  ];
  return {
    srcset,
    html: `<img\n  ${attributes.join("\n  ")}\n>`,
    warnings: [...(!alt ? ["empty_alt" as const] : []), ...(!sizes ? ["empty_sizes" as const] : [])],
  };
}

function text(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

export function ResponsiveSrcsetGeneratorTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState<SrcsetInput>({
    candidates: "/images/product-640.webp | 640\n/images/product-1280.webp | 1280",
    fallbackSrc: "/images/product-640.webp",
    sizes: "(max-width: 720px) 100vw, 720px",
    alt: "",
  });
  const [result, setResult] = useState<SrcsetResult | null>(null);
  const [error, setError] = useState("");

  function set<K extends keyof SrcsetInput>(key: K, value: SrcsetInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function generate() {
    try {
      setResult(buildResponsiveSrcset(input));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : text(locale, "Не удалось создать srcset.", "Could not generate srcset."));
    }
  }

  return <div className="tool-grid responsive-srcset-tool">
    <section className="tool-panel">
      <h2>{text(locale, "Кандидаты", "Candidates")}</h2>
      <label className="field"><span>{text(locale, "URL | ширина, по одному на строку", "URL | width, one per line")}</span><textarea rows={8} value={input.candidates} onChange={(event) => set("candidates", event.target.value)} /></label>
      <label className="field"><span>{text(locale, "Резервный src", "Fallback src")}</span><input value={input.fallbackSrc} onChange={(event) => set("fallbackSrc", event.target.value)} /></label>
      <label className="field"><span>sizes</span><input value={input.sizes} onChange={(event) => set("sizes", event.target.value)} /></label>
      <label className="field"><span>alt</span><input value={input.alt} maxLength={MAX_ALT_LENGTH} onChange={(event) => set("alt", event.target.value)} /></label>
      <button className="button" type="button" onClick={generate}>{text(locale, "Создать srcset", "Generate srcset")}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
      <small>{text(locale, "Инструмент не создаёт и не проверяет файлы. Введите реальные URL и их фактическую ширину.", "The tool does not create or verify files. Enter real URLs and their actual intrinsic widths.")}</small>
    </section>
    <section className="tool-panel" aria-live="polite">
      <h2>{text(locale, "Результат", "Result")}</h2>
      {result ? <>
        {result.warnings.length > 0 && <ul className="result-list">
          {result.warnings.includes("empty_alt") && <li>{text(locale, "Пустой alt подходит только декоративному изображению.", "Use an empty alt only for a decorative image.")}</li>}
          {result.warnings.includes("empty_sizes") && <li>{text(locale, "sizes не задан: браузер использует значение по умолчанию 100vw.", "sizes is empty; the browser default is 100vw.")}</li>}
        </ul>}
        <div className="favicon-snippet"><div className="favicon-snippet-heading"><h3>srcset</h3><CopyButton value={result.srcset} locale={locale} /></div><pre className="output">{result.srcset}</pre></div>
        <div className="favicon-snippet"><div className="favicon-snippet-heading"><h3>HTML</h3><CopyButton value={result.html} locale={locale} /></div><pre className="output">{result.html}</pre></div>
      </> : <p className="muted-text">{text(locale, "Проверенный текст srcset и HTML появится здесь.", "Validated srcset and HTML text will appear here.")}</p>}
    </section>
  </div>;
}
