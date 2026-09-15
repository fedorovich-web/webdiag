import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("SQL prefixed literal preservation", () => {
  it.each([
    ["PostgreSQL escape", "E'foo\\nbar'"],
    ["PostgreSQL bit", "B'101'"],
    ["PostgreSQL hex", "X'1F'"],
    ["SQL Server Unicode", "N'Michél'"],
  ])("preserves %s literal adjacency", (_label, literal) => {
    const result = formatSql(`select ${literal} as value;`);
    expect(result.output).toContain(literal);
  });
});
