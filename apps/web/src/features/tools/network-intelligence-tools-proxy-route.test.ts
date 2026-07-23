import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as dnsPost } from "../../../app/api/tools/dns-resolver-comparison/route";
import { POST as domainPost } from "../../../app/api/tools/domain-rdap/route";
import { POST as ipPost } from "../../../app/api/tools/ip-rdap/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const domainResponse = {
  contract_version: "webdiag.tool.domain_rdap_lookup.v1",
  generated_at: "2026",
  domain: "example.com",
  found: false,
  bootstrap_source: "iana_rdap_dns_bootstrap",
  rdap_url: null,
  handle: null,
  ldh_name: null,
  unicode_name: null,
  statuses: [],
  events: [],
  nameservers: [],
  registrar_name: null,
  abuse_email: null,
  delegation_signed: null,
  notice_titles: [],
  status: "warning",
  recommendation: "Not proof of availability.",
};

describe("network intelligence proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards only allowlisted DNS comparison fields", async () => {
    const fetchMock = vi.fn(async (
      ..._args: Parameters<typeof fetch>
    ) => new Response(JSON.stringify({
      contract_version: "webdiag.tool.dns_resolver_comparison.v1",
      generated_at: "2026",
      domain: "example.com",
      record_type: "A",
      resolver_count: 4,
      successful_resolver_count: 4,
      distinct_answer_set_count: 1,
      consistent: true,
      timing_scope: "backend_to_resolver",
      snapshots: [],
      status: "pass",
      recommendation: "Snapshot only.",
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await dnsPost(request({ domain: "Example.COM", record_type: "A", extra: "drop" }));
    expect(response.status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      domain: "example.com",
      record_type: "A",
    });
  });

  it("proxies domain RDAP and drops extra fields", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(domainResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await domainPost(request({ domain: "example.com", url: "http://127.0.0.1" }));
    expect(response.status).toBe(200);
  });

  it("rejects malformed IP input before upstream fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await ipPost(request({ ip: "not-an-ip" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid upstream contracts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version: "wrong" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));
    const response = await domainPost(request({ domain: "example.com" }));
    expect(response.status).toBe(502);
  });
});

