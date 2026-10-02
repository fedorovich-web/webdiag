import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL multiline string continuation", () => {
  it.each([
    ["ordinary string", "select 'foo'\n'bar';", "SELECT 'foo'\n'bar';"],
    ["CRLF with horizontal whitespace", "select 'foo'  \r\n   'bar';", "SELECT 'foo'\n'bar';"],
    ["escape string", "select E'foo\\n'\n'bar';", "SELECT E'foo\\n'\n'bar';"],
    ["bit string", "select B'10'\n'01';", "SELECT B'10'\n'01';"],
    ["hex string", "select X'1F'\n'A0';", "SELECT X'1F'\n'A0';"],
  ])("preserves the significant line break for %s", (_label, input, expected) => {
    expect(formatSql(input).output).toBe(expected);
  });

  it("does not invent a continuation for same-line adjacent strings", () => {
    expect(formatSql("select 'foo'   'bar';").output).toBe("SELECT 'foo' 'bar';");
  });

  it("continues to discard unrelated source line breaks", () => {
    expect(formatSql("select value\n+ other from data;").output).toBe("SELECT value + other\nFROM data;");
  });

  it("does not apply PostgreSQL continuation preservation in MySQL mode", () => {
    expect(formatSql("select 'foo'\n'bar';", { sqlDialect: "mysql" }).output).toBe("SELECT 'foo' 'bar';");
  });
});
