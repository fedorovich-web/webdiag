"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  calculateHeight,
  calculateWidth,
  contrastRatio,
  decodeBase64,
  decodeUrlComponent,
  encodeBase64,
  encodeUrlComponent,
  formatJson,
  generateUlid,
  generateUuid,
  hashText,
  isoToUnixSeconds,
  pxToRem,
  reduceAspectRatio,
  remToPx,
  unixSecondsToIso,
  type HashAlgorithm,
} from "@webdiag/tool-core";
import { CopyButton } from "../../components/copy-button";
import { CanonicalCheckerTool } from "./canonical-checker-tool";
import { AddWatermarkImageTool, ImageMetadataViewerTool, SvgOptimizerTool } from "./image-advanced-tools";
import { ImageCropperTool, ImageFormatConverterTool, ImageOptimizerTool, ImageResizerTool } from "./image-tools";
import { BrokenImageCheckerTool, BrokenLinkCheckerTool, LinkAnalyzerTool } from "./link-health-tools";
import { FaviconCheckerTool, ImagePerformanceCheckerTool, ImageSeoAuditTool } from "./image-audit-tools";
import { MetaTagsCheckerTool, SerpPreviewTool, SocialPreviewTool } from "./metadata-preview-tools";
import { CachePolicyTool, CoreWebVitalsTool, PageWeightTool } from "./performance-tools";
import { HtmlMarkupValidatorTool, SchemaMarkupGeneratorTool, StructuredDataValidatorTool } from "./markup-tools";
import { RedirectChainTool } from "./redirect-chain-tool";
import { RobotsTxtTool } from "./robots-txt-tool";
import { SecurityHeadersTool } from "./security-headers-tool";
import { SitemapValidatorTool } from "./sitemap-validator-tool";
import { dictionary } from "../../lib/i18n";

interface ToolRendererProps {
  slug: string;
  locale: Locale;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { value: string; locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function Generator({ locale, kind }: { locale: Locale; kind: "uuid" | "ulid" }) {
  const [value, setValue] = useState("");
  const createValue = () => kind === "uuid" ? generateUuid() : generateUlid();
  const label = value
    ? (locale === "ru" ? "Создать ещё" : "Generate another")
    : kind === "uuid"
      ? (locale === "ru" ? "Создать UUID" : "Generate UUID")
      : (locale === "ru" ? "Создать ULID" : "Generate ULID");

  return <Panel title={dictionary[locale].result}><Output value={value} locale={locale} /><button className="button" type="button" onClick={() => setValue(createValue())}>{label}</button></Panel>;
}

function UnixTimestampTool({ locale }: { locale: Locale }) {
  const [timestamp, setTimestamp] = useState("0");
  const [iso, setIso] = useState("1970-01-01T00:00:00.000Z");
  const [error, setError] = useState("");

  function fromTimestamp() {
    try { setIso(unixSecondsToIso(Number(timestamp))); setError(""); } catch { setError(dictionary[locale].error); }
  }
  function fromIso() {
    try { setTimestamp(String(isoToUnixSeconds(iso))); setError(""); } catch { setError(dictionary[locale].error); }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Unix timestamp, секунды" : "Unix timestamp, seconds"}>
      <label className="field"><span>{locale === "ru" ? "Значение" : "Value"}</span><input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} inputMode="numeric" /></label>
      <button className="button" type="button" onClick={fromTimestamp}>{locale === "ru" ? "Преобразовать в дату" : "Convert to date"}</button>
    </Panel>
    <Panel title="ISO 8601">
      <label className="field"><span>{locale === "ru" ? "Дата" : "Date"}</span><input value={iso} onChange={(event) => setIso(event.target.value)} /></label>
      <button className="button" type="button" onClick={fromIso}>{locale === "ru" ? "Преобразовать в Unix" : "Convert to Unix"}</button>
    </Panel>
    <ErrorMessage value={error} />
  </div>;
}

function TextCodec({ locale, kind }: { locale: Locale; kind: "url" | "base64" }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const encode = kind === "url" ? encodeUrlComponent : encodeBase64;
  const decode = kind === "url" ? decodeUrlComponent : decodeBase64;

  function run(operation: "encode" | "decode") {
    try { setOutput(operation === "encode" ? encode(input) : decode(input)); setError(""); }
    catch { setOutput(""); setError(dictionary[locale].error); }
  }

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{locale === "ru" ? "Текст" : "Text"}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} /></label>
      <div className="button-row"><button className="button" type="button" onClick={() => run("encode")}>{locale === "ru" ? "Кодировать" : "Encode"}</button><button className="button button-secondary" type="button" onClick={() => run("decode")}>{locale === "ru" ? "Декодировать" : "Decode"}</button></div>
      <ErrorMessage value={error} />
    </Panel>
    <Panel title={dictionary[locale].result}><Output value={output} locale={locale} /></Panel>
  </div>;
}

function JsonTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState('{"name":"WebDiag"}');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  function run() {
    try { setOutput(formatJson(input)); setError(""); } catch (caught) { setOutput(""); setError(caught instanceof Error ? caught.message : dictionary[locale].error); }
  }
  return <div className="tool-grid"><Panel title={dictionary[locale].input}><label className="field"><span>JSON</span><textarea className="code-input" value={input} onChange={(event) => setInput(event.target.value)} rows={12} /></label><button className="button" type="button" onClick={run}>{locale === "ru" ? "Проверить и форматировать" : "Validate and format"}</button><ErrorMessage value={error} /></Panel><Panel title={dictionary[locale].result}><Output value={output} locale={locale} /></Panel></div>;
}

function HashTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  async function run() {
    try { setOutput(await hashText(input, algorithm)); setError(""); } catch { setError(dictionary[locale].error); }
  }
  return <div className="tool-grid"><Panel title={dictionary[locale].input}><label className="field"><span>{locale === "ru" ? "Алгоритм" : "Algorithm"}</span><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label><label className="field"><span>{locale === "ru" ? "Текст" : "Text"}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} /></label><button className="button" type="button" onClick={run}>{locale === "ru" ? "Рассчитать" : "Calculate"}</button><ErrorMessage value={error} /></Panel><Panel title={dictionary[locale].result}><Output value={output} locale={locale} /></Panel></div>;
}

function PxRemTool({ locale }: { locale: Locale }) {
  const [pixels, setPixels] = useState("16");
  const [rem, setRem] = useState("1");
  const [root, setRoot] = useState("16");
  const [error, setError] = useState("");
  function toRem() { try { setRem(String(pxToRem(Number(pixels), Number(root)))); setError(""); } catch { setError(dictionary[locale].error); } }
  function toPixels() { try { setPixels(String(remToPx(Number(rem), Number(root)))); setError(""); } catch { setError(dictionary[locale].error); } }
  return <div className="tool-grid"><Panel title="px → rem"><label className="field"><span>px</span><input value={pixels} onChange={(event) => setPixels(event.target.value)} inputMode="decimal" /></label><label className="field"><span>{locale === "ru" ? "Базовый размер, px" : "Root size, px"}</span><input value={root} onChange={(event) => setRoot(event.target.value)} inputMode="decimal" /></label><button className="button" type="button" onClick={toRem}>{locale === "ru" ? "Перевести в rem" : "Convert to rem"}</button></Panel><Panel title="rem → px"><label className="field"><span>rem</span><input value={rem} onChange={(event) => setRem(event.target.value)} inputMode="decimal" /></label><p className="calculated-value">{pixels} px = {rem} rem</p><button className="button" type="button" onClick={toPixels}>{locale === "ru" ? "Перевести в px" : "Convert to px"}</button></Panel><ErrorMessage value={error} /></div>;
}

function ContrastTool({ locale }: { locale: Locale }) {
  const [foreground, setForeground] = useState("#111827");
  const [background, setBackground] = useState("#ffffff");
  const ratio = useMemo(() => {
    try { return contrastRatio(foreground, background); }
    catch { return null; }
  }, [foreground, background]);
  const display = ratio === null ? "—" : ratio.toFixed(2) + ":1";
  return <div className="tool-grid"><Panel title={dictionary[locale].input}><label className="field"><span>{locale === "ru" ? "Цвет текста" : "Text color"}</span><input value={foreground} onChange={(event) => setForeground(event.target.value)} /></label><label className="field"><span>{locale === "ru" ? "Цвет фона" : "Background color"}</span><input value={background} onChange={(event) => setBackground(event.target.value)} /></label><ErrorMessage value={ratio === null ? dictionary[locale].error : ""} /></Panel><Panel title={dictionary[locale].result}><div className="contrast-preview" style={{ color: foreground, backgroundColor: background }}>{locale === "ru" ? "Пример текста" : "Text sample"}</div><p className="calculated-value">{display}</p>{ratio !== null && <ul className="result-list"><li>AA normal text: {ratio >= 4.5 ? "✓" : "—"}</li><li>AA large text: {ratio >= 3 ? "✓" : "—"}</li><li>AAA normal text: {ratio >= 7 ? "✓" : "—"}</li></ul>}</Panel></div>;
}

function AspectRatioTool({ locale }: { locale: Locale }) {
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [target, setTarget] = useState("1280");
  const [mode, setMode] = useState<"width" | "height">("width");
  let ratio = "—";
  let calculated = "—";
  let error = "";
  try {
    const [rw, rh] = reduceAspectRatio(Number(width), Number(height));
    ratio = `${rw}:${rh}`;
    calculated = mode === "width"
      ? `${Math.round(calculateHeight(Number(target), rw, rh))} px`
      : `${Math.round(calculateWidth(Number(target), rw, rh))} px`;
  } catch { error = dictionary[locale].error; }
  return <div className="tool-grid"><Panel title={dictionary[locale].input}><div className="field-row"><label className="field"><span>{locale === "ru" ? "Ширина" : "Width"}</span><input value={width} onChange={(event) => setWidth(event.target.value)} inputMode="numeric" /></label><label className="field"><span>{locale === "ru" ? "Высота" : "Height"}</span><input value={height} onChange={(event) => setHeight(event.target.value)} inputMode="numeric" /></label></div><label className="field"><span>{locale === "ru" ? "Рассчитать по" : "Calculate from"}</span><select value={mode} onChange={(event) => setMode(event.target.value as "width" | "height")}><option value="width">{locale === "ru" ? "ширине" : "width"}</option><option value="height">{locale === "ru" ? "высоте" : "height"}</option></select></label><label className="field"><span>{locale === "ru" ? "Новое значение" : "New value"}</span><input value={target} onChange={(event) => setTarget(event.target.value)} inputMode="numeric" /></label><ErrorMessage value={error} /></Panel><Panel title={dictionary[locale].result}><p className="calculated-value">{ratio}</p><p>{mode === "width" ? (locale === "ru" ? "Высота" : "Height") : (locale === "ru" ? "Ширина" : "Width")}: <strong>{calculated}</strong></p></Panel></div>;
}

