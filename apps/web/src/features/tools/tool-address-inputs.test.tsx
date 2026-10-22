import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToolRenderer } from "./tool-renderer";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

const addressTools = [
  "single-page-audit", "canonical-checker", "redirect-chain-checker", "robots-txt-tester",
  "sitemap-validator", "security-headers-checker", "meta-tags-checker", "serp-preview",
  "open-graph-preview", "structured-data-validator", "html-validator", "core-web-vitals-checker",
  "cache-policy-checker", "page-weight-analyzer", "resource-waterfall-analyzer",
  "render-blocking-resources-checker", "image-performance-checker", "image-seo-audit",
  "favicon-checker", "link-analyzer", "broken-link-checker", "broken-image-checker",
  "heading-structure-checker", "keyword-density-analyzer", "readability-analyzer",
  "indexability-checker", "hreflang-checker", "technology-detector", "dns-lookup",
  "mx-record-checker", "spf-checker", "dkim-checker", "dmarc-checker", "dnssec-checker",
  "dns-propagation-checker", "whois-lookup", "ssl-certificate-checker", "tls-configuration-checker",
  "http-compression-checker", "http-headers-analyzer", "http-protocol-checker", "cors-checker",
  "server-timing-analyzer", "cookie-policy-checker", "mixed-content-checker", "csp-analyzer",
  "third-party-script-analyzer", "resource-hints-analyzer", "javascript-bundle-surface-analyzer",
  "css-delivery-analyzer", "font-performance-checker", "query-parameter-analyzer",
  "url-normalization-analyzer", "landmark-structure-analyzer", "form-accessibility-analyzer",
  "interactive-accessible-name-analyzer", "robots-txt-generator", "faq-schema-generator",
  "sitemap-generator", "bulk-http-status-checker", "redirect-map-validator",
] as const;

describe("tool address inputs", () => {
  for (const locale of ["ru", "en"] as const) {
    it(`${locale} keeps example addresses in placeholders and starts with empty address fields`, () => {
      for (const slug of addressTools) {
        const markup = renderToStaticMarkup(<ToolRenderer slug={slug} locale={locale} />);
        const controls = [...markup.matchAll(/<input\b[^>]*>|<textarea\b[^>]*>[\s\S]*?<\/textarea>/g)]
          .map(([control]) => control);
        const examples = controls.filter((control) => /placeholder="[^"]*(?:example\.(?:com|ru)|Exämple\.com)/i.test(control));
        expect(examples.length, `${slug}: show an address example`).toBeGreaterThan(0);
        for (const control of examples) {
          if (control.startsWith("<textarea")) {
            expect(control.replace(/^[^>]*>|<\/textarea>$/g, ""), slug).toBe("");
          } else {
            expect(control.match(/\bvalue="([^"]*)"/)?.[1] ?? "", slug).toBe("");
          }
        }
      }
    });
  }
});
