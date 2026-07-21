import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as dnsPost } from "../../../app/api/tools/dns-lookup/route";
import { POST as mxPost } from "../../../app/api/tools/mx-records/route";
import { POST as spfPost } from "../../../app/api/tools/spf/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("network DNS proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies valid DNS lookup responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.dns_lookup.v1",
      generated_at: "2026",
      domain: "example.com",
      checked_record_types: ["A"],
      record_count: 1,
      records: [],
      errors: [],
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await dnsPost(request({ domain: "example.com" }));
    expect(response.status).toBe(200);
  });

  it("rejects invalid MX upstream payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "wrong",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await mxPost(request({ domain: "example.com" }));
    expect(response.status).toBe(502);
  });

  it("proxies valid SPF responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.spf_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      spf_record_count: 1,
      spf_record: "v=spf1 -all",
      mechanisms: [],
      has_all_mechanism: true,
      all_mechanism: "-all",
      uses_include: false,
      uses_redirect: false,
      estimated_dns_lookup_mechanisms: 0,
      status: "pass",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await spfPost(request({ domain: "example.com" }));
    expect(response.status).toBe(200);
  });
});
