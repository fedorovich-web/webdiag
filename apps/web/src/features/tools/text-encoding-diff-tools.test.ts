import { describe, expect, it } from "vitest";
import {
  MAX_TEXT_LENGTH,
  compareTextLines,
  decodeHtmlEntities,
  encodeHtmlEntities,
} from "./text-encoding-diff-engine";

describe("HTML entity conversion", () => {
  it("encodes HTML-sensitive characters and optional non-ASCII code points", () => {
    expect(encodeHtmlEntities('<p title="café">A&B</p>', {
      encodeQuotes: true,
      encodeNonAscii: true,
      numericFormat: "hexadecimal",
    })).toBe("&lt;p title=&quot;caf&#xE9;&quot;&gt;A&amp;B&lt;/p&gt;");

    expect(encodeHtmlEntities("'plain'", {
      encodeQuotes: false,
      encodeNonAscii: false,
      numericFormat: "decimal",
    })).toBe("'plain'");
  });

  it("decodes bounded named, decimal, hexadecimal, and astral entities", () => {
    expect(decodeHtmlEntities("&lt;strong&gt;A&amp;B&lt;/strong&gt; &#169; &#x1F642;"))
      .toBe("<strong>A&B</strong> © 🙂");
    expect(decodeHtmlEntities("&unknown; &copy; &mdash;"))
      .toBe("&unknown; © —");
  });

  it("rejects invalid Unicode entities and oversized references", () => {
    expect(() => decodeHtmlEntities("&#0;")).toThrow(/U\+0000/u);
    expect(() => decodeHtmlEntities("&#xD800;")).toThrow(/Unicode scalar/u);
    expect(() => decodeHtmlEntities("&#x110000;")).toThrow(/Unicode scalar/u);
    expect(() => decodeHtmlEntities(`&${"a".repeat(33)};`)).toThrow(/32 characters/u);
    expect(() => encodeHtmlEntities("\uD800", {
      encodeQuotes: true,
      encodeNonAscii: true,
      numericFormat: "decimal",
    })).toThrow(/surrogate/u);
  });

  it("enforces the shared text input cap", () => {
    expect(() => decodeHtmlEntities("a".repeat(MAX_TEXT_LENGTH + 1))).toThrow(/character limit/u);
  });
});

describe("bounded line diff", () => {
  it("returns a deterministic line-level replacement and insertion", () => {
    const result = compareTextLines(
      "one\ntwo\nthree",
      "one\nTWO\nthree\nfour",
      { ignoreTrailingWhitespace: false },
    );

    expect(result.summary).toEqual({
      additions: 2,
      deletions: 1,
      unchanged: 2,
      replacementGroups: 1,
    });
    expect(result.unifiedDiff).toContain("-two\n+TWO");
    expect(result.unifiedDiff).toContain("+four");
    expect(compareTextLines("a\na\nb", "a\nb\na", { ignoreTrailingWhitespace: false }))
      .toEqual(compareTextLines("a\na\nb", "a\nb\na", { ignoreTrailingWhitespace: false }));
  });

  it("normalizes line endings and optionally ignores trailing whitespace", () => {
    expect(compareTextLines("one\r\ntwo\r", "one\ntwo\n", { ignoreTrailingWhitespace: false }).summary)
      .toEqual({ additions: 0, deletions: 0, unchanged: 3, replacementGroups: 0 });
    expect(compareTextLines("value   ", "value", { ignoreTrailingWhitespace: true }).summary)
      .toEqual({ additions: 0, deletions: 0, unchanged: 1, replacementGroups: 0 });
  });

  it("keeps markup as plain diff text", () => {
    const result = compareTextLines("<script>old()</script>", "<script>new()</script>", {
      ignoreTrailingWhitespace: false,
    });
    expect(result.unifiedDiff).toContain("-<script>old()</script>");
    expect(result.unifiedDiff).toContain("+<script>new()</script>");
  });

  it("rejects comparisons above the operation or output budget", () => {
    const manyLines = Array.from({ length: 1_500 }, (_, index) => `line-${index}`).join("\n");
    expect(() => compareTextLines(manyLines, manyLines, { ignoreTrailingWhitespace: false }))
      .toThrow(/operation budget/u);

    const original = Array.from({ length: 1_000 }, (_, index) => `${index}-${"a".repeat(190)}`).join("\n");
    const changed = Array.from({ length: 1_000 }, (_, index) => `${index}-${"b".repeat(190)}`).join("\n");
    expect(() => compareTextLines(original, changed, { ignoreTrailingWhitespace: false }))
      .toThrow(/Diff output/u);
  });
});
