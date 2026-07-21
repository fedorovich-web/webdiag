import { describe, expect, it } from "vitest";
import {
  RASTER_INPUT_MIME_TYPES,
  RASTER_OUTPUT_FORMAT_OPTIONS,
  compressionDelta,
  formatBytes,
  formatMimeLabel,
  imageAcceptAttribute,
  isAcceptedRasterFilename,
  isAcceptedRasterInputType,
} from "./image-tools";

describe("browser-local image utility helpers", () => {
  it("advertises modern raster input and output formats without server upload assumptions", () => {
    expect(RASTER_INPUT_MIME_TYPES).toEqual(["image/png", "image/jpeg", "image/webp", "image/avif"]);
    expect(imageAcceptAttribute()).toBe("image/png,image/jpeg,image/webp,image/avif");
    expect(RASTER_OUTPUT_FORMAT_OPTIONS.map((option) => option.value)).toEqual([
      "image/avif",
      "image/webp",
      "image/jpeg",
      "image/png",
    ]);
  });

  it("accepts PNG, JPEG, WebP and AVIF raster sources but rejects non-raster utility inputs", () => {
    expect(isAcceptedRasterInputType("image/avif")).toBe(true);
    expect(isAcceptedRasterInputType("image/webp")).toBe(true);
    expect(isAcceptedRasterFilename("hero.avif")).toBe(true);
    expect(isAcceptedRasterFilename("photo.JPG")).toBe(true);
    expect(isAcceptedRasterInputType("image/svg+xml")).toBe(false);
    expect(isAcceptedRasterFilename("vector.svg")).toBe(false);
  });

  it("formats image labels, sizes and compression deltas", () => {
    expect(formatMimeLabel("image/avif")).toBe("AVIF");
    expect(formatBytes(1536, "en")).toBe("1.5 KB");
    expect(formatBytes(1536, "ru")).toBe("1,5 KB");
    expect(compressionDelta(1_000_000, 400_000)).toEqual({ bytes: 600_000, percent: 0.6 });
    expect(() => compressionDelta(0, 100)).toThrow();
  });
});
