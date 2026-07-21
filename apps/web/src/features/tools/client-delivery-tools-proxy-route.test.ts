import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as cspPost } from "../../../app/api/tools/csp/route";
import { POST as hintsPost } from "../../../app/api/tools/resource-hints/route";
import { POST as scriptsPost } from "../../../app/api/tools/third-party-scripts/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const common = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  redirect_count: 0,
  truncated: false,
  status: "pass",
  recommendation: "OK",
};

const cspPayload = {
  ...common,
  contract_version: "webdiag.tool.csp_analyzer.v1",
  enforced_policy_count: 1,
  report_only_policy_count: 0,
  meta_policy_count: 0,
  directive_count: 4,
  finding_count: 0,
  high_risk_finding_count: 0,
  policies: [],
  findings: [],
};

const scriptPayload = {
  ...common,
  contract_version: "webdiag.tool.third_party_script_analyzer.v1",
  scan_mode: "static_html_bounded",
  classification_basis: "hostname",
  script_count: 0,
  inline_script_count: 0,
  external_script_count: 0,
  same_host_script_count: 0,
  cross_host_script_count: 0,
  parser_blocking_candidate_count: 0,
  async_count: 0,
  defer_count: 0,
  module_count: 0,
  nomodule_count: 0,
  integrity_count: 0,
  crossorigin_count: 0,
  duplicate_src_count: 0,
  issue_count: 0,
  scripts: [],
  host_groups: [],
};

const hintsPayload = {
  ...common,
  contract_version: "webdiag.tool.resource_hints_analyzer.v1",
  scan_mode: "static_html_bounded",
  hint_count: 0,
  preconnect_count: 0,
  dns_prefetch_count: 0,
  preload_count: 0,
  prefetch_count: 0,
  modulepreload_count: 0,
  preinit_count: 0,
  cross_host_hint_count: 0,
  duplicate_hint_count: 0,
  finding_count: 0,
  hints: [],
  findings: [],
};

describe("client delivery proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies valid responses for all three analyzers", async () => {
    vi.stubGlobal("fetch", vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(cspPayload), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(scriptPayload), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(hintsPayload), { status: 200 })));

    expect((await cspPost(request({ url: "https://example.com/" }))).status).toBe(200);
    expect((await scriptsPost(request({ url: "https://example.com/" }))).status).toBe(200);
    expect((await hintsPost(request({ url: "https://example.com/" }))).status).toBe(200);
  });

  it("forwards only a normalized URL", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({ url: "https://example.com/path" });
      return new Response(JSON.stringify(cspPayload), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await cspPost(request({
      url: " https://example.com/path ",
      headers: { host: "127.0.0.1" },
      extra: "ignored",
    }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-string URL before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await cspPost(request({ url: 123 }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await hintsPost(request({ url: "file:///tmp/page.html" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid successful upstream contract", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "wrong",
    }), { status: 200 })));

    const response = await scriptsPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(502);
    expect((await response.json()).detail.code).toBe("tool_api_invalid_response");
  });

  it("preserves structured backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      detail: { code: "tool_url_rejected", message: "Target is private." },
    }), { status: 400 })));

    const response = await cspPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(400);
    expect((await response.json()).detail.code).toBe("tool_url_rejected");
  });
});
