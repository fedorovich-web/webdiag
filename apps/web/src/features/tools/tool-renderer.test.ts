import { describe, expect, it } from "vitest";
import { publicTools } from "@webdiag/tool-registry";
import { SUPPORTED_TOOL_SLUGS } from "./tool-renderer";

describe("tool renderer registry contract", () => {
  it("has one renderer for every ready tool and no unpublished renderer", () => {
    const ready = publicTools.map((tool) => tool.slug).sort();
    const supported = [...SUPPORTED_TOOL_SLUGS].sort();
    expect(supported).toEqual(ready);
  });

  it("renders the favicon generator", () => {
    expect(SUPPORTED_TOOL_SLUGS).toContain("favicon-generator");
  });

  it("renders the responsive srcset generator", () => {
    expect(SUPPORTED_TOOL_SLUGS).toContain("responsive-image-srcset-generator");
  });

  it("renders the existing single-page audit engine", () => {
    expect(SUPPORTED_TOOL_SLUGS).toContain("single-page-audit");
  });

  it("renders the three authenticated views of one bounded project crawl", () => {
    expect(SUPPORTED_TOOL_SLUGS).toEqual(expect.arrayContaining([
      "whole-site-audit",
      "duplicate-meta-checker",
      "orphan-page-finder",
    ]));
  });

  it("renders the two unique PageSpeed network evidence views", () => {
    expect(SUPPORTED_TOOL_SLUGS).toEqual(expect.arrayContaining([
      "resource-waterfall-analyzer",
      "render-blocking-resources-checker",
    ]));
  });
});
