import { describe, expect, it } from "vitest";
import {
  isMetaTagsResponse,
  isSerpPreviewResponse,
  isSocialPreviewResponse,
  metadataCheckStatusLabel,
  normalizeMetadataToolUrlInput,
  parseMetadataToolUrlInput,
} from "./metadata-tool-contract";

const metaTags = {
  contract_version: "webdiag.tool.meta_tags.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  title: "Example title",
  title_length: 13,
  meta_description: "Example description for a search snippet.",
  meta_description_length: 41,
  canonical_url: "https://example.com/",
  resolved_canonical_url: "https://example.com/",
  robots_directives: [{ name: "robots", content: "index, follow" }],
  h1_count: 1,
  open_graph_count: 3,
  twitter_card_count: 2,
  json_ld_count: 1,
  checks: [{ id: "title", title: "Title", status: "pass", severity: "info", value: "13 characters", recommendation: "OK" }],
  recommendation: "OK",
} as const;

const serp = {
  contract_version: "webdiag.tool.serp_preview.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  display_url: "example.com/",
  preview_title: "Example title",
  preview_description: "Example description for a search snippet.",
  title_source: "title",
  description_source: "meta_description",
  title_length: 13,
  description_length: 41,
  checks: [{ id: "title", status: "pass", message: "OK" }],
  recommendation: "OK",
} as const;

const social = {
  contract_version: "webdiag.tool.social_preview.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  open_graph: { title: "OG", description: "Description", image: "https://example.com/og.png", url: "https://example.com/", card_type: "website", site_name: null, missing_fields: [], complete: true },
  twitter: { title: "TW", description: "Description", image: "https://example.com/tw.png", url: "https://example.com/", card_type: "summary_large_image", site_name: "@site", missing_fields: [], complete: true },
  fallback_title: "Example title",
  fallback_description: "Example description",
  recommendation: "OK",
} as const;

describe("metadata tool contracts", () => {
  it("validates all three metadata tool contracts", () => {
    expect(isMetaTagsResponse(metaTags)).toBe(true);
    expect(isSerpPreviewResponse(serp)).toBe(true);
    expect(isSocialPreviewResponse(social)).toBe(true);
    expect(isMetaTagsResponse({ ...metaTags, contract_version: "raw" })).toBe(false);
    expect(isSerpPreviewResponse({ ...serp, title_source: "unknown" })).toBe(false);
    expect(isSocialPreviewResponse({ ...social, open_graph: { ...social.open_graph, complete: "yes" } })).toBe(false);
  });

  it("normalizes and validates URL input", () => {
    expect(normalizeMetadataToolUrlInput(" example.com ")).toBe("https://example.com");
    expect(parseMetadataToolUrlInput("https://example.com/")?.hostname).toBe("example.com");
    expect(parseMetadataToolUrlInput("ftp://example.com/")).toBeNull();
    expect(parseMetadataToolUrlInput("localhost")).toBeNull();
  });

  it("maps status labels", () => {
    expect(metadataCheckStatusLabel("pass", "ru")).toBe("Ок");
    expect(metadataCheckStatusLabel("warning", "en")).toBe("Review");
    expect(metadataCheckStatusLabel("fail", "ru")).toBe("Проблема");
  });
});
