import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const targetFormat = ((formData.get("format") as string) || "image/avif").toLowerCase();
    const qualityParam = Number(formData.get("quality")) || 0.7;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image file in request" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const qualityInt = Math.min(100, Math.max(10, Math.round(qualityParam * 100)));

    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    let outputBuffer: Buffer;
    let outputMime = targetFormat;

    switch (targetFormat) {
      case "image/avif":
        outputBuffer = await sharp(inputBuffer).avif({ quality: qualityInt, effort: 4 }).toBuffer();
        outputMime = "image/avif";
        break;
      case "image/webp":
        outputBuffer = await sharp(inputBuffer).webp({ quality: qualityInt, effort: 4 }).toBuffer();
        outputMime = "image/webp";
        break;
      case "image/jpeg":
      case "image/jpg":
        outputBuffer = await sharp(inputBuffer).jpeg({ quality: qualityInt, mozjpeg: true }).toBuffer();
        outputMime = "image/jpeg";
        break;
      case "image/png":
        outputBuffer = await sharp(inputBuffer).png({ compressionLevel: 9 }).toBuffer();
        outputMime = "image/png";
        break;
      default:
        return NextResponse.json({ error: `Unsupported target format: ${targetFormat}` }, { status: 400 });
    }

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": outputMime,
        "Content-Length": String(outputBuffer.length),
        "X-Original-Size": String(file.size),
        "X-Output-Size": String(outputBuffer.length),
        "X-Width": String(metadata.width || 0),
        "X-Height": String(metadata.height || 0),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Image conversion failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
