import { describe, expect, it } from "vitest";
import {
  calculateSelectorSpecificity,
  convertHexColor,
  generateTypographyScale,
  normalizeHexColor,
} from "./css-design-analysis-tools";

describe("css design analysis tools", () => {
  it("normalizes short and long HEX colors", () => {
    expect(normalizeHexColor("#0f8")).toBe("#00FF88");
    expect(normalizeHexColor("336699")).toBe("#336699");
  });

  it("converts HEX colors to RGB and HSL CSS values", () => {
    const converted = convertHexColor("#336699");

    expect(converted.rgb).toEqual([51, 102, 153]);
    expect(converted.rgbCss).toBe("rgb(51 102 153)");
    expect(converted.hslCss).toBe("hsl(210 50% 40%)");
  });

  it("rejects unsupported color formats", () => {
    expect(() => convertHexColor("rgb(0 0 0)")).toThrow(/HEX/);
  });

  it("calculates bounded selector specificity", () => {
    expect(calculateSelectorSpecificity("#app .card:hover > h2::before")[0]).toMatchObject({
      ids: 1,
      classes: 2,
      types: 2,
      score: "1-2-2",
    });
  });

  it("handles :where as zero and :is/:not/:has by strongest argument", () => {
    expect(calculateSelectorSpecificity(":where(#app) .button")[0]?.score).toBe("0-1-0");
    expect(calculateSelectorSpecificity("section:is(#main, .featured) a")[0]?.score).toBe("1-0-2");
  });

  it("generates a bounded typography scale", () => {
    const scale = generateTypographyScale(16, 1.25, -1, 2);

    expect(scale).toHaveLength(4);
    expect(scale.at(-1)).toMatchObject({ step: 2, px: 25, rem: 1.5625 });
    expect(scale.at(-1)?.cssVar).toBe("--font-size-2: 25px;");
  });

  it("rejects unsafe typography scale inputs", () => {
    expect(() => generateTypographyScale(2, 1.25, 0, 2)).toThrow(/Base/);
    expect(() => generateTypographyScale(16, 3, 0, 2)).toThrow(/Ratio/);
    expect(() => generateTypographyScale(16, 1.25, -20, 20)).toThrow(/Steps/);
  });
});
