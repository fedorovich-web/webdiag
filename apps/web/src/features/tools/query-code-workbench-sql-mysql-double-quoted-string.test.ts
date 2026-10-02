import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("MySQL double-quoted string literals", () => {
  it("preserves backslash-escaped double quotes in MySQL mode", () => {
    const input = String.raw`select "from \"where\"" as value;`;
    const expected = String.raw`SELECT "from \"where\"" AS value;`;
    expect(formatSql(input, MYSQL_OPTIONS).output).toBe(expected);
  });

  it("preserves doubled double quotes in MySQL mode", () => {
    expect(formatSql('select "from ""where""" as value;', MYSQL_OPTIONS).output)
      .toBe('SELECT "from ""where""" AS value;');
  });

  it("keeps double-quoted identifiers in standard mode", () => {
    expect(formatSql('select "from""where" from data;').output)
      .toBe('SELECT "from""where"\nFROM data;');
  });
});
