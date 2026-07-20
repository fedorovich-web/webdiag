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
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

interface LoadedImage {
  file: File;
  bitmap: ImageBitmap;
}

interface ResultFile {
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
}

function t(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new TypeError("Unsupported image format.");
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
      (blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode this image format.")),
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

function formatBytes(bytes: number, locale: Locale): string {
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
      setDetails(`${loaded.bitmap.width} × ${loaded.bitmap.height} · ${formatBytes(file.size, locale)}`);
      onLoaded(loaded);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось открыть изображение.", "Could not open the image."));
    }
  }
  return <div className="field">
    <label>
      <span>{t(locale, "Изображение", "Image")}</span>
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void change(event.target.files?.[0])} />
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
        <div><dt>{t(locale, "Размер файла", "File size")}</dt><dd>{formatBytes(result.size, locale)}</dd></div>
      </dl>
      <a className="button" href={result.url} download={result.filename}>{t(locale, "Скачать изображение", "Download image")}</a>
    </> : <p className="muted-text">{t(locale, "Результат появится после обработки файла.", "The result will appear after processing the file.")}</p>}
  </section>;
}

function FormatField({ locale, value, onChange }: { locale: Locale; value: RasterOutputFormat; onChange: (value: RasterOutputFormat) => void }) {
  return <label className="field"><span>{t(locale, "Формат результата", "Output format")}</span>
    <select value={value} onChange={(event) => onChange(event.target.value as RasterOutputFormat)}>
      <option value="image/png">PNG</option>
      <option value="image/jpeg">JPEG</option>
      <option value="image/webp">WebP</option>
    </select>
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
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "optimized", format), size: blob.size, width: canvas.width, height: canvas.height });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Не удалось обработать изображение.", "Could not process the image.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Параметры", "Settings")}</h2><FileField locale={locale} onLoaded={setImage} /><FormatField locale={locale} value={format} onChange={setFormat} /><label className="field"><span>{t(locale, "Качество JPEG/WebP", "JPEG/WebP quality")}: {Math.round(quality * 100)}%</span><input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label><button className="button" type="button" onClick={() => void run()}>{t(locale, "Оптимизировать", "Optimize")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}

export function ImageFormatConverterTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [format, setFormat] = useState<RasterOutputFormat>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [error, setError] = useState("");
  const [result, setResult] = useImageResult();
  async function run() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const { canvas, context } = makeCanvas(image.bitmap.width, image.bitmap.height);
      context.drawImage(image.bitmap, 0, 0);
      const blob = await canvasToBlob(canvas, format, quality);
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "converted", format), size: blob.size, width: canvas.width, height: canvas.height });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Не удалось конвертировать изображение.", "Could not convert the image.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Параметры", "Settings")}</h2><FileField locale={locale} onLoaded={setImage} /><FormatField locale={locale} value={format} onChange={setFormat} />{format !== "image/png" && <label className="field"><span>{t(locale, "Качество", "Quality")}: {Math.round(quality * 100)}%</span><input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>}<button className="button" type="button" onClick={() => void run()}>{t(locale, "Конвертировать", "Convert")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}

export function ImageResizerTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<RasterOutputFormat>("image/png");
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
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "resized", format), size: blob.size, ...dimensions });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Проверьте размеры.", "Check the dimensions.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Новые размеры", "New dimensions")}</h2><FileField locale={locale} onLoaded={loaded} /><div className="field-row"><label className="field"><span>{t(locale, "Ширина, px", "Width, px")}</span><input inputMode="numeric" value={width} onChange={(event) => changeWidth(event.target.value)} /></label><label className="field"><span>{t(locale, "Высота, px", "Height, px")}</span><input inputMode="numeric" value={height} onChange={(event) => changeHeight(event.target.value)} /></label></div><label className="check-field"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} />{t(locale, "Сохранять пропорции", "Preserve aspect ratio")}</label><FormatField locale={locale} value={format} onChange={setFormat} /><button className="button" type="button" onClick={() => void run()}>{t(locale, "Изменить размер", "Resize")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}

export function ImageCropperTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [rectangle, setRectangle] = useState({ x: "0", y: "0", width: "", height: "" });
  const [format, setFormat] = useState<RasterOutputFormat>("image/png");
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
      setResult({ url: URL.createObjectURL(blob), filename: filenameFor(image.file, "cropped", format), size: blob.size, width: crop.width, height: crop.height });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t(locale, "Проверьте область обрезки.", "Check the crop area.")); }
  }
  return <div className="tool-grid"><section className="tool-panel"><h2>{t(locale, "Область обрезки", "Crop area")}</h2><FileField locale={locale} onLoaded={loaded} /><div className="crop-grid">{(["x", "y", "width", "height"] as const).map((key) => <label className="field" key={key}><span>{key === "width" ? t(locale, "Ширина", "Width") : key === "height" ? t(locale, "Высота", "Height") : key.toUpperCase()}</span><input inputMode="numeric" value={rectangle[key]} onChange={(event) => field(key, event.target.value)} /></label>)}</div><FormatField locale={locale} value={format} onChange={setFormat} /><button className="button" type="button" onClick={() => void run()}>{t(locale, "Обрезать", "Crop")}</button>{error && <p className="form-error" role="alert">{error}</p>}</section><ResultPanel locale={locale} result={result} /></div>;
}
