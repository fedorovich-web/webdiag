import { describe, expect, it } from "vitest";
import { isHeadingStructureResponse, isKeywordFrequencyResponse, isReadabilityResponse, parseContentToolUrlInput } from "./content-analysis-tool-contract";
describe("content analysis tool contract", () => {
  it("validates response contracts", () => {
    expect(isHeadingStructureResponse({ contract_version:"webdiag.tool.heading_structure.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_headings:1, h1_count:1, skipped_level_count:0, empty_heading_count:0, outline:[], checks:[], recommendation:"OK" })).toBe(true);
    expect(isKeywordFrequencyResponse({ contract_version:"webdiag.tool.keyword_frequency.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_words:10, unique_terms:8, top_words:[], top_bigrams:[], top_trigrams:[], overused_terms:[], recommendation:"OK" })).toBe(true);
    expect(isReadabilityResponse({ contract_version:"webdiag.tool.readability.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", formula_scope:"multilingual_heuristic", word_count:10, sentence_count:1, paragraph_count:1, long_sentence_count:0, estimated_reading_time_minutes:1, readability_score:90, metrics:[], recommendation:"OK" })).toBe(true);
  });
  it("rejects unsupported URL protocols", () => {
    expect(parseContentToolUrlInput("ftp://example.com/")).toBeNull();
  });
});
