import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("PostgreSQL dot-dot numeric tokenization", () => {
  it("keeps 1..10 as integer, dot-dot, integer tokens", () => {
    const result = formatSql("select 1..10;");

    expect(result.output).toBe("SELECT 1..10;");
    expect(result.tokenCount).toBe(5);
  });

  it.each([
    ["decimal fraction", "1.10"],
    ["trailing decimal point", "1."],
    ["leading decimal point", ".10"],
    ["scientific notation", "1.5e2"],
  ])("preserves %s", (_label, literal) => {
    expect(formatSql(`select ${literal};`).output).toBe(`SELECT ${literal};`);
  });

  it("does not change MySQL dot-dot handling", () => {
    const result = formatSql("select 1..10;", MYSQL_OPTIONS);

    expect(result.output).toBe("SELECT 1. .10;");
    expect(result.tokenCount).toBe(4);
  });
});
