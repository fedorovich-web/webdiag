"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  detectImageMetadataSignals,
  normalizeImageQuality,
  normalizeWatermarkOpacity,
  normalizeWatermarkText,
  optimizeSvgText,
  outputExtension,
  validateImageDimensions,
  watermarkAnchor,
  type ImageMetadataSignals,
  type RasterOutputFormat,
  type WatermarkPosition,
} from "@webdiag/tool-core";
import {
  RASTER_OUTPUT_FORMAT_OPTIONS,
  compressionDelta,
  formatBytes,
  formatMimeLabel,
  imageAcceptAttribute,
} from "./image-tools";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const SVG_ACCEPT = ".svg,image/svg+xml";
const METADATA_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

interface LoadedImage {
  file: File;
  bitmap: ImageBitmap;
}

interface RasterResult {
  url: string;
  filename: string;
  size: number;
  sourceSize: number;
  width: number;
  height: number;
  format: RasterOutputFormat;
}

interface SvgResult {
  url: string;
  filename: string;
  optimized: string;
  sourceBytes: number;
  outputBytes: number;
  removedBytes: number;
  savingsPercent: number;
}

export function isAcceptedSvgFilename(value: string): boolean {
  return /\.svg$/i.test(value.trim());
}

export function svgAcceptAttribute(): string {
  return SVG_ACCEPT;
}

export function metadataAcceptAttribute(): string {
  return METADATA_ACCEPT;
}

export function metadataSignalSummary(signals: ImageMetadataSignals, locale: Locale): string[] {
  if (!signals.hasMetadata) {
    return [locale === "ru" ? "Метаданные не обнаружены." : "No metadata signals detected."];
  }
  return signals.detectedSegments.map((segment) => segment);
}

function t(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

function fileStem(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || "image";
}

function rasterFilename(file: File, suffix: string, format: RasterOutputFormat): string {
  return `${fileStem(file)}-${suffix}.${outputExtension(format)}`;
}

async function loadRasterImage(file: File): Promise<LoadedImage> {
  if (file.size > MAX_FILE_BYTES) throw new RangeError("Image file is too large for browser-local processing.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  validateImageDimensions(bitmap.width, bitmap.height);
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new RangeError("Image dimensions are too large for browser processing.");
  }
  return { file, bitmap };
}

function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  validateImageDimensions(width, height);
  if (width * height > MAX_PIXELS) throw new RangeError("Output dimensions are too large.");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("Canvas 2D is not available in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

function canvasToBlob(canvas: HTMLCanvasElement, format: RasterOutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error(`The browser could not encode ${formatMimeLabel(format)}.`)),
      format,
      format === "image/png" ? undefined : normalizeImageQuality(quality),
    );
  });
}

function useObjectUrlResult<T extends { url: string }>() {
  const [result, setResult] = useState<T | null>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  function replace(next: T | null) {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return next;
    });
  }
  return [result, replace] as const;
}

function RasterResultPanel({ locale, result }: { locale: Locale; result: RasterResult | null }) {
  return <section className="tool-panel">
    <h2>{t(locale, "Результат", "Result")}</h2>
    {result ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="image-preview" src={result.url} alt={t(locale, "Предпросмотр результата", "Result preview")} />
      <dl className="result-meta">
        <div><dt>{t(locale, "Размеры", "Dimensions")}</dt><dd>{result.width} × {result.height}</dd></div>
        <div><dt>{t(locale, "Формат", "Format")}</dt><dd>{formatMimeLabel(result.format)}</dd></div>
        <div><dt>{t(locale, "Размер файла", "File size")}</dt><dd>{formatBytes(result.size, locale)}</dd></div>
        <div><dt>{t(locale, "Изменение", "Change")}</dt><dd>{(() => { const delta = compressionDelta(result.sourceSize, result.size); const sign = delta.bytes >= 0 ? "−" : "+"; return `${sign}${formatBytes(Math.abs(delta.bytes), locale)} (${Math.round(Math.abs(delta.percent) * 100)}%)`; })()}</dd></div>
      </dl>
      <a className="button" href={result.url} download={result.filename}>{t(locale, "Скачать файл", "Download file")}</a>
    </> : <p className="muted-text">{t(locale, "Результат появится после обработки файла.", "The result will appear after processing the file.")}</p>}
  </section>;
}

