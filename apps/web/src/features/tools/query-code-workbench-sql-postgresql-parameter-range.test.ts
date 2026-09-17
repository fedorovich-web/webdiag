import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL positional parameter range", () => {
  it.each([
    "$2147483648",
    "$999999999999999999999",
    "$0002147483648",
  ])("rejects out-of-range positional parameter %s", (parameter) => {
    expect(() => formatSql(`select ${parameter};`))
      .toThrow(/PostgreSQL positional parameter number too large/iu);
  });

  it.each([
    "$0",
    "$1",
    "$2147483647",
    "$0000000001",
  ])("preserves in-range positional parameter %s", (parameter) => {
    expect(formatSql(`select ${parameter};`).output)
      .toBe(`SELECT ${parameter};`);
  });

  it.each(["$1foo", "$2_name", "$3é"])(
    "keeps attached identifier suffix %s invalid",
    (parameter) => {
      expect(() => formatSql(`select ${parameter};`))
        .toThrow(/PostgreSQL positional parameter/iu);
    },
  );

  it("does not apply the PostgreSQL parameter range check in MySQL mode", () => {
    expect(() => formatSql("select $2147483648;", { sqlDialect: "mysql" }))
      .not.toThrow();
  });
});
