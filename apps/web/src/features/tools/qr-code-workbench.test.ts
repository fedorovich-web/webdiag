import { describe, expect, it } from "vitest";
import encodeQR from "qr";
import decodeQR from "qr/decode.js";
import {
  qrMatrixToImage,
  validateQrImageGeometry,
  validateQrText,
} from "./qr-code-workbench";

describe("QR code workbench boundaries", () => {
  it("counts UTF-8 bytes and preserves inert text", () => {
    expect(validateQrText("<script>alert('x')</script>")).toEqual({
      text: "<script>alert('x')</script>",
      byteLength: 27,
    });
    expect(validateQrText("Привет").byteLength).toBe(12);
  });

  it("rejects empty, overlong, and byte-heavy QR text", () => {
    expect(() => validateQrText("   ")).toThrow("empty");
    expect(() => validateQrText("a".repeat(2_001))).toThrow("2,000");
    expect(() => validateQrText("a".repeat(2_954))).toThrow("2,000");
    expect(() => validateQrText("😀".repeat(739))).toThrow("2,953");
  });

  it("bounds decoded raster geometry", () => {
    expect(validateQrImageGeometry(5_000, 5_000)).toEqual({ width: 5_000, height: 5_000 });
    expect(() => validateQrImageGeometry(5_001, 5_000)).toThrow("25 million");
    expect(() => validateQrImageGeometry(0, 200)).toThrow("invalid");
  });

  it("converts the generated matrix into decodable RGBA pixels", () => {
    const matrix = encodeQR("WebDiag QR round trip", "raw", {
      border: 4,
      ecc: "quartile",
      scale: 6,
    });
    expect(decodeQR(qrMatrixToImage(matrix))).toBe("WebDiag QR round trip");
  });
});
