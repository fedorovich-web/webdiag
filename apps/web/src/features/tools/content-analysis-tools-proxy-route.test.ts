import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as headingPost } from "../../../app/api/tools/heading-structure/route";
import { POST as readabilityPost } from "../../../app/api/tools/readability/route";
function request(body: unknown): NextRequest { return new Request("http://localhost/api/tools/test", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) }) as NextRequest; }
describe("content analysis proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("proxies valid heading structure responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version:"webdiag.tool.heading_structure.v1", generated_at:"2026", requested_url:"https://example.com/", final_url:"https://example.com/", status_code:200, scan_mode:"static_html_bounded", total_headings:1, h1_count:1, skipped_level_count:0, empty_heading_count:0, outline:[], checks:[], recommendation:"OK" }), { status:200, headers:{"content-type":"application/json"} })));
    const response = await headingPost(request({ url:"https://example.com/" }));
    expect(response.status).toBe(200);
  });
  it("rejects invalid readability upstream payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version:"wrong" }), { status:200, headers:{"content-type":"application/json"} })));
    const response = await readabilityPost(request({ url:"https://example.com/" }));
    expect(response.status).toBe(502);
  });
});
