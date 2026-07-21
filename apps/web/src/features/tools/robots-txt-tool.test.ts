import { describe, expect, it } from "vitest";
import { isRobotsTxtToolResponse, normalizeRobotsToolUrlInput, parseRobotsToolUrlInput, robotsAccessLabel, robotsAccessTone, robotsResultText } from "./robots-txt-tool";

const result = {
  contract_version: "webdiag.tool.robots_txt.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/private/page",
  target_url: "https://example.com/private/page",
  target_path: "/private/page",
  robots_url: "https://example.com/robots.txt",
  user_agent: "WebDiagBot",
  status_code: 200,
  available: true,
  allows_target: false,
  matched_allow_rule: null,
  matched_disallow_rule: "/private",
  disallow_count: 1,
  disallow_rules: [{ user_agent: "*", directive: "disallow", value: "/private" }],
  sitemap_count: 1,
  sitemap_urls: [{ url: "https://example.com/sitemap.xml" }],
  recommendation: "The tested URL is blocked.",
} as const;

describe("robots.txt tool helpers", () => {
  it("normalizes URL input and rejects unsupported values", () => {
    expect(normalizeRobotsToolUrlInput(" example.com/catalog ")).toBe("https://example.com/catalog");
    expect(parseRobotsToolUrlInput("https://example.com/")?.hostname).toBe("example.com");
    expect(parseRobotsToolUrlInput("ftp://example.com/")).toBeNull();
    expect(parseRobotsToolUrlInput("localhost")).toBeNull();
  });

  it("validates the robots.txt tool response contract", () => {
    expect(isRobotsTxtToolResponse(result)).toBe(true);
    expect(isRobotsTxtToolResponse({ ...result, contract_version: "raw" })).toBe(false);
    expect(isRobotsTxtToolResponse({ ...result, disallow_rules: [{ user_agent: "*", directive: "crawl-delay", value: "1" }] })).toBe(false);
  });

  it("maps access state to labels and tones", () => {
    expect(robotsAccessTone(result)).toBe("danger");
    expect(robotsAccessLabel(result, "ru")).toBe("URL закрыт");
    expect(robotsAccessTone({ available: true, allows_target: true })).toBe("success");
    expect(robotsAccessTone({ available: false, allows_target: null })).toBe("warning");
  });

  it("creates copyable text output from a result", () => {
    expect(robotsResultText(result)).toContain("robots.txt: https://example.com/robots.txt");
    expect(robotsResultText(result)).toContain("Matched rule: /private");
    expect(robotsResultText(result)).toContain("https://example.com/sitemap.xml");
  });
});
