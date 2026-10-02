import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("PostgreSQL UESCAPE validation", () => {
  it("requires UESCAPE to be followed by a simple string literal", () => {
    expect(() => formatSql("select U&'wrong: +0061' UESCAPE +;"))
      .toThrow(/UESCAPE must be followed by a simple string literal/u);
  });

  it.each([
    ["plus", "'+'"],
    ["hex digit", "'0'"],
    ["hex letter", "'A'"],
    ["whitespace", "' '"],
    ["multiple characters", "'!!'"],
  ])("rejects invalid %s escape characters", (_label, escapeLiteral) => {
    expect(() => formatSql(`select U&'wrong: +0061' UESCAPE ${escapeLiteral};`))
      .toThrow(/invalid Unicode escape character/u);
  });

  it.each([
    ["Unicode string", "select U&'d!0061t' UESCAPE '!';", "SELECT U&'d!0061t' UESCAPE '!';"],
    ["Unicode identifier", "select U&\"d*0061t\" UESCAPE '*';", "SELECT U&\"d*0061t\" UESCAPE '*';"],
    [
      "continued Unicode string",
      "select U&'d!0061'\n'ta' UESCAPE '!';",
      "SELECT U&'d!0061'\n'ta' UESCAPE '!';",
    ],
  ])("preserves valid %s UESCAPE clauses", (_label, input, expected) => {
    expect(formatSql(input).output).toBe(expected);
  });

  it("does not apply PostgreSQL UESCAPE validation in MySQL mode", () => {
    expect(() => formatSql("select U&'wrong: +0061' UESCAPE +;", MYSQL_OPTIONS))
      .not.toThrow();
  });
});
