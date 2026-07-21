import { describe, expect, it } from "vitest";
import { isBrokenImageCheckerResponse, isBrokenLinkCheckerResponse, isLinkAnalyzerResponse, parseLinkToolUrlInput } from "./link-health-tool-contract";
describe("link health tool contract", () => {
  it("validates link health response contracts", () => {
    expect(isLinkAnalyzerResponse({ contract_version:"webdiag.tool.link_analyzer.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_links:0, unique_http_links:0, internal_count:0, external_count:0, same_page_count:0, mailto_tel_count:0, non_http_count:0, nofollow_count:0, sponsored_count:0, ugc_count:0, target_blank_missing_noopener_count:0, sample_links:[], recommendation:"OK" })).toBe(true);
    expect(isBrokenLinkCheckerResponse({ contract_version:"webdiag.tool.broken_link_checker.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", discovered_link_count:0, checked_link_count:0, broken_link_count:0, redirecting_link_count:0, skipped_non_http_count:0, items:[], recommendation:"OK" })).toBe(true);
    expect(isBrokenImageCheckerResponse({ contract_version:"webdiag.tool.broken_image_checker.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", discovered_image_count:0, checked_image_count:0, broken_image_count:0, redirecting_image_count:0, items:[], recommendation:"OK" })).toBe(true);
  });
  it("accepts only http and https URLs", () => {
    expect(parseLinkToolUrlInput("https://example.com/")?.hostname).toBe("example.com");
    expect(parseLinkToolUrlInput("mailto:test@example.com")).toBeNull();
  });
});
