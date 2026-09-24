import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL national string continuation", () => {
  it.each([
    ["national string", "select N'foo'\n'bar';", "SELECT N'foo'\n'bar';"],
    ["lowercase national prefix", "select n'foo'\n'bar';", "SELECT n'foo'\n'bar';"],
    ["CRLF with horizontal whitespace", "select N'foo'  \r\n   'bar';", "SELECT N'foo'\n'bar';"],
    ["continuation chain", "select N'foo'\n'bar'\n'baz';", "SELECT N'foo'\n'bar'\n'baz';"],
  ])("preserves the significant line break for %s", (_label, input, expected) => {
    expect(formatSql(input).output).toBe(expected);
  });

  it("does not invent a continuation for same-line adjacent national strings", () => {
    expect(formatSql("select N'foo'   'bar';").output).toBe("SELECT N'foo' 'bar';");
  });

  it("does not apply PostgreSQL national-string continuation preservation in MySQL mode", () => {
    expect(formatSql("select N'foo'\n'bar';", { sqlDialect: "mysql" }).output).toBe("SELECT N'foo' 'bar';");
  });
});
