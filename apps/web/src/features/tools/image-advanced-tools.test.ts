import { describe, expect, it } from "vitest";
import {
  isAcceptedSvgFilename,
  metadataAcceptAttribute,
  metadataSignalSummary,
  svgAcceptAttribute,
} from "./image-advanced-tools";

const cleanSignals = {
  format: "jpeg" as const,
  exif: false,
  xmp: false,
  iccProfile: false,
  iptc: false,
  jfif: false,
  pngTextChunks: 0,
  physicalDensity: false,
  detectedSegments: [],
  hasMetadata: false,
};

describe("advanced image utility helpers", () => {
  it("keeps SVG separate from raster image utilities", () => {
    expect(svgAcceptAttribute()).toBe(".svg,image/svg+xml");
    expect(isAcceptedSvgFilename("icon.svg")).toBe(true);
    expect(isAcceptedSvgFilename("photo.avif")).toBe(false);
  });

  it("limits metadata viewer inputs to modern raster formats", () => {
    expect(metadataAcceptAttribute()).toBe("image/jpeg,image/png,image/webp,image/avif");
  });

  it("summarizes clean and detected metadata signals", () => {
    expect(metadataSignalSummary(cleanSignals, "en")).toEqual(["No metadata signals detected."]);
    expect(metadataSignalSummary({ ...cleanSignals, exif: true, detectedSegments: ["EXIF"], hasMetadata: true }, "ru")).toEqual(["EXIF"]);
  });
});
