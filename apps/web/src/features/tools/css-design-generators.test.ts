import { describe, expect, it } from "vitest";
import { buildBorderRadiusCss, buildBoxShadowCss, buildGradientCss, isHexColor } from "./css-design-generators";

describe("css design generators", () => {
  it("builds bounded linear and radial gradients", () => {
    expect(buildGradientCss({ mode: "linear", angle: 135, startColor: "#0f766e", endColor: "#14b8a6", startStop: 0, endStop: 100 })).toBe("linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)");
    expect(buildGradientCss({ mode: "radial", angle: 0, startColor: "#fff", endColor: "#000", startStop: 10, endStop: 90 })).toBe("radial-gradient(circle at center, #fff 10%, #000 90%)");
  });

  it("rejects invalid gradient colors and reversed stops", () => {
    expect(isHexColor("#abc")).toBe(true);
    expect(isHexColor("#abcd")).toBe(false);
    expect(() => buildGradientCss({ mode: "linear", angle: 361, startColor: "#fff", endColor: "#000", startStop: 0, endStop: 100 })).toThrow(/angle/);
    expect(() => buildGradientCss({ mode: "linear", angle: 90, startColor: "red", endColor: "#000", startStop: 0, endStop: 100 })).toThrow(/HEX/);
    expect(() => buildGradientCss({ mode: "linear", angle: 90, startColor: "#fff", endColor: "#000", startStop: 80, endStop: 20 })).toThrow(/Start stop/);
  });

  it("builds box-shadow with rgba output and numeric bounds", () => {
    expect(buildBoxShadowCss({ offsetX: 0, offsetY: 18, blur: 48, spread: 0, color: "#0f172a", opacity: 0.18 })).toBe("0px 18px 48px 0px rgba(15, 23, 42, 0.18)");
    expect(() => buildBoxShadowCss({ offsetX: 0, offsetY: 0, blur: -1, spread: 0, color: "#000", opacity: 0.5 })).toThrow(/blur/);
    expect(() => buildBoxShadowCss({ offsetX: 0, offsetY: 0, blur: 1, spread: 0, color: "#000", opacity: 2 })).toThrow(/opacity/);
  });

  it("builds four-corner border radius declarations", () => {
    expect(buildBorderRadiusCss({ topLeft: 24, topRight: 16, bottomRight: 8, bottomLeft: 0 })).toBe("24px 16px 8px 0px");
    expect(() => buildBorderRadiusCss({ topLeft: 241, topRight: 0, bottomRight: 0, bottomLeft: 0 })).toThrow(/top-left/);
  });
});