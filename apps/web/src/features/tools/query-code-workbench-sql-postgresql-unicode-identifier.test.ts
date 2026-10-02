import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("PostgreSQL Unicode identifier preservation", () => {
  it.each([
    ["Cyrillic", "пользователь"],
    ["Latin with diacritic", "café"],
    ["non-BMP letter", "𐐀value"],
  ])("preserves %s bare identifiers", (_label, identifier) => {
    expect(formatSql(`select ${identifier} from data;`).output)
      .toBe(`SELECT ${identifier}\nFROM data;`);
  });

  it("preserves Unicode tagged dollar-quoted strings", () => {
    const literal = "$тег$from where$тег$";
    expect(formatSql(`select ${literal} as value;`).output)
      .toBe(`SELECT ${literal} AS value;`);
  });

  it.each(["alpha_2$value", "_alpha2$value"])(
    "preserves PostgreSQL identifier continuation characters in %s",
    (identifier) => {
      expect(formatSql(`select ${identifier} from data;`).output)
        .toBe(`SELECT ${identifier}\nFROM data;`);
    },
  );

  it("keeps ASCII tagged dollar quotes unchanged", () => {
    const literal = "$tag$from where$tag$";
    expect(formatSql(`select ${literal} as value;`).output)
      .toBe(`SELECT ${literal} AS value;`);
  });

  it("keeps existing ASCII tagged dollar quotes in MySQL mode", () => {
    const literal = "$tag$from where$tag$";
    expect(formatSql(`select ${literal} as value;`, MYSQL_OPTIONS).output)
      .toBe(`SELECT ${literal} AS value;`);
  });

  it("rejects a digit-prefixed identifier as PostgreSQL numeric junk", () => {
    expect(() => formatSql("select 1alpha from data;"))
      .toThrow(/PostgreSQL numeric literal/iu);
  });

  it("does not reinterpret an attached dollar delimiter after an identifier", () => {
    expect(formatSql("select foo$tag$body$tag$ from data;").output)
      .toBe("SELECT foo$tag$body$tag$\nFROM data;");
  });

  it.each(["$1", ":value", "@value"])("keeps placeholder %s tokenization", (placeholder) => {
    expect(formatSql(`select ${placeholder} as value;`).output)
      .toBe(`SELECT ${placeholder} AS value;`);
  });

  it.each(["@>", "<@", "?|", "?&", "#-", "@?", "@@"])(
    "keeps PostgreSQL compound operator %s tokenization",
    (operator) => {
      expect(formatSql(`select a ${operator} b;`).output).toContain(`a ${operator} b`);
    },
  );

  it("does not broaden MySQL bare identifiers", () => {
    expect(() => formatSql("select café from data;", MYSQL_OPTIONS))
      .toThrow(/Unsupported SQL character/u);
  });
});
