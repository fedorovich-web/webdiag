const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type HashAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";

export function generateUuid(): string {
  return crypto.randomUUID();
}

function encodeBase32(value: bigint, length: number): string {
  let output = "";
  let current = value;
  for (let index = 0; index < length; index += 1) {
    output = CROCKFORD[Number(current & 31n)] + output;
    current >>= 5n;
  }
  return output;
}

export function generateUlid(now = Date.now()): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > 281_474_976_710_655) {
    throw new RangeError("Timestamp is outside the ULID 48-bit range.");
  }
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);
  let randomValue = 0n;
  for (const byte of random) randomValue = (randomValue << 8n) | BigInt(byte);
  return encodeBase32(BigInt(now), 10) + encodeBase32(randomValue, 16);
}

export function unixSecondsToIso(value: number): string {
  if (!Number.isFinite(value)) throw new TypeError("Unix timestamp must be a finite number.");
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) throw new RangeError("Unix timestamp is outside the supported date range.");
  return date.toISOString();
}

export function isoToUnixSeconds(value: string): number {
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) throw new TypeError("Date must be a valid ISO 8601 value.");
  return Math.floor(milliseconds / 1000);
}

export function encodeUrlComponent(value: string): string {
  return encodeURIComponent(value);
}

export function decodeUrlComponent(value: string): string {
  return decodeURIComponent(value);
}

export function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s+/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function hashText(value: string, algorithm: HashAlgorithm): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function formatJson(value: string, spaces = 2): string {
  const parsed: unknown = JSON.parse(value);
  return JSON.stringify(parsed, null, spaces);
}

export function pxToRem(pixels: number, rootPixels: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(rootPixels) || rootPixels <= 0) {
    throw new TypeError("Pixel values must be finite and the root size must be greater than zero.");
  }
  return pixels / rootPixels;
}

export function remToPx(rem: number, rootPixels: number): number {
  if (!Number.isFinite(rem) || !Number.isFinite(rootPixels) || rootPixels <= 0) {
    throw new TypeError("rem values must be finite and the root size must be greater than zero.");
  }
  return rem * rootPixels;
}

function normalizeHex(value: string): string {
  const match = value.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (!match?.[1]) throw new TypeError("Color must be a 3- or 6-digit HEX value.");
  const short = match[1];
  return short.length === 3
    ? short.split("").map((character) => character + character).join("")
    : short;
}

function luminance(hex: string): number {
  const normalized = normalizeHex(hex);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function greatestCommonDivisor(first: number, second: number): number {
  let a = Math.abs(Math.trunc(first));
  let b = Math.abs(Math.trunc(second));
  if (a === 0 && b === 0) throw new TypeError("At least one dimension must be greater than zero.");
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

export function reduceAspectRatio(width: number, height: number): readonly [number, number] {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new TypeError("Width and height must be positive integers.");
  }
  const divisor = greatestCommonDivisor(width, height);
  return [width / divisor, height / divisor] as const;
}

export function calculateHeight(width: number, ratioWidth: number, ratioHeight: number): number {
  if ([width, ratioWidth, ratioHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new TypeError("Dimensions and ratio values must be greater than zero.");
  }
  return (width * ratioHeight) / ratioWidth;
}

export function calculateWidth(height: number, ratioWidth: number, ratioHeight: number): number {
  if ([height, ratioWidth, ratioHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new TypeError("Dimensions and ratio values must be greater than zero.");
  }
  return (height * ratioWidth) / ratioHeight;
}

export type RasterOutputFormat = "image/png" | "image/jpeg" | "image/webp";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropRectangle extends ImageDimensions {
  x: number;
  y: number;
}

export function validateImageDimensions(width: number, height: number): ImageDimensions {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new TypeError("Image width and height must be positive integers.");
  }
  return { width, height };
}

export function resizeToWidth(sourceWidth: number, sourceHeight: number, targetWidth: number): ImageDimensions {
  validateImageDimensions(sourceWidth, sourceHeight);
  if (!Number.isSafeInteger(targetWidth) || targetWidth <= 0) {
    throw new TypeError("Target width must be a positive integer.");
  }
  return { width: targetWidth, height: Math.max(1, Math.round((targetWidth * sourceHeight) / sourceWidth)) };
}

export function resizeToHeight(sourceWidth: number, sourceHeight: number, targetHeight: number): ImageDimensions {
  validateImageDimensions(sourceWidth, sourceHeight);
  if (!Number.isSafeInteger(targetHeight) || targetHeight <= 0) {
    throw new TypeError("Target height must be a positive integer.");
  }
  return { width: Math.max(1, Math.round((targetHeight * sourceWidth) / sourceHeight)), height: targetHeight };
}

export function normalizeImageQuality(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError("Image quality must be a finite number.");
  return Math.min(1, Math.max(0.01, value));
}

export function normalizeCropRectangle(
  sourceWidth: number,
  sourceHeight: number,
  rectangle: CropRectangle,
): CropRectangle {
  validateImageDimensions(sourceWidth, sourceHeight);
  const values = [rectangle.x, rectangle.y, rectangle.width, rectangle.height];
  if (values.some((value) => !Number.isSafeInteger(value))) {
    throw new TypeError("Crop values must be integers.");
  }
  const x = Math.min(Math.max(0, rectangle.x), sourceWidth - 1);
  const y = Math.min(Math.max(0, rectangle.y), sourceHeight - 1);
  const width = Math.min(Math.max(1, rectangle.width), sourceWidth - x);
  const height = Math.min(Math.max(1, rectangle.height), sourceHeight - y);
  return { x, y, width, height };
}

export function outputExtension(format: RasterOutputFormat): "png" | "jpg" | "webp" {
  if (format === "image/png") return "png";
  if (format === "image/jpeg") return "jpg";
  return "webp";
}
