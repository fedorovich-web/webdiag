"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import encodeQR, { type Image as QrImage } from "qr";
import decodeQR from "qr/decode.js";
import { CopyButton } from "../../components/copy-button";
import { formatBytes, imageAcceptAttribute, isAcceptedRasterFilename } from "./image-tools";
import { inferRasterMediaType } from "./image-data-uri-workbench";

const MAX_CHARACTERS = 2_000;
const MAX_UTF8_BYTES = 2_953;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 25_000_000;

type Ecc = "low" | "medium" | "quartile" | "high";

export function base64DataUriByteLength(uri: string): number {
  const comma = uri.indexOf(",");
  const payload = uri.slice(comma + 1);
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return payload.length * 3 / 4 - padding;
}

export function validateQrText(value: string): { text: string; byteLength: number } {
  if (!value.trim()) throw new RangeError("QR text is empty.");
  if (value.length > MAX_CHARACTERS) throw new RangeError("QR text must not exceed 2,000 characters.");
  const byteLength = new TextEncoder().encode(value).byteLength;
  if (byteLength > MAX_UTF8_BYTES) throw new RangeError("QR text must not exceed 2,953 UTF-8 bytes.");
  return { text: value, byteLength };
}

export function validateQrImageGeometry(width: number, height: number): { width: number; height: number } {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new RangeError("Image dimensions are invalid.");
  if (width * height > MAX_PIXELS) throw new RangeError("Image must not exceed 25 million pixels.");
  return { width, height };
}

export function qrMatrixToImage(matrix: boolean[][]): QrImage {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  validateQrImageGeometry(width, height);
  if (!matrix.every((row) => row.length === width)) throw new RangeError("QR matrix is invalid.");
  const data = new Uint8ClampedArray(width * height * 4);
  matrix.forEach((row, y) => row.forEach((dark, x) => {
    const offset = (y * width + x) * 4;
    const value = dark ? 0 : 255;
    data[offset] = value; data[offset + 1] = value; data[offset + 2] = value; data[offset + 3] = 255;
  }));
  return { width, height, data };
}

function t(locale: Locale, ru: string, en: string): string { return locale === "ru" ? ru : en; }

function pngDataUri(matrix: boolean[][], size: number): string {
  const modules = matrix.length;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas 2D is unavailable.");
  context.fillStyle = "#fff"; context.fillRect(0, 0, size, size);
  context.fillStyle = "#000";
  matrix.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) context.fillRect(Math.floor(x * size / modules), Math.floor(y * size / modules), Math.ceil((x + 1) * size / modules) - Math.floor(x * size / modules), Math.ceil((y + 1) * size / modules) - Math.floor(y * size / modules));
  }));
  return canvas.toDataURL("image/png");
}

export function QrCodeWorkbenchTool({ locale }: { locale: Locale }) {
  const [text, setText] = useState("");
  const [ecc, setEcc] = useState<Ecc>("medium");
  const [size, setSize] = useState(384);
  const [generated, setGenerated] = useState<{ uri: string; bytes: number; textBytes: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [decoded, setDecoded] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !generated) return;
    const image = new Image();
    image.onload = () => canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = generated.uri;
  }, [generated, size]);

  function generate() {
    try {
      const valid = validateQrText(text);
      const matrix = encodeQR(valid.text, "raw", { border: 4, ecc, scale: 1 });
      const uri = pngDataUri(matrix, size);
      setGenerated({ uri, bytes: base64DataUriByteLength(uri), textBytes: valid.byteLength });
      setError("");
    } catch (caught) { setGenerated(null); setError(caught instanceof Error ? caught.message : "QR generation failed."); }
  }

  async function load(next?: File) {
    setFile(null); setBitmap(null); setDecoded(""); setError("");
    if (!next) return;
    try {
      if (next.size < 1 || next.size > MAX_FILE_BYTES) throw new RangeError(t(locale, "Изображение должно быть от 1 байта до 5 МиБ.", "QR image must be between 1 byte and 5 MiB."));
      if (!isAcceptedRasterFilename(next.name)) throw new TypeError(t(locale, "Используйте JPEG, PNG, WebP или AVIF.", "Use JPEG, PNG, WebP, or AVIF."));
      inferRasterMediaType(new Uint8Array(await next.arrayBuffer()));
      const nextBitmap = await createImageBitmap(next, { imageOrientation: "from-image" });
      try { validateQrImageGeometry(nextBitmap.width, nextBitmap.height); } catch (caught) { nextBitmap.close(); throw caught; }
      setFile(next); setBitmap(nextBitmap);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not open the image."); }
  }

  function read() {
    if (!bitmap) return;
    try {
      const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas 2D is unavailable.");
      context.drawImage(bitmap, 0, 0);
      const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
      setDecoded(decodeQR({ width: image.width, height: image.height, data: image.data })); setError("");
    } catch { setDecoded(""); setError(t(locale, "QR-код не найден или не читается.", "No readable QR code was found.")); }
  }

  return <div className="tool-grid qr-workbench">
    <section className="tool-panel"><h2>{t(locale, "Создать", "Generate")}</h2>
      <label className="field"><span>{t(locale, "Текст для кодирования", "Text to encode")}</span><textarea rows={5} maxLength={MAX_CHARACTERS} value={text} onChange={(event) => setText(event.target.value)} /></label>
      <div className="field-row"><label className="field"><span>{t(locale, "Коррекция ошибок", "Error correction")}</span><select value={ecc} onChange={(event) => setEcc(event.target.value as Ecc)}><option value="low">L · 7%</option><option value="medium">M · 15%</option><option value="quartile">Q · 25%</option><option value="high">H · 30%</option></select></label><label className="field"><span>{t(locale, "PNG, px", "PNG size")}</span><select value={size} onChange={(event) => setSize(Number(event.target.value))}><option>256</option><option>384</option><option>512</option></select></label></div>
      <button className="button" type="button" onClick={generate}>{t(locale, "Создать QR-код", "Generate QR code")}</button>
      {generated && <div className="qr-result"><canvas ref={previewRef} width={size} height={size} role="img" aria-label={t(locale, "Созданный QR-код", "Generated QR code")} /><p className="muted-text">{generated.textBytes} UTF-8 bytes · {formatBytes(generated.bytes, locale)}</p><a className="button button-secondary" href={generated.uri} download="webdiag-qr.png">{t(locale, "Скачать PNG", "Download PNG")}</a></div>}
    </section>
    <section className="tool-panel"><h2>{t(locale, "Прочитать", "Read")}</h2>
      <label className="field"><span>{t(locale, "Изображение QR до 5 МиБ", "QR image up to 5 MiB")}</span><input type="file" accept={imageAcceptAttribute()} onChange={(event) => void load(event.target.files?.[0])} /></label>
      {file && bitmap && <p className="muted-text">{file.name} · {bitmap.width} × {bitmap.height} · {formatBytes(file.size, locale)}</p>}
      <button className="button" type="button" disabled={!bitmap} onClick={read}>{t(locale, "Прочитать QR-код", "Read QR code")}</button>
      {decoded && <><div className="result-heading"><h3>{t(locale, "Декодированный текст", "Decoded text")}</h3><CopyButton value={decoded} locale={locale} /></div><textarea className="output" rows={7} readOnly aria-label={t(locale, "Декодированный текст QR", "Decoded QR text")} value={decoded} /><small>{t(locale, "Содержимое не открывается автоматически. Проверьте его перед использованием.", "Content is never opened automatically. Inspect it before use.")}</small></>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  </div>;
}
