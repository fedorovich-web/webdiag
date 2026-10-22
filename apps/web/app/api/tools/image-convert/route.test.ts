import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import sharp from "sharp";

describe("/api/tools/image-convert", () => {
  it("converts a sample image to genuine AVIF", async () => {
    const pngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 50, g: 120, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
    formData.append("file", blob, "test.png");
    formData.append("format", "image/avif");
    formData.append("quality", "0.65");

    const request = new NextRequest("http://localhost:3000/api/tools/image-convert", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/avif");

    const avifBuffer = await response.arrayBuffer();
    expect(avifBuffer.byteLength).toBeGreaterThan(0);
    const avifMetadata = await sharp(Buffer.from(avifBuffer)).metadata();
    expect(avifMetadata.format).toBe("heif");
    expect(avifMetadata.width).toBe(100);
    expect(avifMetadata.height).toBe(100);
  });
});
