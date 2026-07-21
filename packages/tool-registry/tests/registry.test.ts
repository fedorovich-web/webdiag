import { describe, expect, it } from "vitest";
import { publicTools, tools } from "../src";

describe("tool registry", () => {
  it("contains exactly 113 unique definitions", () => {
    expect(tools).toHaveLength(113);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(113);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(113);
  });

  it("exposes only definitions backed by an implemented tool", () => {
    expect(publicTools).toHaveLength(61);
    expect(publicTools.every((tool) => tool.description?.ru && tool.description.en)).toBe(true);
  });
});
