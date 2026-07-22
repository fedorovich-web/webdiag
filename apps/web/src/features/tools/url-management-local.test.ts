import { describe, expect, it } from "vitest";
import { analyzeQueryParameters, analyzeUrlNormalization } from "./url-management-local";

describe("URL normalization analyzer", () => {
  it("normalizes deterministic syntax without changing routing-sensitive slashes", () => {
    const result = analyzeUrlNormalization(
      " HTTPS://Exämple.com:443/a/../b//%7euser/?q=%2f#Part ",
    );
    expect(result.normalized_url).toBe(
      "https://xn--exmple-cua.com/b//~user/?q=%2F#Part",
    );
    expect(result.request_url).toBe(
      "https://xn--exmple-cua.com/b//~user/?q=%2F",
    );
    expect(result.status).toBe("warning");
    expect(result.changes.map((item) => item.id)).toEqual(expect.arrayContaining([
      "trimmed-whitespace",
      "scheme-case",
      "hostname-case",
      "default-port",
      "idn-ascii",
      "dot-segments",
      "percent-encoding",
      "fragment-not-requested",
      "duplicate-path-slashes",
      "trailing-slash",
      "query-order",
    ]));
  });

  it("rejects non-HTTP URLs and credentials", () => {
    expect(() => analyzeUrlNormalization("file:///tmp/page.html")).toThrow();
    expect(() => analyzeUrlNormalization("https://user:pass@example.com/")).toThrow();
  });
});

describe("query parameter analyzer", () => {
  it("classifies transparent parameter-name patterns and preserves a tracking-free candidate", () => {
    const result = analyzeQueryParameters(
      "https://example.com/catalog?page=2&utm_source=mail&sort=price&filter_brand=Acme&q=shoes",
    );
    expect(result.pair_count).toBe(5);
    expect(result.tracking_parameter_count).toBe(1);
    expect(result.pagination_parameter_count).toBe(1);
    expect(result.sorting_parameter_count).toBe(1);
    expect(result.filtering_parameter_count).toBe(1);
    expect(result.search_parameter_count).toBe(1);
    expect(result.tracking_removed_candidate).toBe(
      "https://example.com/catalog?page=2&sort=price&filter_brand=Acme&q=shoes",
    );
  });

  it("reports duplicate, case-variant, blank, and sensitive-looking names", () => {
    const result = analyzeQueryParameters(
      "https://example.com/?id=1&id=2&ID=3&token=abc&empty=&=value",
    );
    expect(result.duplicate_name_count).toBe(1);
    expect(result.case_variant_group_count).toBe(1);
    expect(result.sensitive_name_count).toBe(1);
    expect(result.blank_name_count).toBe(1);
    expect(result.blank_value_count).toBe(1);
    expect(result.status).toBe("warning");
  });

  it("bounds query pairs", () => {
    const query = Array.from({ length: 201 }, (_, index) => `p${index}=1`).join("&");
    expect(() => analyzeQueryParameters(`https://example.com/?${query}`)).toThrow(
      "A maximum of 200 query parameter pairs is supported.",
    );
  });
});
