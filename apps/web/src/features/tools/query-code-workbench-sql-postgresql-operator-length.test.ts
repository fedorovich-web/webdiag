import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL operator length", () => {
  it("preserves a 63-character operator", () => {
    const operator = "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~";
    expect(() => formatSql(`select a ${operator} b;`)).not.toThrow();
    expect(formatSql(`select a ${operator} b;`).output).toContain(`a ${operator} b`);
  });

  it.each([
    ["64-character operator", "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"],
    ["substantially longer operator", "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"],
  ])("rejects %s", (_label, operator) => {
    expect(() => formatSql(`select a ${operator} b;`))
      .toThrow(/PostgreSQL operator too long/iu);
  });

  it("checks length after PostgreSQL trailing-sign normalization", () => {
    const operator = "***************************************************************-";
    expect(() => formatSql(`select a ${operator} b;`)).not.toThrow();
  });

  it("keeps MySQL operator tokenization unchanged", () => {
    const operator = "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~";
    expect(() => formatSql(`select a ${operator} b;`, { sqlDialect: "mysql" }))
      .not.toThrow();
  });
});
