import { describe, expect, it } from "vitest";
import { publicTools, tools } from "../src";

describe("tool registry", () => {
  it("contains exactly 125 unique definitions", () => {
    expect(tools).toHaveLength(125);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(125);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(125);
  });

  it("exposes only definitions backed by an implemented tool", () => {
    expect(publicTools).toEqual(tools.filter((tool) => tool.state === "ready"));
    expect(publicTools.every((tool) => tool.description?.ru && tool.description.en)).toBe(true);
  });

  it("publishes the bounded browser-local favicon generator", () => {
    const tool = tools.find((item) => item.slug === "favicon-generator");
    expect(tool?.state).toBe("ready");
    expect(tool?.description?.ru).toContain("PNG");
    expect(tool?.description?.en).toContain("PNG");
  });

  it("publishes the browser-only responsive srcset generator", () => {
    const tool = tools.find((item) => item.slug === "responsive-image-srcset-generator");
    expect(tool?.state).toBe("ready");
    expect(tool?.description?.en).toContain("does not create");
  });

  it("publishes the deterministic browser-local image palette extractor", () => {
    const tool = tools.find((item) => item.slug === "color-palette-extractor");
    expect(tool?.state).toBe("ready");
    expect(tool?.description?.ru).toContain("выборки");
    expect(tool?.description?.en).toContain("sampled");
  });

  it("publishes one bounded image Data URI workbench", () => {
    const tool = tools.find((item) => item.slug === "image-data-uri-converter");
    expect(tool?.state).toBe("ready");
    expect(tool?.description?.en).toContain("1 MiB");
    expect(tools.find((item) => item.slug === "image-placeholder-generator")?.state).toBe("internal");
  });

  it("publishes one bounded QR code workbench", () => {
    const tool = tools.find((item) => item.slug === "qr-code-generator");
    expect(tool?.state).toBe("ready");
    expect(tool?.description?.en).toContain("reads");
    expect(tools.find((item) => item.slug === "qr-code-decoder")?.state).toBe("internal");
  });
});
