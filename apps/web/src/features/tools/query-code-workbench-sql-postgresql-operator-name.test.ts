import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("PostgreSQL operator-name preservation", () => {
  it.each(["<->", "#=#", "@-"])(
    "preserves PostgreSQL operator name %s as one token",
    (operator) => {
      const result = formatSql(`select a ${operator} b;`);
      expect(result.output).toContain(`a ${operator} b`);
    },
  );

  it("keeps a trailing minus separate when PostgreSQL does not allow it in the operator name", () => {
    expect(formatSql("select a *- b;").output).toContain("a * - b");
  });

  it.each(["$1", ":value", "@value", "?"])(
    "keeps placeholder %s tokenization",
    (placeholder) => {
      expect(formatSql(`select ${placeholder} as value;`).output)
        .toBe(`SELECT ${placeholder} AS value;`);
    },
  );

  it("does not broaden MySQL operator names", () => {
    expect(() => formatSql("select a @- b;", MYSQL_OPTIONS))
      .toThrow(/Unsupported SQL character/u);
  });
});
