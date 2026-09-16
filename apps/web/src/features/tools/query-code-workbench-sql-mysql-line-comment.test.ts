import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("MySQL line comment preservation", () => {
  it.each([
    ["line feed", "\n"],
    ["carriage return", "\r"],
    ["CRLF", "\r\n"],
  ])("terminates # comments at %s line endings", (_label, lineEnding) => {
    const result = formatSql(`select 1 # comment${lineEnding}select 2;`, MYSQL_OPTIONS);
    expect(result.output).toContain("# comment");
    expect(result.output).toContain("SELECT 2;");
  });

  it.each([
    ["space", " "],
    ["tab", "\t"],
  ])("recognizes -- comments when followed by %s in MySQL mode", (_label, separator) => {
    const result = formatSql(`select 1--${separator}comment\nselect 2;`, MYSQL_OPTIONS);
    expect(result.output).toContain(`--${separator}comment`);
    expect(result.output).toContain("SELECT 2;");
  });

  it("does not treat -- followed by a digit as a MySQL comment", () => {
    const result = formatSql("select 5--1;", MYSQL_OPTIONS);
    expect(result.output).toContain("SELECT 5 - - 1;");
  });

  it("keeps standard -- comment behavior outside MySQL mode", () => {
    const result = formatSql("select 5--1;\nselect 2;");
    expect(result.output).toContain("--1;");
    expect(result.output).toContain("SELECT 2;");
  });
});
