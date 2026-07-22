import { describe, expect, it } from "vitest";
import { publicTools, tools } from "../src";

describe("tool registry", () => {
  it("contains exactly 125 unique definitions", () => {
    expect(tools).toHaveLength(125);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(125);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(125);
  });

  it("exposes only definitions backed by an implemented tool", () => {
    expect(publicTools).toHaveLength(88);
    expect(publicTools.every((tool) => tool.description?.ru && tool.description.en)).toBe(true);
  });
});
