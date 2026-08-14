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

  it("keeps duplicate legacy definitions explicitly superseded by ready aggregates", () => {
    const expected = new Map([
      ["lighthouse-audit", "core-web-vitals-checker"],
      ["accessibility-quick-audit", "core-web-vitals-checker"],
      ["twitter-card-preview", "open-graph-preview"],
      ["csv-validator", "csv-json-converter"],
      ["cron-parser", "cron-expression-workbench"],
      ["url-parser", "url-normalization-analyzer"],
      ["qr-code-decoder", "qr-code-generator"],
      ["image-metadata-remover", "image-metadata-viewer"],
      ["image-placeholder-generator", "image-data-uri-converter"],
    ]);

    for (const [slug, supersededBy] of expected) {
      const tool = tools.find((item) => item.slug === slug);
      const replacement = tools.find((item) => item.slug === supersededBy);
      expect(tool?.state).toBe("internal");
      expect(tool?.supersededBy).toBe(supersededBy);
      expect(replacement?.state).toBe("ready");
    }
  });

  it("publishes the three bounded project crawler views without whole-site claims", () => {
    const crawlerTools = [
      "whole-site-audit",
      "duplicate-meta-checker",
      "orphan-page-finder",
    ].map((slug) => tools.find((tool) => tool.slug === slug));

    for (const tool of crawlerTools) {
      expect(tool).toMatchObject({
        executorClass: "crawler",
        riskTier: "R3",
        access: "required",
        state: "ready",
      });
      expect(tool?.description?.ru).toContain("25");
      expect(tool?.description?.en).toContain("25");
    }

    expect(crawlerTools[0]?.title.en).toBe("Bounded Site Audit");
    expect(crawlerTools[2]?.title.en).toBe("Unlinked Page Candidates");
  });

  it("publishes bounded PageSpeed network evidence and supersedes the viewport microtool", () => {
    for (const slug of ["resource-waterfall-analyzer", "render-blocking-resources-checker"]) {
      const tool = tools.find((candidate) => candidate.slug === slug);
      expect(tool).toMatchObject({ executorClass: "chromium", state: "ready" });
      expect(tool?.description?.en).toContain("PageSpeed");
    }
    expect(tools.find((tool) => tool.slug === "mobile-viewport-checker")).toMatchObject({
      state: "internal",
      supersededBy: "html-validator",
    });
  });
});
