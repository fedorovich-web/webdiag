import { describe, expect, it } from "vitest";
import {
  createSchemaMarkup,
  isHtmlMarkupValidatorResponse,
  isStructuredDataValidatorResponse,
  type HtmlMarkupValidatorResponse,
  type StructuredDataValidatorResponse,
} from "./markup-tool-contract";

const structuredData: StructuredDataValidatorResponse = {
  contract_version: "webdiag.tool.structured_data.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  json_ld_count: 1,
  valid_json_ld_count: 1,
  invalid_json_ld_count: 0,
  detected_types: [{ type: "Organization", count: 1 }],
  blocks: [{ index: 1, valid: true, types: ["Organization"], node_count: 1, error: null }],
  recommendation: "OK",
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
  duplicate_id_count: 0,
  unexpected_end_tag_count: 0,
  unclosed_tag_count: 0,
  checks: [{ id: "doctype", title: "Doctype", status: "pass", severity: "info", message: "OK", recommendation: "No action required." }],
  recommendation: "OK",
};

describe("markup tool contracts", () => {
  it("validates structured data and HTML markup contracts", () => {
    expect(isStructuredDataValidatorResponse(structuredData)).toBe(true);
    expect(isHtmlMarkupValidatorResponse(htmlMarkup)).toBe(true);
    expect(isStructuredDataValidatorResponse({ ...structuredData, contract_version: "raw" })).toBe(false);
    expect(isHtmlMarkupValidatorResponse({ ...htmlMarkup, doctype_present: "yes" })).toBe(false);
  });

  it("generates supported Schema.org JSON-LD templates without inventing extra facts", () => {
    const organization = createSchemaMarkup({
      kind: "Organization",
      name: "WebDiag",
      url: "https://example.com/",
      description: "Technical audit tools.",
      telephone: "+7 000 000-00-00",
      address: "Moscow",
    });
    expect(organization).toContain('"@type": "Organization"');
    expect(organization).toContain('"name": "WebDiag"');
    expect(organization).not.toContain("telephone");

    const faq = createSchemaMarkup({ kind: "FAQPage", name: "Question?", url: "https://example.com/", description: "Answer.", telephone: "", address: "" });
    expect(faq).toContain('"@type": "FAQPage"');
    expect(faq).toContain('"acceptedAnswer"');
  });
});
