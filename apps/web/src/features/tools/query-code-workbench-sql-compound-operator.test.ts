import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("SQL compound operator preservation", () => {
  it.each([
    ["MySQL NULL-safe equality", "<=>"],
    ["bitwise left shift", "<<"],
    ["bitwise right shift", ">>"],
    ["SQL Server not less than", "!<"],
    ["SQL Server not greater than", "!>"],
    ["PostgreSQL JSON contains", "@>"],
    ["PostgreSQL JSON contained by", "<@"],
    ["PostgreSQL JSON any-key", "?|"],
    ["PostgreSQL JSON all-keys", "?&"],
    ["PostgreSQL JSON path deletion", "#-"],
    ["PostgreSQL JSONPath existence", "@?"],
    ["PostgreSQL JSONPath predicate", "@@"],
  ])("preserves %s as one operator token", (_label, operator) => {
    const result = formatSql(`select a ${operator} b;`);
    expect(result.output).toContain(`a ${operator} b`);
  });

  it.each(["+=", "-=", "*=", "/=", "%=", "&=", "^=", "|="])(
    "preserves SQL Server compound assignment %s",
    (operator) => {
      const result = formatSql(`set @value ${operator} 2;`);
      expect(result.output).toContain(`@value ${operator} 2`);
    },
  );
});
