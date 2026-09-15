import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("SQL prefixed literal preservation", () => {
  it.each([
    ["PostgreSQL escape", String.raw`E'foo\nbar'`],
    ["PostgreSQL escaped quote", String.raw`E'it\'s'`],
    ["PostgreSQL bit", "B'101'"],
    ["PostgreSQL hex", "X'1F'"],
    ["PostgreSQL Unicode string", String.raw`U&'d\0061t\+000061'`],
    ["PostgreSQL Unicode identifier", String.raw`U&"d\0061t"`],
    ["SQL Server Unicode", "N'Michél'"],
  ])("preserves %s adjacency", (_label, literal) => {
    const result = formatSql(`select ${literal} as value;`);
    expect(result.output).toContain(literal);
  });
});
