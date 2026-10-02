import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL empty delimited identifiers", () => {
  it.each([
    ["ordinary delimited identifier", 'select "";'],
    ["Unicode delimited identifier", 'select U&"";'],
    ["lowercase Unicode delimited identifier", 'select u&"";'],
  ])("rejects zero-length %s", (_label, input) => {
    expect(() => formatSql(input)).toThrow(/PostgreSQL.*delimited identifier/iu);
  });

  it.each([
    ["ordinary identifier", 'select "name";', '"name"'],
    ["escaped quote identifier", 'select """";', '""""'],
    ["Unicode identifier", String.raw`select U&"d\0061t";`, String.raw`U&"d\0061t"`],
    ["Unicode escaped quote identifier", 'select U&"""";', 'U&""""'],
  ])("preserves valid %s", (_label, input, literal) => {
    expect(() => formatSql(input)).not.toThrow();
    expect(formatSql(input).output).toContain(literal);
  });

  it("keeps MySQL empty double-quoted string behavior unchanged", () => {
    expect(() => formatSql('select "";', { sqlDialect: "mysql" })).not.toThrow();
    expect(formatSql('select "";', { sqlDialect: "mysql" }).output).toBe('SELECT "";');
  });
});
