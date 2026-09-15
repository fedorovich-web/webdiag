import { describe, expect, it } from "vitest";
import { queryJsonPath } from "./structured-text-workbench";

describe("RFC 9535 JSONPath duplicate nodelist semantics", () => {
  it("preserves a node selected more than once by one child segment", () => {
    const result = queryJsonPath('["a", "b"]', "$[0,0]");

    expect(result.matches).toEqual([
      { path: "/0", value: "a" },
      { path: "/0", value: "a" },
    ]);
    expect(result.matchCount).toBe(2);
    expect(result.truncated).toBe(false);
  });
});
