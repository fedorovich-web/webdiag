import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as brokenImagesPost } from "../../../app/api/tools/broken-images/route";
import { POST as linkAnalyzerPost } from "../../../app/api/tools/link-analyzer/route";
function request(body: unknown): NextRequest { return new Request("http://localhost/api/tools/test", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) }) as NextRequest; }
describe("link health proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("proxies valid link analyzer responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version:"webdiag.tool.link_analyzer.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_links:0, unique_http_links:0, internal_count:0, external_count:0, same_page_count:0, mailto_tel_count:0, non_http_count:0, nofollow_count:0, sponsored_count:0, ugc_count:0, target_blank_missing_noopener_count:0, sample_links:[], recommendation:"OK" }), { status:200, headers:{"content-type":"application/json"} })));
    const response = await linkAnalyzerPost(request({ url:"https://example.com/" }));
    expect(response.status).toBe(200);
  });
  it("rejects invalid broken image upstream payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version:"wrong" }), { status:200, headers:{"content-type":"application/json"} })));
    const response = await brokenImagesPost(request({ url:"https://example.com/" }));
    expect(response.status).toBe(502);
  });
});
