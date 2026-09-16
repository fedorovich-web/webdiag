import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions & { readonly sqlDialect: "mysql" } = {
  sqlDialect: "mysql",
};

describe("SQL lexical mode preservation", () => {
  it.each([
    ["ordinary string", "select 'it\\'s' as value;", "'it\\'s'"],
    ["uppercase national string", "select N'it\\'s' as value;", "N'it\\'s'"],
    ["lowercase national string", "select n'it\\'s' as value;", "n'it\\'s'"],
    ["character-set introduced string", "select _utf8mb4'it\\'s' as value;", "'it\\'s'"],
  ])("preserves a backslash-escaped quote in %s in MySQL mode", (_label, input, literal) => {
    const result = formatSql(input, MYSQL_OPTIONS);
    expect(result.output).toContain(literal);
  });

  it.each([
    ["ordinary standard string", "select 'a\\' || 'b';", "'a\\' || 'b'"],
    ["SQL Server national string", "select N'a\\' + N'b';", "N'a\\' + N'b'"],
  ])("keeps %s termination unchanged by default", (_label, input, expression) => {
    const result = formatSql(input);
    expect(result.output).toContain(expression);
  });

  it("preserves a nested block comment as one comment in standard mode", () => {
    const result = formatSql("select 1 /* outer /* inner */ still outer */ + 2;");
    expect(result.output).toContain("/* outer /* inner */ still outer */");
    expect(result.output).toContain("+ 2;");
  });

  it("requires a matching outer terminator for nested standard block comments", () => {
    expect(() => formatSql("select 1 /* outer /* inner */ + 2;")).toThrow(/Unterminated SQL block comment/u);
  });

  it("keeps MySQL block comments non-nesting", () => {
    const result = formatSql("select 1 /* outer /* inner */ + 2;", MYSQL_OPTIONS);
    expect(result.output).toContain("/* outer /* inner */");
    expect(result.output).toContain("+ 2;");
  });
});
