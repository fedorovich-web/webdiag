import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL numeric and parameter token boundaries", () => {
  it.each([
    ["integer identifier suffix", "123abc"],
    ["integer underscore suffix", "123_name"],
    ["integer Unicode identifier suffix", "123é"],
    ["numeric identifier suffix", "1.5value"],
    ["real identifier suffix", "1e2foo"],
    ["incomplete exponent", "1e"],
    ["incomplete positive exponent", "1e+"],
    ["incomplete negative exponent", "1e-"],
    ["incomplete hexadecimal prefix", "0x"],
    ["hexadecimal junk suffix", "0x1g"],
    ["binary invalid digit", "0b102"],
    ["octal invalid digit", "0o78"],
  ])("rejects %s instead of repairing it", (_label, literal) => {
    expect(() => formatSql(`select ${literal};`)).toThrow(/PostgreSQL numeric literal/iu);
  });

  it.each([
    ["ASCII suffix", "$1foo"],
    ["underscore suffix", "$2_name"],
    ["Unicode suffix", "$3é"],
  ])("rejects positional parameter %s", (_label, parameter) => {
    expect(() => formatSql(`select ${parameter};`)).toThrow(/PostgreSQL positional parameter/iu);
  });

  it.each(["123", "1.5", ".5", "1e+2", "0xFF", "0o755", "0b1010"])(
    "preserves valid numeric literal %s",
    (literal) => {
      expect(() => formatSql(`select ${literal};`)).not.toThrow();
      expect(formatSql(`select ${literal};`).output).toContain(literal);
    },
  );

  it("preserves separated aliases and casts", () => {
    const result = formatSql("select 123 value,123::int,$1 value,$1::text;");
    expect(result.output).toContain("123 value");
    expect(result.output).toContain("123 :: int");
    expect(result.output).toContain("$1 value");
    expect(result.output).toContain("$1 :: text");
  });

  it("keeps existing MySQL token-boundary behavior", () => {
    expect(() => formatSql("select 123abc,$1foo;", { sqlDialect: "mysql" })).not.toThrow();
  });
});
