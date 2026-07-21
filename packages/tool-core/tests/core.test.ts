import { describe, expect, it } from "vitest";
import {
  calculateHeight,
  contrastRatio,
  decodeBase64,
  decodeUrlComponent,
  encodeBase64,
  encodeUrlComponent,
  formatJson,
  generateUlid,
  generateUuid,
  hashText,
  isoToUnixSeconds,
  pxToRem,
  reduceAspectRatio,
  remToPx,
  unixSecondsToIso,
  normalizeCropRectangle,
  normalizeImageQuality,
  outputExtension,
  resizeToHeight,
  resizeToWidth,
  validateImageDimensions,
} from "../src";

describe("browser tool core", () => {
  it("generates UUID v4 values", () => {
    expect(generateUuid()).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
  });

  it("generates valid ULID-shaped values", () => {
    expect(generateUlid(0)).toMatch(/^0000000000[0-9A-HJKMNP-TV-Z]{16}$/);
  });

  it("converts Unix time and ISO values", () => {
    expect(unixSecondsToIso(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(isoToUnixSeconds("1970-01-01T00:00:00.000Z")).toBe(0);
  });

  it("encodes and decodes URL components", () => {
    const encoded = encodeUrlComponent("путь и ?query");
    expect(decodeUrlComponent(encoded)).toBe("путь и ?query");
  });

  it("encodes and decodes UTF-8 Base64", () => {
    const encoded = encodeBase64("WebDiag — тест");
    expect(decodeBase64(encoded)).toBe("WebDiag — тест");
  });

  it("formats JSON", () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it("calculates SHA-256", async () => {
    await expect(hashText("abc", "SHA-256")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("converts pixels and rem", () => {
    expect(pxToRem(24, 16)).toBe(1.5);
    expect(remToPx(1.5, 16)).toBe(24);
  });

  it("calculates contrast", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
  });

  it("reduces and applies image ratios", () => {
    expect(reduceAspectRatio(1920, 1080)).toEqual([16, 9]);
    expect(calculateHeight(1280, 16, 9)).toBe(720);
  });

  it("validates and calculates image resize dimensions", () => {
    expect(validateImageDimensions(1920, 1080)).toEqual({ width: 1920, height: 1080 });
    expect(resizeToWidth(1920, 1080, 1280)).toEqual({ width: 1280, height: 720 });
    expect(resizeToHeight(1920, 1080, 720)).toEqual({ width: 1280, height: 720 });
    expect(() => validateImageDimensions(0, 100)).toThrow();
  });

  it("normalizes image quality and crop rectangles", () => {
    expect(normalizeImageQuality(0)).toBe(0.01);
    expect(normalizeImageQuality(2)).toBe(1);
    expect(normalizeCropRectangle(100, 80, { x: 90, y: 70, width: 50, height: 50 }))
      .toEqual({ x: 90, y: 70, width: 10, height: 10 });
  });

  it("maps raster formats to file extensions", () => {
    expect(outputExtension("image/png")).toBe("png");
    expect(outputExtension("image/jpeg")).toBe("jpg");
    expect(outputExtension("image/webp")).toBe("webp");
    expect(outputExtension("image/avif")).toBe("avif");
  });
});
