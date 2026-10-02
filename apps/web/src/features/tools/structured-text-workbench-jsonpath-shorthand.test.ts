import { describe, expect, it } from "vitest";
import { queryJsonPath } from "./structured-text-workbench";

describe("RFC 9535 JSONPath member-name shorthand", () => {
  const document = JSON.stringify({
    café: 1,
    "💩": 2,
    "a-b": 3,
    "$money": 4,
    items: [{ café: 1 }],
  });

  it("accepts Unicode shorthand and rejects characters excluded by the RFC grammar", () => {
    expect(queryJsonPath(document, "$.café").matches[0]?.value).toBe(1);
    expect(queryJsonPath(document, "$.💩").matches[0]?.value).toBe(2);
    expect(queryJsonPath(document, "$.items[?(@.café == 1)]").matchCount).toBe(1);

    expect(() => queryJsonPath(document, "$.a-b")).toThrow(/JSONPath|syntax|token/iu);
    expect(() => queryJsonPath(document, "$.$money")).toThrow(/JSONPath|syntax|token/iu);

    expect(queryJsonPath(document, "$['a-b']").matches[0]?.value).toBe(3);
    expect(queryJsonPath(document, "$['$money']").matches[0]?.value).toBe(4);
  });
});
