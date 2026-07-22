import { describe, expect, it } from "vitest";
import {
  analyzeCsv,
  csvToJson,
  jsonToCsv,
  jsonToToml,
  queryJsonPath,
  tomlToJson,
} from "./structured-text-workbench";

describe("bounded JSONPath query lab", () => {
  const catalog = JSON.stringify({
    store: {
      book: [
        { title: "One", price: 8, tags: ["seo", "web"] },
        { title: "Two", price: 12, tags: ["dns"] },
      ],
      active: true,
    },
  });

  it("supports properties, indices, wildcards, unions, slices, and recursive descent", () => {
    expect(queryJsonPath(catalog, "$.store.book[0].title").matches[0]?.value).toBe("One");
    expect(queryJsonPath(catalog, "$.store.book[*].title").matches.map((match) => match.value)).toEqual(["One", "Two"]);
    expect(queryJsonPath(catalog, "$.store.book[0,1].price").matchCount).toBe(2);
    expect(queryJsonPath(catalog, "$.store.book[0:2:1].title").matchCount).toBe(2);
    expect(queryJsonPath(catalog, "$..title").matches.map((match) => match.value)).toEqual(["One", "Two"]);
  });

  it("supports bounded existence and comparison filters without eval", () => {
    expect(queryJsonPath(catalog, "$.store.book[?(@.price < 10)].title").matches[0]?.value).toBe("One");
    expect(queryJsonPath(catalog, "$.store.book[?(@.tags)].title").matchCount).toBe(2);
    expect(() => queryJsonPath(catalog, "$.store.book[?(@.price + 1 > 10)]")).toThrow(/unsupported JSONPath filter path syntax/iu);
    expect(() => queryJsonPath(catalog, "$.store.book[?(@.title =~ /One/)]")).toThrow(/filter/iu);
  });

  it("returns JSON Pointer paths and rejects script-style expressions", () => {
    const result = queryJsonPath('{"a/b":{"~key":1}}', "$['a/b']['~key']");
    expect(result.matches[0]?.path).toBe("/a~1b/~0key");
    expect(() => queryJsonPath(catalog, "$[(@.length-1)]")).toThrow(/quoted properties|syntax|selector/iu);
  });
});

describe("TOML and JSON bounded conversion", () => {
  it("parses tables, arrays of tables, numbers, arrays, and date/time strings", () => {
    const result = tomlToJson([
      'title = "WebDiag"',
      "ports = [80, 443]",
      "released = 2026-07-22",
      "[database]",
      'host = "localhost"',
      "[[servers]]",
      'name = "alpha"',
      "[[servers]]",
      'name = "beta"',
    ].join("\n"));
    expect(JSON.parse(result.output)).toEqual({
      title: "WebDiag",
      ports: [80, 443],
      released: "2026-07-22",
      database: { host: "localhost" },
      servers: [{ name: "alpha" }, { name: "beta" }],
    });
    expect(result.warnings).toContain("toml-date-time-preserved-as-string");
  });

  it("rejects duplicate keys, non-finite numbers, null conversion, and unsafe integers", () => {
    expect(() => tomlToJson("name = 1\nname = 2")).toThrow(/duplicate TOML key/iu);
    expect(() => tomlToJson("[table]\nvalue = 1\n[table]\nother = 2")).toThrow(/duplicate TOML table/iu);
    expect(() => tomlToJson("value = nan")).toThrow(/cannot be represented in JSON/iu);
    expect(() => tomlToJson("values = [1,,2]")).toThrow(/empty element/iu);
    expect(JSON.parse(tomlToJson("values = [1, 2,]").output)).toEqual({ values: [1, 2] });
    expect(() => tomlToJson("value = 9007199254740993")).toThrow(/safe-integer/iu);
    expect(() => jsonToToml('{"value":null}')).toThrow(/no TOML 1.0 representation/iu);
  });

  it("emits nested tables and array tables and round-trips the supported subset", () => {
    const json = JSON.stringify({
      title: "WebDiag",
      database: { enabled: true, ports: [80, 443] },
      servers: [{ name: "alpha", weight: 1 }, { name: "beta", weight: 2 }],
    });
    const toml = jsonToToml(json);
    expect(toml.output).toContain("[database]");
    expect(toml.output).toContain("[[servers]]");
    expect(JSON.parse(tomlToJson(toml.output).output)).toEqual(JSON.parse(json));
  });
});

describe("CSV data workbench", () => {
  it("detects delimiters and parses quoted delimiters, escaped quotes, and multiline fields", () => {
    const csv = '\uFEFFname;note\r\nWebDiag;"line 1\nline 2"\r\nDNS;"a; b and ""quotes"""\r\n';
    const result = csvToJson(csv, { delimiter: "auto", header: true });
    expect(result.valid).toBe(true);
    expect(result.delimiter).toBe(";");
    expect(JSON.parse(result.output)).toEqual([
      { name: "WebDiag", note: "line 1\nline 2" },
      { name: "DNS", note: 'a; b and "quotes"' },
    ]);
  });

  it("reports inconsistent rows, duplicate headers, and formula-like fields", () => {
    const result = analyzeCsv("name,name\n=1,value\nshort", { header: true });
    expect(result.valid).toBe(false);
    expect(result.duplicateHeaderCount).toBe(1);
    expect(result.formulaRiskCount).toBe(1);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "duplicate-header",
      "inconsistent-column-count",
    ]));
  });

  it("converts object arrays and can prefix formula-like cells", () => {
    const result = jsonToCsv('[{"name":"WebDiag","value":"=1+1"},{"name":"DNS","value":"ok"}]', {
      delimiter: ",",
      escapeFormulae: true,
    });
    expect(result.output).toContain("'=1+1");
    expect(result.formulaRiskCount).toBe(1);
    expect(result.escapedFormulaCount).toBe(1);
    expect(JSON.parse(csvToJson(result.output, { delimiter: ",", header: true }).output)).toEqual([
      { name: "WebDiag", value: "'=1+1" },
      { name: "DNS", value: "ok" },
    ]);
  });

  it("rejects nested JSON values and inconsistent row arrays", () => {
    expect(() => jsonToCsv('[{"value":{"nested":true}}]')).toThrow(/scalar values/iu);
    expect(() => jsonToCsv('[["a","b"],["c"]]')).toThrow(/consistent length/iu);
    expect(jsonToCsv("[]")).toMatchObject({ output: "", rowCount: 0, columnCount: 0 });
  });
});