function OutputFormatField({ locale, value, onChange }: { locale: Locale; value: RasterOutputFormat; onChange: (value: RasterOutputFormat) => void }) {
  return <label className="field"><span>{t(locale, "Формат результата", "Output format")}</span>
    <select value={value} onChange={(event) => onChange(event.target.value as RasterOutputFormat)}>
      {RASTER_OUTPUT_FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

export function SvgOptimizerTool({ locale }: { locale: Locale }) {
  const [source, setSource] = useState('<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z" /></svg>');
  const [error, setError] = useState("");
  const [result, setResult] = useObjectUrlResult<SvgResult>();

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setError(t(locale, "SVG слишком большой для браузерной обработки.", "The SVG is too large for browser-local processing."));
    if (file.type !== "image/svg+xml" && !isAcceptedSvgFilename(file.name)) return setError(t(locale, "Выберите SVG-файл.", "Choose an SVG file."));
    setSource(await file.text());
    setError("");
  }

  function run() {
    try {
      const optimized = optimizeSvgText(source);
      const blob = new Blob([optimized.optimized], { type: "image/svg+xml" });
      const next = {
        ...optimized,
        url: URL.createObjectURL(blob),
        filename: "optimized.svg",
      };
      setResult(next);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось оптимизировать SVG.", "Could not optimize the SVG."));
    }
  }

  return <div className="tool-grid">
    <section className="tool-panel">
      <h2>{t(locale, "SVG", "SVG")}</h2>
      <label className="field"><span>{t(locale, "Файл", "File")}</span><input type="file" accept={svgAcceptAttribute()} onChange={(event) => void loadFile(event.target.files?.[0])} /></label>
      <label className="field"><span>{t(locale, "Исходный SVG", "Source SVG")}</span><textarea className="code-input" rows={12} value={source} onChange={(event) => setSource(event.target.value)} /></label>
      <button className="button" type="button" onClick={run}>{t(locale, "Оптимизировать SVG", "Optimize SVG")}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
      <small>{t(locale, "Активный SVG-контент блокируется: script, inline handlers, javascript: и foreignObject.", "Active SVG content is blocked: script, inline handlers, javascript:, and foreignObject.")}</small>
    </section>
    <section className="tool-panel">
      <h2>{t(locale, "Результат", "Result")}</h2>
      {result ? <>
        <dl className="result-meta">
          <div><dt>{t(locale, "Было", "Before")}</dt><dd>{formatBytes(result.sourceBytes, locale)}</dd></div>
          <div><dt>{t(locale, "Стало", "After")}</dt><dd>{formatBytes(result.outputBytes, locale)}</dd></div>
          <div><dt>{t(locale, "Экономия", "Savings")}</dt><dd>{formatBytes(result.removedBytes, locale)} ({Math.round(result.savingsPercent * 100)}%)</dd></div>
        </dl>
        <div className="output-wrap"><pre className="output">{result.optimized}</pre></div>
        <a className="button" href={result.url} download={result.filename}>{t(locale, "Скачать SVG", "Download SVG")}</a>
      </> : <p className="muted-text">{t(locale, "Оптимизированный SVG появится здесь.", "The optimized SVG will appear here.")}</p>}
    </section>
  </div>;
}

export function AddWatermarkImageTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [text, setText] = useState("WebDiag");
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [opacity, setOpacity] = useState(0.55);
  const [fontSize, setFontSize] = useState(42);
  const [format, setFormat] = useState<RasterOutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.88);
  const [error, setError] = useState("");
  const [result, setResult] = useObjectUrlResult<RasterResult>();

  async function load(file: File | undefined) {
    setError("");
    if (!file) return;
    try { setImage(await loadRasterImage(file)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Не удалось открыть изображение.", "Could not open the image.")); }
  }

  async function run() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const watermark = normalizeWatermarkText(text);
      const { canvas, context } = makeCanvas(image.bitmap.width, image.bitmap.height);
      context.drawImage(image.bitmap, 0, 0);
      const size = Math.max(12, Math.min(240, Math.round(fontSize)));
      const margin = Math.max(16, Math.round(Math.min(canvas.width, canvas.height) * 0.04));
      const anchor = watermarkAnchor(position, canvas.width, canvas.height, margin);
      context.save();
      context.globalAlpha = normalizeWatermarkOpacity(opacity);
      context.font = `700 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
      context.textAlign = anchor.textAlign;
      context.textBaseline = anchor.textBaseline;
      context.lineWidth = Math.max(2, Math.round(size / 12));
      context.strokeStyle = "rgba(0,0,0,0.55)";
      context.fillStyle = "rgba(255,255,255,0.92)";
      context.strokeText(watermark, anchor.x, anchor.y);
      context.fillText(watermark, anchor.x, anchor.y);
      context.restore();
      const blob = await canvasToBlob(canvas, format, quality);
      setResult({ url: URL.createObjectURL(blob), filename: rasterFilename(image.file, "watermarked", format), size: blob.size, sourceSize: image.file.size, width: canvas.width, height: canvas.height, format });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось добавить водяной знак.", "Could not add the watermark."));
    }
  }

  return <div className="tool-grid">
    <section className="tool-panel">
      <h2>{t(locale, "Параметры", "Settings")}</h2>
      <label className="field"><span>{t(locale, "Изображение", "Image")}</span><input type="file" accept={imageAcceptAttribute()} onChange={(event) => void load(event.target.files?.[0])} /></label>
      {image && <small>{image.bitmap.width} × {image.bitmap.height} · {formatBytes(image.file.size, locale)}</small>}
      <label className="field"><span>{t(locale, "Текст водяного знака", "Watermark text")}</span><input value={text} maxLength={80} onChange={(event) => setText(event.target.value)} /></label>
      <label className="field"><span>{t(locale, "Позиция", "Position")}</span><select value={position} onChange={(event) => setPosition(event.target.value as WatermarkPosition)}><option value="bottom-right">{t(locale, "Снизу справа", "Bottom right")}</option><option value="bottom-left">{t(locale, "Снизу слева", "Bottom left")}</option><option value="top-right">{t(locale, "Сверху справа", "Top right")}</option><option value="top-left">{t(locale, "Сверху слева", "Top left")}</option><option value="center">{t(locale, "По центру", "Center")}</option></select></label>
      <label className="field"><span>{t(locale, "Прозрачность", "Opacity")}: {Math.round(opacity * 100)}%</span><input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label>
      <label className="field"><span>{t(locale, "Размер текста, px", "Text size, px")}</span><input inputMode="numeric" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
      <OutputFormatField locale={locale} value={format} onChange={setFormat} />
      {format !== "image/png" && <label className="field"><span>{t(locale, "Качество", "Quality")}: {Math.round(quality * 100)}%</span><input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>}
      <button className="button" type="button" onClick={() => void run()}>{t(locale, "Добавить водяной знак", "Add watermark")}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
    <RasterResultPanel locale={locale} result={result} />
  </div>;
}

export function ImageMetadataViewerTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [signals, setSignals] = useState<ImageMetadataSignals | null>(null);
  const [format, setFormat] = useState<RasterOutputFormat>("image/webp");
  const [error, setError] = useState("");
  const [result, setResult] = useObjectUrlResult<RasterResult>();
  const summary = useMemo(() => signals ? metadataSignalSummary(signals, locale) : [], [signals, locale]);

  async function load(file: File | undefined) {
    setError("");
    setSignals(null);
    setResult(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setError(t(locale, "Файл слишком большой для браузерной обработки.", "The file is too large for browser-local processing."));
    try {
      const buffer = await file.arrayBuffer();
      setSignals(detectImageMetadataSignals(buffer));
      setImage(await loadRasterImage(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось прочитать изображение.", "Could not read the image."));
    }
  }

  async function removeMetadata() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const { canvas, context } = makeCanvas(image.bitmap.width, image.bitmap.height);
      context.drawImage(image.bitmap, 0, 0);
      const blob = await canvasToBlob(canvas, format, 0.92);
      setResult({ url: URL.createObjectURL(blob), filename: rasterFilename(image.file, "metadata-stripped", format), size: blob.size, sourceSize: image.file.size, width: canvas.width, height: canvas.height, format });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось удалить метаданные.", "Could not remove metadata."));
    }
  }

  return <div className="tool-grid">
    <section className="tool-panel">
      <h2>{t(locale, "Изображение", "Image")}</h2>
      <label className="field"><span>{t(locale, "Файл", "File")}</span><input type="file" accept={metadataAcceptAttribute()} onChange={(event) => void load(event.target.files?.[0])} /></label>
      {image && <small>{image.bitmap.width} × {image.bitmap.height} · {formatBytes(image.file.size, locale)}</small>}
      {signals && <dl className="result-meta"><div><dt>{t(locale, "Формат", "Format")}</dt><dd>{signals.format.toUpperCase()}</dd></div><div><dt>EXIF</dt><dd>{signals.exif ? "yes" : "no"}</dd></div><div><dt>XMP</dt><dd>{signals.xmp ? "yes" : "no"}</dd></div><div><dt>ICC</dt><dd>{signals.iccProfile ? "yes" : "no"}</dd></div></dl>}
      {signals && <ul className="result-list">{summary.map((item) => <li key={item}>{item}</li>)}</ul>}
      <OutputFormatField locale={locale} value={format} onChange={setFormat} />
      <button className="button" type="button" onClick={() => void removeMetadata()}>{t(locale, "Удалить метаданные перекодированием", "Remove metadata by re-encoding")}</button>
      <small>{t(locale, "Удаление выполняется локальным Canvas re-encode: результат может изменить формат, цветовой профиль и вес файла.", "Removal uses local Canvas re-encode: the result can change format, color profile, and file size.")}</small>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
    <RasterResultPanel locale={locale} result={result} />
  </div>;
}
