import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_FILE = 25 * 1024 * 1024;
const MAX_BODY = MAX_FILE + 65536;
const MAX_PIXELS = 40_000_000;
let activeConversions = 0;

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length")) > MAX_BODY) return error("Image upload is too large.", 413);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) return error("Expected an image upload.", 400);
  if (activeConversions >= 2) return NextResponse.json({ error: "Image converter is busy. Try again shortly." }, { status: 429, headers: { "retry-after": "10", "cache-control": "no-store" } });
  activeConversions++;
  try {
    const reader = request.body?.getReader();
    if (!reader) return error("Missing image upload.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    let expired = false;
    const timer = setTimeout(() => { expired = true; void reader.cancel(); }, 10000);
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_BODY) return error("Image upload is too large.", 413);
        chunks.push(chunk.value);
      }
    } finally { clearTimeout(timer); await reader.cancel(); }
    if (expired) return error("Image upload timed out.", 408);
    const body = Buffer.concat(chunks);
    const form = await new Response(body, { headers: { "content-type": request.headers.get("content-type")! } }).formData();
    const file = form.get("file");
    const format = form.get("format") ?? "image/avif";
    const quality = Number(form.get("quality") ?? 0.7);
    if (!(file instanceof Blob) || file.size === 0) return error("Missing image file.", 400);
    if (file.size > MAX_FILE) return error("Image file is too large.", 413);
    if (!["image/avif", "image/webp", "image/jpeg", "image/png"].includes(String(format)) || !Number.isFinite(quality) || quality < 0.1 || quality > 1) return error("Invalid image conversion settings.", 400);
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "warning" }).rotate().timeout({ seconds: 10 });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1 || !["png", "jpeg", "webp", "heif", "avif"].includes(metadata.format ?? "")) return error("Unsupported image input.", 422);
    const qualityInt = Math.round(quality * 100);
    if (format === "image/avif") image.avif({ quality: qualityInt, effort: 4 });
    else if (format === "image/webp") image.webp({ quality: qualityInt, effort: 4 });
    else if (format === "image/jpeg") image.jpeg({ quality: qualityInt, mozjpeg: true });
    else image.png({ compressionLevel: 9 });
    const { data, info } = await image.toBuffer({ resolveWithObject: true });
    return new Response(new Uint8Array(data), { headers: {
      "content-type": String(format), "content-length": String(data.length),
      "x-original-size": String(file.size), "x-output-size": String(data.length),
      "x-width": String(info.width), "x-height": String(info.height), "cache-control": "no-store",
    }});
  } catch { return error("Image conversion failed. Check the image and try again.", 422); }
  finally { activeConversions--; }
}
