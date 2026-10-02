import { describe, expect, it } from "vitest";
import { queryJsonPath } from "./structured-text-workbench";

describe("RFC 9535 JSONPath filter selector syntax", () => {
  const catalog = JSON.stringify({
    store: {
      book: [
        { title: "One", price: 8, tags: ["seo", "web"] },
        { title: "Two", price: 12, tags: ["dns"] },
      ],
    },
  });

  it("does not require the filter expression to be parenthesized", () => {
    expect(queryJsonPath(catalog, "$.store.book[?@.price < 10].title").matches[0]?.value).toBe("One");
    expect(queryJsonPath(catalog, "$.store.book[?@.tags].title").matchCount).toBe(2);

    expect(queryJsonPath(catalog, "$.store.book[?(@.price < 10)].title").matches[0]?.value).toBe("One");
  });
});
