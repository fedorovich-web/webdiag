import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("MySQL line comment rules", () => {
  it.each([
    ["line feed", "\n"],
    ["carriage return", "\r"],
    ["CRLF", "\r\n"],
  ])("treats # as a line comment terminated by %s", (_label, lineEnding) => {
    const result = formatSql(`select 1 # comment${lineEnding}select 2;`, MYSQL_OPTIONS);
    expect(result.output).toContain("# comment");
    expect(result.output).toContain("SELECT 2;");
  });

  it("accepts MySQL -- comments when the second dash is followed by whitespace", () => {
    const result = formatSql("select 1 -- comment\nselect 2;", MYSQL_OPTIONS);
    expect(result.output).toContain("-- comment");
    expect(result.output).toContain("SELECT 2;");
  });

  it.each([
    ["numeric continuation", "select balance--1 as value;", "SELECT balance - - 1 AS value;"],
    ["identifier continuation", "select 1--comment;", "SELECT 1 - - comment;"],
  ])("does not treat -- as a MySQL comment for %s", (_label, input, expected) => {
    expect(formatSql(input, MYSQL_OPTIONS).output).toBe(expected);
  });

  it("keeps standard -- comment handling unchanged", () => {
    const result = formatSql("select 1--comment\nselect 2;");
    expect(result.output).toContain("--comment");
    expect(result.output).toContain("SELECT 2;");
  });

  it.each(["#>", "#>>", "#-"])("keeps PostgreSQL %s operator tokenization in standard mode", (operator) => {
    const result = formatSql(`select payload ${operator} path from data;`);
    expect(result.output).toContain(`payload ${operator} path`);
  });
});
