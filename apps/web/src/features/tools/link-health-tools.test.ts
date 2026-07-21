import { describe, expect, it } from "vitest";
import { brokenImageResultText, brokenLinkResultText, linkAnalyzerResultText } from "./link-health-tools";
describe("link health presenters", () => {
  it("formats link health result summaries", () => {
    expect(linkAnalyzerResultText({ contract_version:"webdiag.tool.link_analyzer.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_links:2, unique_http_links:2, internal_count:1, external_count:1, same_page_count:0, mailto_tel_count:0, non_http_count:0, nofollow_count:0, sponsored_count:0, ugc_count:0, target_blank_missing_noopener_count:1, sample_links:[], recommendation:"Add noopener." })).toContain("Total links: 2");
    expect(brokenLinkResultText({ contract_version:"webdiag.tool.broken_link_checker.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", discovered_link_count:1, checked_link_count:1, broken_link_count:1, redirecting_link_count:0, skipped_non_http_count:0, items:[], recommendation:"Fix." })).toContain("Broken links: 1");
    expect(brokenImageResultText({ contract_version:"webdiag.tool.broken_image_checker.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", discovered_image_count:1, checked_image_count:1, broken_image_count:1, redirecting_image_count:0, items:[], recommendation:"Fix." })).toContain("Broken images: 1");
  });
});
