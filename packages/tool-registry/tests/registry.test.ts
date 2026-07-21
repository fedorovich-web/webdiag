import { describe, expect, it } from "vitest";
import { publicTools, tools } from "../src";

describe("tool registry", () => {
  it("contains exactly 115 unique definitions", () => {
    expect(tools).toHaveLength(115);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(115);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(115);
  });

  it("exposes only definitions backed by an implemented tool", () => {
    expect(publicTools).toHaveLength(64);
    expect(publicTools.every((tool) => tool.description?.ru && tool.description.en)).toBe(true);
  });
});
