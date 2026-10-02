import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL numeric literal preservation", () => {
  it.each([
    ["binary integer", "0b100101"],
    ["uppercase binary integer", "0B10011001"],
    ["octal integer", "0o273"],
    ["uppercase octal integer", "0O755"],
    ["decimal digit separators", "1_500_000_000"],
    ["binary digit separators", "0b10001000_00000000"],
    ["octal separator after radix prefix", "0o_1_755"],
    ["hexadecimal digit separators", "0xFFFF_FFFF"],
    ["fractional digit separators", "1.618_034"],
  ])("preserves %s as one numeric token", (_label, literal) => {
    const result = formatSql(`select ${literal} as value;`);
    expect(result.output).toContain(literal);
  });
});