export const SUPPORTED_TOOL_SLUGS = [
  "uuid-generator",
  "ulid-generator",
  "unix-timestamp-converter",
  "url-encoder-decoder",
  "base64-converter",
  "json-formatter-validator",
  "hash-generator",
  "px-rem-converter",
  "color-contrast-checker",
  "image-aspect-ratio-calculator",
  "image-optimizer",
  "image-format-converter",
  "image-resizer",
  "image-cropper",
  "svg-optimizer",
  "add-watermark-to-image",
  "image-metadata-viewer",
  "redirect-chain-checker",
  "robots-txt-tester",
  "sitemap-validator",
  "canonical-checker",
  "security-headers-checker",
  "meta-tags-checker",
  "serp-preview",
  "open-graph-preview",
  "structured-data-validator",
  "schema-markup-generator",
  "html-validator",
  "core-web-vitals-checker",
  "cache-policy-checker",
  "page-weight-analyzer",
  "image-performance-checker",
  "image-seo-audit",
  "favicon-checker",
  "link-analyzer",
  "broken-link-checker",
  "broken-image-checker",
] as const;

export function ToolRenderer({ slug, locale }: ToolRendererProps) {
  switch (slug) {
    case "uuid-generator": return <Generator locale={locale} kind="uuid" />;
    case "ulid-generator": return <Generator locale={locale} kind="ulid" />;
    case "unix-timestamp-converter": return <UnixTimestampTool locale={locale} />;
    case "url-encoder-decoder": return <TextCodec locale={locale} kind="url" />;
    case "base64-converter": return <TextCodec locale={locale} kind="base64" />;
    case "json-formatter-validator": return <JsonTool locale={locale} />;
    case "hash-generator": return <HashTool locale={locale} />;
    case "px-rem-converter": return <PxRemTool locale={locale} />;
    case "color-contrast-checker": return <ContrastTool locale={locale} />;
    case "image-aspect-ratio-calculator": return <AspectRatioTool locale={locale} />;
    case "image-optimizer": return <ImageOptimizerTool locale={locale} />;
    case "image-format-converter": return <ImageFormatConverterTool locale={locale} />;
    case "image-resizer": return <ImageResizerTool locale={locale} />;
    case "image-cropper": return <ImageCropperTool locale={locale} />;
    case "svg-optimizer": return <SvgOptimizerTool locale={locale} />;
    case "add-watermark-to-image": return <AddWatermarkImageTool locale={locale} />;
    case "image-metadata-viewer": return <ImageMetadataViewerTool locale={locale} />;
    case "redirect-chain-checker": return <RedirectChainTool locale={locale} />;
    case "robots-txt-tester": return <RobotsTxtTool locale={locale} />;
    case "sitemap-validator": return <SitemapValidatorTool locale={locale} />;
    case "canonical-checker": return <CanonicalCheckerTool locale={locale} />;
    case "security-headers-checker": return <SecurityHeadersTool locale={locale} />;
    case "meta-tags-checker": return <MetaTagsCheckerTool locale={locale} />;
    case "serp-preview": return <SerpPreviewTool locale={locale} />;
    case "open-graph-preview": return <SocialPreviewTool locale={locale} />;
    case "structured-data-validator": return <StructuredDataValidatorTool locale={locale} />;
    case "schema-markup-generator": return <SchemaMarkupGeneratorTool locale={locale} />;
    case "html-validator": return <HtmlMarkupValidatorTool locale={locale} />;
    case "core-web-vitals-checker": return <CoreWebVitalsTool locale={locale} />;
    case "cache-policy-checker": return <CachePolicyTool locale={locale} />;
    case "page-weight-analyzer": return <PageWeightTool locale={locale} />;
    case "image-performance-checker": return <ImagePerformanceCheckerTool locale={locale} />;
    case "image-seo-audit": return <ImageSeoAuditTool locale={locale} />;
    case "favicon-checker": return <FaviconCheckerTool locale={locale} />;
    case "link-analyzer": return <LinkAnalyzerTool locale={locale} />;
    case "broken-link-checker": return <BrokenLinkCheckerTool locale={locale} />;
    case "broken-image-checker": return <BrokenImageCheckerTool locale={locale} />;
    default: return null;
  }
}
