import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL bit-string lexical validation", () => {
  it.each([
    ["binary digit outside alphabet", "B'102'"],
    ["lowercase binary prefix", "b'abc'"],
    ["hex digit outside alphabet", "X'1G'"],
    ["lowercase hex prefix", "x'ZZ'"],
  ])("rejects invalid %s", (_label, literal) => {
    expect(() => formatSql(`select ${literal};`))
      .toThrow(/Invalid PostgreSQL (?:binary|hexadecimal) bit string/iu);
  });

  it.each([
    ["binary continuation", "select B'10'\n'02';"],
    ["hex continuation", "select X'1F'\n'G0';"],
    ["binary continuation chain", "select B'1'\n'0'\n'2';"],
    ["hex continuation chain", "select X'A'\n'F'\n'Z';"],
  ])("rejects invalid %s", (_label, input) => {
    expect(() => formatSql(input))
      .toThrow(/Invalid PostgreSQL (?:binary|hexadecimal) bit string/iu);
  });

  it.each([
    ["binary", "select B'101';", "SELECT B'101';"],
    ["lowercase binary", "select b'010';", "SELECT b'010';"],
    ["hexadecimal", "select X'1Fa0';", "SELECT X'1Fa0';"],
    ["lowercase hexadecimal", "select x'aB09';", "SELECT x'aB09';"],
    ["binary continuation", "select B'10'\n'01';", "SELECT B'10'\n'01';"],
    ["hex continuation", "select X'1F'\n'A0';", "SELECT X'1F'\n'A0';"],
    ["binary continuation chain", "select B'1'\n'0'\n'1';", "SELECT B'1'\n'0'\n'1';"],
  ])("preserves valid %s", (_label, input, expected) => {
    expect(formatSql(input).output).toBe(expected);
  });

  it("does not add PostgreSQL bit-string validation in MySQL mode", () => {
    expect(() => formatSql("select B'102', X'1G';", { sqlDialect: "mysql" }))
      .not.toThrow();
  });
});
