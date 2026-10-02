import { describe, expect, it } from "vitest";
import { extractSampledPalette, normalizePaletteSize } from "./image-palette-extractor";

describe("sampled image palette extraction", () => {
  it("quantizes, orders, and reports deterministic sample shares", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      250, 4, 2, 255,
      0, 0, 255, 255,
      0, 255, 0, 0,
    ]);
    expect(extractSampledPalette(pixels, 4)).toEqual([
      { hex: "#F80000", rgb: "rgb(248, 0, 0)", count: 2, percentage: 66.7 },
      { hex: "#0000F8", rgb: "rgb(0, 0, 248)", count: 1, percentage: 33.3 },
    ]);
  });

  it("composites partial alpha onto white before quantization", () => {
    expect(extractSampledPalette(new Uint8ClampedArray([0, 0, 0, 128]), 4)).toEqual([
      { hex: "#787878", rgb: "rgb(120, 120, 120)", count: 1, percentage: 100 },
    ]);
  });

  it("uses HEX as the stable tie breaker and rejects transparent samples", () => {
    expect(extractSampledPalette(new Uint8ClampedArray([
      255, 255, 255, 255,
      0, 0, 0, 255,
    ]), 8).map((color) => color.hex)).toEqual(["#000000", "#F8F8F8"]);
    expect(() => extractSampledPalette(new Uint8ClampedArray([0, 0, 0, 0]), 4)).toThrow("no visible pixels");
  });

  it("bounds palette size to four through eight colors", () => {
    expect(normalizePaletteSize(4)).toBe(4);
    expect(normalizePaletteSize(8)).toBe(8);
    expect(() => normalizePaletteSize(3)).toThrow("between 4 and 8");
    expect(() => normalizePaletteSize(9)).toThrow("between 4 and 8");
  });
});
