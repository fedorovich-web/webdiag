import { describe, expect, it } from "vitest";
import { metaTagsResultText, metadataStatusTone, serpPreviewResultText, socialPreviewResultText } from "./metadata-preview-tools";
import type { MetaTagsResponse, SerpPreviewResponse, SocialPreviewResponse } from "./metadata-tool-contract";

const metaTags: MetaTagsResponse = {
  contract_version: "webdiag.tool.meta_tags.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  title: "Example title",
  title_length: 13,
  meta_description: "Example description",
  meta_description_length: 19,
  canonical_url: "https://example.com/",
  resolved_canonical_url: "https://example.com/",
  robots_directives: [],
  h1_count: 1,
  open_graph_count: 4,
  twitter_card_count: 3,
  json_ld_count: 1,
  checks: [{ id: "title", title: "Title", status: "pass", severity: "info", value: "13", recommendation: "OK" }],
  recommendation: "OK",
};

const serp: SerpPreviewResponse = {
  contract_version: "webdiag.tool.serp_preview.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  display_url: "example.com/",
  preview_title: "Example title",
  preview_description: "Example description",
  title_source: "title",
  description_source: "meta_description",
  title_length: 13,
  description_length: 19,
  checks: [{ id: "title", status: "pass", message: "OK" }],
  recommendation: "OK",
};

const social: SocialPreviewResponse = {
  contract_version: "webdiag.tool.social_preview.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  open_graph: { title: "OG", description: "OG description", image: "https://example.com/og.png", url: "https://example.com/", card_type: "website", site_name: null, missing_fields: [], complete: true },
  twitter: { title: "TW", description: "TW description", image: "https://example.com/tw.png", url: "https://example.com/", card_type: "summary_large_image", site_name: null, missing_fields: [], complete: true },
  fallback_title: "Example title",
  fallback_description: "Example description",
  recommendation: "OK",
};

describe("metadata preview tool helpers", () => {
  it("maps status tone", () => {
    expect(metadataStatusTone("pass")).toBe("success");
    expect(metadataStatusTone("warning")).toBe("warning");
    expect(metadataStatusTone("fail")).toBe("danger");
  });

  it("formats copyable outputs", () => {
    expect(metaTagsResultText(metaTags)).toContain("Title length: 13");
    expect(serpPreviewResultText(serp)).toContain("Display URL: example.com/");
    expect(socialPreviewResultText(social)).toContain("Twitter/X card: summary_large_image");
  });
});
