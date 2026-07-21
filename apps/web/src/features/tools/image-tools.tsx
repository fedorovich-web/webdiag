"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  normalizeCropRectangle,
  normalizeImageQuality,
  outputExtension,
  resizeToHeight,
  resizeToWidth,
  validateImageDimensions,
  type RasterOutputFormat,
} from "@webdiag/tool-core";

const MAX_PIXELS = 40_000_000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const RASTER_INPUT_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"] as const;
export const RASTER_OUTPUT_FORMAT_OPTIONS: readonly { value: RasterOutputFormat; label: string; lossy: boolean }[] = [
  { value: "image/avif", label: "AVIF", lossy: true },
  { value: "image/webp", label: "WebP", lossy: true },
  { value: "image/jpeg", label: "JPEG", lossy: true },
  { value: "image/png", label: "PNG", lossy: false },
] as const;

const ACCEPTED_TYPES = new Set<string>(RASTER_INPUT_MIME_TYPES);

interface LoadedImage {
  file: File;
  bitmap: ImageBitmap;
}

interface ResultFile {
  url: string;
  filename: string;
  size: number;
  sourceSize: number;
  width: number;
  height: number;
  format: RasterOutputFormat;
}

function t(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

export function isAcceptedRasterInputType(value: string): boolean {
  return ACCEPTED_TYPES.has(value.toLowerCase());
}

export function isAcceptedRasterFilename(value: string): boolean {
  return /\.(?:png|jpe?g|webp|avif)$/i.test(value.trim());
}

export function imageAcceptAttribute(): string {
  return RASTER_INPUT_MIME_TYPES.join(",");
}

export function formatMimeLabel(value: RasterOutputFormat | string): string {
  if (value === "image/avif") return "AVIF";
  if (value === "image/webp") return "WebP";
  if (value === "image/jpeg") return "JPEG";
  if (value === "image/png") return "PNG";
  return value || "unknown";
}

export function compressionDelta(sourceBytes: number, outputBytes: number): { bytes: number; percent: number } {
  if (!Number.isFinite(sourceBytes) || sourceBytes <= 0 || !Number.isFinite(outputBytes) || outputBytes < 0) {
    throw new TypeError("Image byte sizes must be finite and the source size must be greater than zero.");
  }
  const bytes = sourceBytes - outputBytes;
  return { bytes, percent: bytes / sourceBytes };
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (file.size > MAX_FILE_BYTES) {
    throw new RangeError("Image file is too large for browser-local processing.");
  }
  if (!isAcceptedRasterInputType(file.type) && !isAcceptedRasterFilename(file.name)) {
    throw new TypeError("Unsupported image format. Use PNG, JPEG, WebP, or AVIF if your browser supports it.");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  validateImageDimensions(bitmap.width, bitmap.height);
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new RangeError("Image dimensions are too large for browser processing.");
  }
  return { file, bitmap };
}

function canvasToBlob(canvas: HTMLCanvasElement, format: RasterOutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error(`The browser could not encode ${formatMimeLabel(format)}. Try WebP, JPEG, or PNG in this browser.`)),
      format,
      format === "image/png" ? undefined : normalizeImageQuality(quality),
    );
  });
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

function filenameFor(file: File, suffix: string, format: RasterOutputFormat): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return `${base}-${suffix}.${outputExtension(format)}`;
}

