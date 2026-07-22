import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analyzeRegexRisk,
  formatGraphql,
  formatSql,
  validateRegexFlags,
  validateRegexWorkerRequest,
  REGEX_WORKER_PATH,
} from "./query-code-workbench";

describe("conservative SQL formatter", () => {
  it("formats common clauses and preserves quoted content", () => {
    const result = formatSql(
      "select u.id,u.email,count(o.id) total from users u left join orders o on o.user_id=u.id where u.note='from here' group by u.id,u.email order by total desc;",
      { indentSize: 2, keywordCase: "upper" },
    );
    expect(result.output).toContain("SELECT u.id,");
    expect(result.output).toContain("LEFT JOIN orders o");
    expect(result.output).toContain("WHERE u.note = 'from here'");
    expect(result.output).toContain("ORDER BY total DESC;");
    expect(result.tokenCount).toBeGreaterThan(20);
  });

  it("formats nested subqueries without flattening strings or comments", () => {
    const result = formatSql("with x as(select id from users where id in(select user_id from orders)) -- keep\nselect * from x;");
    expect(result.output).toContain("WITH x AS (\n  SELECT id");
    expect(result.output).toContain("WHERE id IN (\n    SELECT user_id");
    expect(result.output).toContain("-- keep");
    expect(result.output).toContain("SELECT *\nFROM x;");
    const multipleCtes = formatSql("with a as(select id from one),b as(select id from two) select a.id from a join b on b.id=a.id;");
    expect(multipleCtes.output).toContain("),\nb AS (\n  SELECT id");
    expect(multipleCtes.output).toContain("JOIN b\n  ON b.id = a.id;");
  });

  it("reports dialect signals and rejects unterminated or unbalanced input", () => {
    expect(formatSql("select `name` from users where payload->>'id'='1'").warnings).toEqual(expect.arrayContaining([
      "mysql-backtick-identifier",
      "dialect-specific-operator",
    ]));
    expect(() => formatSql("select 'broken")).toThrow(/unterminated quoted value/iu);
    expect(() => formatSql("select (1")).toThrow(/opening parenthesis/iu);
    expect(() => formatSql("select 1)")).toThrow(/closing parenthesis/iu);
  });

  it("supports lower and preserved keyword casing", () => {
    expect(formatSql("SELECT value FROM data", { keywordCase: "lower" }).output).toBe("select value\nfrom data");
    expect(formatSql("SeLeCt value FrOm data", { keywordCase: "preserve" }).output).toBe("SeLeCt value\nFrOm data");
  });
});

describe("bounded GraphQL formatter", () => {
  it("formats nested selection sets, variables, aliases, and directives", () => {
    const result = formatGraphql("query Tool($slug:String!){entry:tool(slug:$slug)@include(if:true){slug title{ru en}}}");
    expect(result.output).toContain("query Tool($slug: String!) {");
    expect(result.output).toContain("entry: tool(slug: $slug) @include(if: true) {");
    expect(result.output).toContain("title {\n      ru\n      en\n    }");
    expect(result.warnings).toContain("syntax-only-no-schema-validation");
  });

  it("preserves comments, strings, block strings, and fragment spreads", () => {
    const result = formatGraphql('# note\nquery Q{search(text:"a\\\"b"){...Result}} fragment Result on Item{value note(text:"""line 1\nline 2""")}');
    expect(result.output).toContain("# note");
    expect(result.output).toContain('text: "a\\\"b"');
    expect(result.output).toContain("...Result");
    expect(result.output).toContain('"""line 1\nline 2"""');
  });

  it("rejects invalid characters and unbalanced delimiters", () => {
    expect(() => formatGraphql("query Q { field ] }")).toThrow(/closing bracket/iu);
    expect(() => formatGraphql("query Q { field")).toThrow(/unclosed selection/iu);
    expect(() => formatGraphql("query Q { field % value }")).toThrow(/unsupported GraphQL character/iu);
    expect(() => formatGraphql('query Q { field(value: "line 1\nline 2") }')).toThrow(/unescaped line break/iu);
  });
});

describe("safe regex lab contracts", () => {
  it("validates flags and bounded worker requests", () => {
    expect(validateRegexFlags("dgimsuy")).toBe("dgimsuy");
    expect(() => validateRegexFlags("gg")).toThrow(/duplicate/iu);
    expect(() => validateRegexFlags("x")).toThrow(/unsupported/iu);
    expect(() => validateRegexFlags("uv")).toThrow(/cannot be used together/iu);
    expect(validateRegexWorkerRequest({ pattern: "a+", flags: "gu", text: "aaa", maximumMatches: 10, maximumPreviewCharacters: 100 })).toMatchObject({ pattern: "a+" });
    expect(() => validateRegexWorkerRequest({ pattern: "a", flags: "g", text: "x", maximumMatches: 0, maximumPreviewCharacters: 100 })).toThrow(/maximumMatches/iu);
  });

  it("reports nested quantifiers, broad wildcards, backreferences, and review-only features", () => {
    const high = analyzeRegexRisk("^(a+)+.*.*$", "g");
    expect(high.level).toBe("high");
    expect(high.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["nested-quantifier", "multiple-wildcards"]));
    const review = analyzeRegexRisk("(foo|foobar)+\\1(?<=x)", "u");
    expect(review.level).toBe("review");
    expect(review.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["quantified-alternation", "backreference", "lookbehind"]));
    expect(analyzeRegexRisk("^[a-z0-9_-]+$", "iu").level).toBe("low");
  });

  it("ships a same-origin isolated worker without eval or Function construction", () => {
    expect(REGEX_WORKER_PATH).toBe("/workers/regex-lab-worker.js");
    const source = readFileSync(new URL("../../../public/workers/regex-lab-worker.js", import.meta.url), "utf8");
    expect(source).toContain("self.onmessage");
    expect(source).toContain("new RegExp(pattern, flags)");
    expect(source).toContain('self.postMessage({ kind: "ready" })');
    expect(source).toContain("maximumMatches");
    expect(source).not.toMatch(/\beval\s*\(/u);
    expect(source).not.toMatch(/\bFunction\s*\(/u);
  });
});
