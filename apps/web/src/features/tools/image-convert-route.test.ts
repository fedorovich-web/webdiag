import { NextRequest } from "next/server";
import sharp from "sharp";
import { expect, it } from "vitest";
import { POST } from "../../../app/api/tools/image-convert/route";

function request(data: Uint8Array, format = "image/avif") {
  const form = new FormData();
  form.set("file", new Blob([data as BlobPart], { type: "image/png" }), "test.png");
  form.set("format", format); form.set("quality", "0.7");
  return new NextRequest("http://localhost/api/tools/image-convert", { method: "POST", body: form });
}

it("bounds image upload size before parsing multipart data", async () => {
  const response = await POST(new NextRequest("http://localhost/api/tools/image-convert", {
    method: "POST", headers: { "content-length": String(26 * 1024 * 1024) }, body: "too large",
  }));
  expect(response.status).toBe(413);
});

it("returns a controlled client error for invalid image data", async () => {
  const response = await POST(request(new TextEncoder().encode("not an image")));
  expect(response.status).toBe(422);
  expect(await response.text()).not.toContain("details");
});

it("applies orientation and reports actual encoded dimensions", async () => {
  const source = await sharp({ create: { width: 2, height: 3, channels: 3, background: "red" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const response = await POST(request(source, "image/png"));
  expect(response.status).toBe(200);
  const encoded = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  expect(encoded.width).toBe(3); expect(encoded.height).toBe(2);
  expect(response.headers.get("x-width")).toBe("3"); expect(response.headers.get("x-height")).toBe("2");
});