export function formatBytes(bytes: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: 1 });
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${formatter.format(bytes / 1024)} KB`;
  return `${formatter.format(bytes / 1024 ** 2)} MB`;
}

function useImageResult() {
  const [result, setResult] = useState<ResultFile | null>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  function replace(next: ResultFile | null) {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return next;
    });
  }
  return [result, replace] as const;
}

function FileField({ locale, onLoaded }: { locale: Locale; onLoaded: (image: LoadedImage) => void }) {
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  async function change(file: File | undefined) {
    setError("");
    setDetails("");
    if (!file) return;
    try {
      const loaded = await loadImage(file);
      setDetails(`${loaded.bitmap.width} × ${loaded.bitmap.height} · ${formatBytes(file.size, locale)} · ${formatMimeLabel(file.type || file.name.split(".").pop() || "unknown")}`);
      onLoaded(loaded);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось открыть изображение.", "Could not open the image."));
    }
  }
  return <div className="field">
    <label>
      <span>{t(locale, "Изображение", "Image")}</span>
      <input type="file" accept={imageAcceptAttribute()} onChange={(event) => void change(event.target.files?.[0])} />
    </label>
    {details && <small>{details}</small>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}

function ResultPanel({ locale, result }: { locale: Locale; result: ResultFile | null }) {
  return <section className="tool-panel">
    <h2>{t(locale, "Результат", "Result")}</h2>
    {result ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="image-preview" src={result.url} alt={t(locale, "Предпросмотр обработанного изображения", "Processed image preview")} />
      <dl className="result-meta">
        <div><dt>{t(locale, "Размеры", "Dimensions")}</dt><dd>{result.width} × {result.height}</dd></div>
        <div><dt>{t(locale, "Формат", "Format")}</dt><dd>{formatMimeLabel(result.format)}</dd></div>
        <div><dt>{t(locale, "Размер файла", "File size")}</dt><dd>{formatBytes(result.size, locale)}</dd></div>
        <div><dt>{t(locale, "Изменение", "Change")}</dt><dd>{(() => { const delta = compressionDelta(result.sourceSize, result.size); const sign = delta.bytes >= 0 ? "−" : "+"; return `${sign}${formatBytes(Math.abs(delta.bytes), locale)} (${Math.round(Math.abs(delta.percent) * 100)}%)`; })()}</dd></div>
      </dl>
      <a className="button" href={result.url} download={result.filename}>{t(locale, "Скачать изображение", "Download image")}</a>
    </> : <p className="muted-text">{t(locale, "Результат появится после обработки файла.", "The result will appear after processing the file.")}</p>}
  </section>;
}

function FormatField({ locale, value, onChange }: { locale: Locale; value: RasterOutputFormat; onChange: (value: RasterOutputFormat) => void }) {
  return <label className="field"><span>{t(locale, "Формат результата", "Output format")}</span>
    <select value={value} onChange={(event) => onChange(event.target.value as RasterOutputFormat)}>
      {RASTER_OUTPUT_FORMAT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
    </select>
    <small>{t(locale, "AVIF вывод зависит от поддержки Canvas encoder в текущем браузере.", "AVIF output depends on Canvas encoder support in the current browser.")}</small>
  </label>;
}

export function ImageOptimizerTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [format, setFormat] = useState<RasterOutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.8);
  const [error, setError] = useState("");
  const [result, setResult] = useImageResult();
  async function run() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const { canvas, context } = makeCanvas(image.bitmap.width, image.bitmap.height);
      context.drawImage(image.bitmap, 0, 0);
      const blob = await canvasToBlob(canvas, format, quality);
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "compressed", format), size: blob.size, sourceSize: image.file.size, width: canvas.width, height: canvas.height, format });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Не удалось обработать изображение.", "Could not process the image.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Параметры", "Settings")}</h2><FileField locale={locale} onLoaded={setImage} /><FormatField locale={locale} value={format} onChange={setFormat} /><label className="field"><span>{t(locale, "Качество JPEG/WebP/AVIF", "JPEG/WebP/AVIF quality")}: {Math.round(quality * 100)}%</span><input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label><button className="button" type="button" onClick={() => void run()}>{t(locale, "Оптимизировать", "Optimize")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}

export function ImageFormatConverterTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [format, setFormat] = useState<RasterOutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.82);
  const [error, setError] = useState("");
  const [result, setResult] = useImageResult();
  async function run() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const { canvas, context } = makeCanvas(image.bitmap.width, image.bitmap.height);
      context.drawImage(image.bitmap, 0, 0);
      const blob = await canvasToBlob(canvas, format, quality);
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "converted", format), size: blob.size, sourceSize: image.file.size, width: canvas.width, height: canvas.height, format });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Не удалось конвертировать изображение.", "Could not convert the image.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Параметры", "Settings")}</h2><FileField locale={locale} onLoaded={setImage} /><FormatField locale={locale} value={format} onChange={setFormat} />{format !== "image/png" && <label className="field"><span>{t(locale, "Качество JPEG/WebP/AVIF", "JPEG/WebP/AVIF quality")}: {Math.round(quality * 100)}%</span><input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>}<button className="button" type="button" onClick={() => void run()}>{t(locale, "Конвертировать", "Convert")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}

export function ImageResizerTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<RasterOutputFormat>("image/webp");
  const [error, setError] = useState("");
  const [result, setResult] = useImageResult();
  function loaded(next: LoadedImage) { setImage(next); setWidth(String(next.bitmap.width)); setHeight(String(next.bitmap.height)); }
  function changeWidth(value: string) { setWidth(value); if (lockRatio && image && Number(value) > 0) setHeight(String(resizeToWidth(image.bitmap.width, image.bitmap.height, Number(value)).height)); }
  function changeHeight(value: string) { setHeight(value); if (lockRatio && image && Number(value) > 0) setWidth(String(resizeToHeight(image.bitmap.width, image.bitmap.height, Number(value)).width)); }
  async function run() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const dimensions = validateImageDimensions(Number(width), Number(height));
      const { canvas, context } = makeCanvas(dimensions.width, dimensions.height);
      context.drawImage(image.bitmap, 0, 0, dimensions.width, dimensions.height);
      const blob = await canvasToBlob(canvas, format, 0.92);
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "resized", format), size: blob.size, sourceSize: image.file.size, ...dimensions, format });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Проверьте размеры.", "Check the dimensions.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Новые размеры", "New dimensions")}</h2><FileField locale={locale} onLoaded={loaded} /><div className="field-row"><label className="field"><span>{t(locale, "Ширина, px", "Width, px")}</span><input inputMode="numeric" value={width} onChange={(event) => changeWidth(event.target.value)} /></label><label className="field"><span>{t(locale, "Высота, px", "Height, px")}</span><input inputMode="numeric" value={height} onChange={(event) => changeHeight(event.target.value)} /></label></div><label className="check-field"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} />{t(locale, "Сохранять пропорции", "Preserve aspect ratio")}</label><FormatField locale={locale} value={format} onChange={setFormat} /><button className="button" type="button" onClick={() => void run()}>{t(locale, "Изменить размер", "Resize")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}

export function ImageCropperTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [rectangle, setRectangle] = useState({ x: "0", y: "0", width: "", height: "" });
  const [format, setFormat] = useState<RasterOutputFormat>("image/webp");
  const [error, setError] = useState("");
  const [result, setResult] = useImageResult();
  function loaded(next: LoadedImage) { setImage(next); setRectangle({ x: "0", y: "0", width: String(next.bitmap.width), height: String(next.bitmap.height) }); }
  function field(key: keyof typeof rectangle, value: string) { setRectangle((current) => ({ ...current, [key]: value })); }
  async function run() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const crop = normalizeCropRectangle(image.bitmap.width, image.bitmap.height, { x: Number(rectangle.x), y: Number(rectangle.y), width: Number(rectangle.width), height: Number(rectangle.height) });
      const { canvas, context } = makeCanvas(crop.width, crop.height);
      context.drawImage(image.bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      const blob = await canvasToBlob(canvas, format, 0.92);
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "cropped", format), size: blob.size, sourceSize: image.file.size, width: crop.width, height: crop.height, format });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Проверьте область обрезки.", "Check the crop area.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Область обрезки", "Crop area")}</h2><FileField locale={locale} onLoaded={loaded} /><div className="crop-grid">{(["x", "y", "width", "height"] as const).map((key) => <label className="field" key={key}><span>{key === "width" ? t(locale, "Ширина", "Width") : key === "height" ? t(locale, "Высота", "Height") : key.toUpperCase()}</span><input inputMode="numeric" value={rectangle[key]} onChange={(event) => field(key, event.target.value)} /></label>)}</div><FormatField locale={locale} value={format} onChange={setFormat} /><button className="button" type="button" onClick={() => void run()}>{t(locale, "Обрезать", "Crop")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}
