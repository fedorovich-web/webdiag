"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { formatBytes, imageAcceptAttribute, isAcceptedRasterFilename } from "./image-tools";

const MAX_SOURCE_BYTES = 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const PLACEHOLDER_MAX_SIDE = 24;

type RasterMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

interface WorkbenchResult {
  sourceDataUri: string;
  placeholderDataUri: string;
  cssSnippet: string;
  mediaType: RasterMediaType;
  sourceBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  placeholderBytes: number;
  placeholderWidth: number;
  placeholderHeight: number;
}

export function validateDataUriSourceSize(value: number): number {
  if (!Number.isInteger(value) || value < 1) throw new RangeError("Image file is empty.");
  if (value > MAX_SOURCE_BYTES) throw new RangeError("Image file must not exceed 1 MiB.");
  return value;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

export function inferRasterMediaType(bytes: Uint8Array): RasterMediaType {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 12)) === "ftypavif") return "image/avif";
  throw new TypeError("The file has an unsupported image signature.");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function imageBytesToDataUri(bytes: Uint8Array): string {
  validateDataUriSourceSize(bytes.byteLength);
  return `data:${inferRasterMediaType(bytes)};base64,${bytesToBase64(bytes)}`;
}

export function placeholderDimensions(width: number, height: number): { width: number; height: number } {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > MAX_PIXELS) {
    throw new RangeError("Image dimensions are invalid.");
  }
  const scale = Math.min(1, PLACEHOLDER_MAX_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the PNG placeholder.")),
    "image/png",
  ));
}

function blobDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The browser could not read the generated placeholder."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The generated placeholder is invalid."));
    reader.readAsDataURL(blob);
  });
}

function t(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

export function ImageDataUriWorkbenchTool({ locale }: { locale: Locale }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [result, setResult] = useState<WorkbenchResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => bitmap?.close(), [bitmap]);

  async function load(next: File | undefined) {
    setError("");
    setResult(null);
    setFile(null);
    setBitmap(null);
    if (!next) return;
    try {
      validateDataUriSourceSize(next.size);
      if (!isAcceptedRasterFilename(next.name)) throw new TypeError("Use a JPEG, PNG, WebP, or AVIF file.");
      const bytes = new Uint8Array(await next.arrayBuffer());
      inferRasterMediaType(bytes);
      const decoded = await createImageBitmap(next, { imageOrientation: "from-image" });
      placeholderDimensions(decoded.width, decoded.height);
      setFile(next);
      setBitmap(decoded);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось открыть изображение.", "Could not open the image."));
    }
  }

  async function create() {
    if (!file || !bitmap) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mediaType = inferRasterMediaType(bytes);
      const sourceDataUri = imageBytesToDataUri(bytes);
      const dimensions = placeholderDimensions(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Canvas 2D is not available in this browser.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
      const placeholder = await canvasPng(canvas);
      const placeholderDataUri = await blobDataUri(placeholder);
      setResult({
        sourceDataUri,
        placeholderDataUri,
        cssSnippet: `background-image: url("${placeholderDataUri}");`,
        mediaType,
        sourceBytes: bytes.byteLength,
        sourceWidth: bitmap.width,
        sourceHeight: bitmap.height,
        placeholderBytes: placeholder.size,
        placeholderWidth: dimensions.width,
        placeholderHeight: dimensions.height,
      });
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : t(locale, "Не удалось создать Data URI.", "Could not create the Data URIs."));
    }
  }

  return <div className="tool-grid image-data-uri-tool">
    <section className="tool-panel">
      <h2>{t(locale, "Исходное изображение", "Source image")}</h2>
      <label className="field"><span>{t(locale, "JPEG, PNG, WebP или AVIF до 1 МиБ", "JPEG, PNG, WebP, or AVIF up to 1 MiB")}</span><input type="file" accept={imageAcceptAttribute()} onChange={(event) => void load(event.target.files?.[0])} /></label>
      {file && bitmap && <dl className="result-meta"><div><dt>{t(locale, "Размер", "Dimensions")}</dt><dd>{bitmap.width} × {bitmap.height}</dd></div><div><dt>{t(locale, "Вес", "File size")}</dt><dd>{formatBytes(file.size, locale)}</dd></div></dl>}
      <button className="button" type="button" onClick={() => void create()} disabled={!file || !bitmap}>{t(locale, "Создать Data URI", "Create Data URIs")}</button>
      <small>{t(locale, "Полный Data URI содержит все байты исходника и увеличивает текстовый размер. Placeholder — отдельный PNG до 24 px, не BlurHash.", "The full Data URI contains every source byte and increases text size. The placeholder is a separate PNG up to 24 px, not BlurHash.")}</small>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
    <section className="tool-panel" aria-live="polite">
      <h2>{t(locale, "Результат", "Result")}</h2>
      {result ? <div className="data-uri-results">
        <article><div className="result-heading"><h3>{t(locale, "Точный Data URI исходника", "Exact source Data URI")}</h3><CopyButton value={result.sourceDataUri} locale={locale} /></div><p className="muted-text">{result.mediaType} · {result.sourceWidth} × {result.sourceHeight} · {formatBytes(result.sourceBytes, locale)} · {result.sourceDataUri.length.toLocaleString(locale)} {t(locale, "символов", "characters")}</p><textarea aria-label={t(locale, "Точный Data URI исходника", "Exact source Data URI")} className="output" rows={5} readOnly value={result.sourceDataUri} /></article>
        <article><div className="result-heading"><h3>{t(locale, "Миниатюрный PNG placeholder", "Tiny PNG placeholder")}</h3><CopyButton value={result.placeholderDataUri} locale={locale} /></div><p className="muted-text">{result.placeholderWidth} × {result.placeholderHeight} · {formatBytes(result.placeholderBytes, locale)}</p><textarea aria-label={t(locale, "Миниатюрный PNG placeholder Data URI", "Tiny PNG placeholder Data URI")} className="output" rows={4} readOnly value={result.placeholderDataUri} /></article>
        <article><div className="result-heading"><h3>CSS</h3><CopyButton value={result.cssSnippet} locale={locale} /></div><textarea aria-label="CSS background-image" className="output" rows={4} readOnly value={result.cssSnippet} /></article>
      </div> : <p className="muted-text">{t(locale, "Выберите файл и создайте два результата.", "Choose a file and create the two outputs.")}</p>}
    </section>
  </div>;
}
