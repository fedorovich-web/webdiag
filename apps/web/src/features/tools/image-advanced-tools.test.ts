import { describe, expect, it } from "vitest";
import {
  FAVICON_ASSETS,
  faviconCropRectangle,
  faviconHtmlSnippet,
  faviconManifestSnippet,
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
  it("centers a square crop for every source orientation", () => {
    expect(faviconCropRectangle(1200, 800)).toEqual({ x: 200, y: 0, size: 800 });
    expect(faviconCropRectangle(600, 1000)).toEqual({ x: 0, y: 200, size: 600 });
    expect(faviconCropRectangle(512, 512)).toEqual({ x: 0, y: 0, size: 512 });
  });

  it("defines the exact downloadable PNG asset set", () => {
    expect(FAVICON_ASSETS).toEqual([
      { filename: "favicon-32x32.png", size: 32, purpose: "favicon" },
      { filename: "favicon-48x48.png", size: 48, purpose: "favicon" },
      { filename: "apple-touch-icon.png", size: 180, purpose: "apple-touch-icon" },
      { filename: "web-app-icon-192.png", size: 192, purpose: "web-app-icon" },
      { filename: "web-app-icon-512.png", size: 512, purpose: "web-app-icon" },
    ]);
  });

  it("emits only references to the generated filenames", () => {
    expect(faviconHtmlSnippet()).toBe([
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
      '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
      '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    ].join("\n"));
    expect(JSON.parse(faviconManifestSnippet())).toEqual({
      icons: [
        { src: "/web-app-icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/web-app-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  });

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
