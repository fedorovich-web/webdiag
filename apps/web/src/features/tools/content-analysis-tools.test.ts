import { describe, expect, it } from "vitest";
import { headingStructureResultText, keywordFrequencyResultText, readabilityResultText } from "./content-analysis-tools";
describe("content analysis presenters", () => {
  it("formats content analysis summaries", () => {
    expect(headingStructureResultText({ contract_version:"webdiag.tool.heading_structure.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_headings:3, h1_count:1, skipped_level_count:1, empty_heading_count:0, outline:[], checks:[], recommendation:"Fix hierarchy." })).toContain("H1 count: 1");
    expect(keywordFrequencyResultText({ contract_version:"webdiag.tool.keyword_frequency.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_words:200, unique_terms:90, top_words:[], top_bigrams:[], top_trigrams:[], overused_terms:[], recommendation:"Balanced." })).toContain("Total words: 200");
    expect(readabilityResultText({ contract_version:"webdiag.tool.readability.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", formula_scope:"multilingual_heuristic", word_count:300, sentence_count:20, paragraph_count:5, long_sentence_count:2, estimated_reading_time_minutes:1, readability_score:82, metrics:[], recommendation:"OK" })).toContain("Readability score: 82");
  });
});
