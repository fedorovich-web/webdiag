import { describe, expect, it } from "vitest";
import { htmlMarkupResultText, markupStatusTone, structuredDataResultText } from "./markup-tools";
import type { HtmlMarkupValidatorResponse, StructuredDataValidatorResponse } from "./markup-tool-contract";

const structuredData: StructuredDataValidatorResponse = {
  contract_version: "webdiag.tool.structured_data.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  json_ld_count: 2,
  valid_json_ld_count: 1,
  invalid_json_ld_count: 1,
  detected_types: [{ type: "Product", count: 1 }],
  blocks: [
    { index: 1, valid: true, types: ["Product"], node_count: 1, error: null },
    { index: 2, valid: false, types: [], node_count: 0, error: "line 1" },
  ],
  recommendation: "Fix invalid JSON-LD blocks.",
};

const htmlMarkup: HtmlMarkupValidatorResponse = {
  contract_version: "webdiag.tool.html_markup.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  doctype_present: true,
  html_tag_present: true,
  head_tag_present: true,
  body_tag_present: true,
  html_lang: "ru",
  title: "Example",
  viewport_present: true,
  duplicate_id_count: 1,
  unexpected_end_tag_count: 0,
  unclosed_tag_count: 0,
  checks: [{ id: "duplicate-ids", title: "Duplicate IDs", status: "fail", severity: "medium", message: "Duplicate IDs: content", recommendation: "Make id attributes unique." }],
  recommendation: "Fix high-impact HTML structure problems first.",
};

describe("markup tool helpers", () => {
  it("maps status tones", () => {
    expect(markupStatusTone("pass")).toBe("success");
    expect(markupStatusTone("warning")).toBe("warning");
    expect(markupStatusTone("fail")).toBe("danger");
  });

  it("formats copyable outputs", () => {
    expect(structuredDataResultText(structuredData)).toContain("JSON-LD blocks: 2");
    expect(structuredDataResultText(structuredData)).toContain("Product (1)");
    expect(htmlMarkupResultText(htmlMarkup)).toContain("Duplicate IDs: 1");
    expect(htmlMarkupResultText(htmlMarkup)).toContain("Duplicate IDs: fail");
  });
});
