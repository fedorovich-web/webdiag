import { describe, expect, it } from "vitest";
import {
  imageBytesToDataUri,
  inferRasterMediaType,
  placeholderDimensions,
  validateDataUriSourceSize,
} from "./image-data-uri-workbench";

describe("image Data URI workbench helpers", () => {
  it("infers bounded raster media types from byte signatures", () => {
    expect(inferRasterMediaType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(inferRasterMediaType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(inferRasterMediaType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(inferRasterMediaType(new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]))).toBe("image/avif");
    expect(() => inferRasterMediaType(new Uint8Array([1, 2, 3, 4]))).toThrow("unsupported image signature");
  });

  it("encodes the exact bytes under the inferred media type", () => {
    expect(imageBytesToDataUri(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "data:image/jpeg;base64,/9j/4A==",
    );
  });

  it("preserves aspect ratio inside the 24-pixel placeholder bound", () => {
    expect(placeholderDimensions(1200, 600)).toEqual({ width: 24, height: 12 });
    expect(placeholderDimensions(400, 800)).toEqual({ width: 12, height: 24 });
    expect(placeholderDimensions(12, 8)).toEqual({ width: 12, height: 8 });
  });

  it("rejects empty and larger-than-1-MiB source files", () => {
    expect(validateDataUriSourceSize(1_048_576)).toBe(1_048_576);
    expect(() => validateDataUriSourceSize(0)).toThrow("empty");
    expect(() => validateDataUriSourceSize(1_048_577)).toThrow("1 MiB");
  });
});
