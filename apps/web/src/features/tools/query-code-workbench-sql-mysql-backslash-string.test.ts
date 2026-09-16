import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions & { readonly mysqlBackslashEscapes: true } = {
  mysqlBackslashEscapes: true,
};

describe("MySQL backslash string escape preservation", () => {
  it.each([
    ["ordinary string", "select 'it\\'s' as value;", "'it\\'s'"],
    ["uppercase national string", "select N'it\\'s' as value;", "N'it\\'s'"],
    ["lowercase national string", "select n'it\\'s' as value;", "n'it\\'s'"],
    ["character-set introduced string", "select _utf8mb4'it\\'s' as value;", "'it\\'s'"],
  ])("preserves a backslash-escaped quote in %s when MySQL escapes are enabled", (_label, input, literal) => {
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
});
