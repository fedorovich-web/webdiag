
import { describe, expect, it } from "vitest";
import {
  buildClipPath,
  buildCssFilter,
  buildCssGrid,
  buildFlexbox,
} from "./css-layout-effects-tools";

describe("CSS layout and effects tools", () => {
  it("builds bounded clip-path declarations", () => {
    expect(buildClipPath("polygon", [0, 0, 100, 0, 100, 100, 0, 100])).toBe(
      "clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);",
    );
    expect(buildClipPath("circle", [45, 50, 50])).toBe("clip-path: circle(45% at 50% 50%);");
    expect(() => buildClipPath("inset", [0, 10, 20, 120])).toThrow(/between 0 and 100/u);
  });

  it("builds bounded CSS filter declarations", () => {
    expect(buildCssFilter(4, 110, 95, 10, 140, -12)).toBe(
      "filter: blur(4px) brightness(110%) contrast(95%) grayscale(10%) saturate(140%) hue-rotate(-12deg);",
    );
    expect(() => buildCssFilter(41, 100, 100, 0, 100, 0)).toThrow(/Blur/u);
  });

  it("builds bounded CSS grid declarations", () => {
    expect(buildCssGrid({ columns: 3, rows: 2, gap: 16, minColumnPx: 180 })).toContain(
      "grid-template-columns: repeat(3, minmax(180px, 1fr));",
    );
    expect(() => buildCssGrid({ columns: 13, rows: 2, gap: 16, minColumnPx: 180 })).toThrow(/Columns/u);
  });

  it("builds bounded flexbox declarations", () => {
    expect(buildFlexbox({ direction: "row", justify: "space-between", align: "center", gap: 12, wrap: true })).toContain(
      "flex-wrap: wrap;",
    );
    expect(() => buildFlexbox({ direction: "row", justify: "center", align: "center", gap: 80, wrap: false })).toThrow(/Gap/u);
  });
});
