"use client";

import { toolErrorMessage } from "./tool-error-presentation";

import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { formatBytes, imageAcceptAttribute, isAcceptedRasterFilename, isAcceptedRasterInputType } from "./image-tools";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const SAMPLE_MAX_SIDE = 160;

export interface SampledPaletteColor {
  hex: string;
  rgb: string;
  count: number;
  percentage: number;
}

interface LoadedPaletteImage {
  file: File;
  bitmap: ImageBitmap;
}

export function normalizePaletteSize(value: number): number {
  if (!Number.isInteger(value) || value < 4 || value > 8) {
    throw new RangeError("Palette size must be between 4 and 8 colors.");
  }
  return value;
}

function quantizeChannel(value: number): number {
  return Math.min(248, Math.max(0, Math.round(value) & 0xf8));
}

function hexChannel(value: number): string {
  return value.toString(16).padStart(2, "0").toUpperCase();
}

export function extractSampledPalette(
  pixels: Uint8ClampedArray,
  requestedSize: number,
): SampledPaletteColor[] {
  const size = normalizePaletteSize(requestedSize);
  if (pixels.length === 0 || pixels.length % 4 !== 0) {
    throw new RangeError("Pixel data must contain complete RGBA values.");
  }
  const buckets = new Map<string, { red: number; green: number; blue: number; count: number }>();
  let visiblePixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const alphaByte = pixels[index + 3] ?? 0;
    if (alphaByte === 0) continue;
    const alpha = alphaByte / 255;
    const red = quantizeChannel((pixels[index] ?? 0) * alpha + 255 * (1 - alpha));
    const green = quantizeChannel((pixels[index + 1] ?? 0) * alpha + 255 * (1 - alpha));
    const blue = quantizeChannel((pixels[index + 2] ?? 0) * alpha + 255 * (1 - alpha));
    const hex = `#${hexChannel(red)}${hexChannel(green)}${hexChannel(blue)}`;
    const current = buckets.get(hex);
    buckets.set(hex, { red, green, blue, count: (current?.count ?? 0) + 1 });
    visiblePixels += 1;
  }
  if (visiblePixels === 0) throw new RangeError("The sample contains no visible pixels.");
  return [...buckets.entries()]
    .sort(([leftHex, left], [rightHex, right]) => right.count - left.count || leftHex.localeCompare(rightHex))
    .slice(0, size)
    .map(([hex, color]) => ({
      hex,
      rgb: `rgb(${color.red}, ${color.green}, ${color.blue})`,
      count: color.count,
      percentage: Math.round((color.count / visiblePixels) * 1_000) / 10,
    }));
}

function t(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

async function loadImage(file: File): Promise<LoadedPaletteImage> {
  if (file.size > MAX_FILE_BYTES) throw new RangeError("Image file is too large for browser-local processing.");
  if (!isAcceptedRasterInputType(file.type) && !isAcceptedRasterFilename(file.name)) {
    throw new TypeError("Unsupported image format. Use PNG, JPEG, WebP, or AVIF if your browser supports it.");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  if (bitmap.width < 1 || bitmap.height < 1 || bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new RangeError("Image dimensions are too large for browser processing.");
  }
  return { file, bitmap };
}

export function ImagePaletteExtractorTool({ locale }: { locale: Locale }) {
  const [image, setImage] = useState<LoadedPaletteImage | null>(null);
  const [paletteSize, setPaletteSize] = useState(6);
  const [palette, setPalette] = useState<SampledPaletteColor[]>([]);
  const [samplePixels, setSamplePixels] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => image?.bitmap.close(), [image]);

  async function load(file: File | undefined) {
    setError("");
    setPalette([]);
    setSamplePixels(0);
    if (!file) return setImage(null);
    try {
      setImage(await loadImage(file));
    } catch (caught) {
      setImage(null);
      setError(toolErrorMessage(locale, caught, "image_open_failed"));
    }
  }

  function extract() {
    if (!image) return setError(t(locale, "Выберите изображение.", "Choose an image."));
    try {
      const scale = Math.min(1, SAMPLE_MAX_SIDE / Math.max(image.bitmap.width, image.bitmap.height));
      const width = Math.max(1, Math.round(image.bitmap.width * scale));
      const height = Math.max(1, Math.round(image.bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
      if (!context) throw new Error("Canvas 2D is not available in this browser.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image.bitmap, 0, 0, width, height);
      setPalette(extractSampledPalette(context.getImageData(0, 0, width, height).data, paletteSize));
      setSamplePixels(width * height);
      setError("");
    } catch (caught) {
      setPalette([]);
      setSamplePixels(0);
      setError(toolErrorMessage(locale, caught, "image_process_failed"));
    }
  }

  return <div className="tool-grid image-palette-tool">
    <section className="tool-panel">
      <h2>{t(locale, "Изображение и выборка", "Image and sample")}</h2>
      <label className="field"><span>{t(locale, "JPEG, PNG, WebP или AVIF", "JPEG, PNG, WebP, or AVIF")}</span><input type="file" accept={imageAcceptAttribute()} onChange={(event) => void load(event.target.files?.[0])} /></label>
      {image && <dl className="result-meta"><div><dt>{t(locale, "Исходный размер", "Source dimensions")}</dt><dd>{image.bitmap.width} × {image.bitmap.height}</dd></div><div><dt>{t(locale, "Размер файла", "File size")}</dt><dd>{formatBytes(image.file.size, locale)}</dd></div></dl>}
      <label className="field"><span>{t(locale, "Цветов в палитре", "Palette colors")}</span><select value={paletteSize} onChange={(event) => setPaletteSize(normalizePaletteSize(Number(event.target.value)))}>{[4, 5, 6, 7, 8].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button className="button" type="button" onClick={extract} disabled={!image}>{t(locale, "Извлечь палитру выборки", "Extract sampled palette")}</button>
      <small>{t(locale, "Обработка локальная. Палитра строится по уменьшенной выборке до 160 px по длинной стороне; это не точный список всех цветов.", "Processing is local. The palette uses a downsampled image up to 160 px on its longest side; it is not an exact inventory of every color.")}</small>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
    <section className="tool-panel" aria-live="polite">
      <h2>{t(locale, "Палитра выборки", "Sampled palette")}</h2>
      {palette.length ? <><div className="palette-grid">{palette.map((color) => <article className="palette-swatch" key={color.hex}>
        <div className="palette-color" style={{ backgroundColor: color.hex }} aria-hidden="true" />
        <div><code>{color.hex}</code><span>{color.rgb}</span><small>{color.percentage}% {t(locale, "выборки", "of sample")}</small></div>
        <CopyButton value={color.hex} locale={locale} />
      </article>)}</div><small>{samplePixels.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} {t(locale, "пикселей в уменьшенной выборке.", "pixels in the downsampled sample.")}</small></> : <p className="muted-text">{t(locale, "Выберите файл и запустите извлечение.", "Choose a file and run extraction.")}</p>}
    </section>
  </div>;
}
