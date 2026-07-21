import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "../../../app/api/tools/security-headers/route";

const validToolResult = {
  contract_version: "webdiag.tool.security_headers.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  is_https: true,
  redirect_count: 0,
  score: 100,
  risk_level: "low",
  present_count: 6,
  missing_count: 0,
  checks: [
    {
      id: "hsts",
      header: "Strict-Transport-Security",
      title: "HTTPS transport policy",
      value: "max-age=31536000",
      present: true,
      status: "pass",
      severity: "info",
      recommendation: "HSTS is present.",
    },
  ],
  recommendation: "Security headers are present.",
};

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/security-headers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("security headers proxy route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects request bodies without a URL string", async () => {
    const response = await POST(request({ url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } });
  });

  it("proxies valid tool API results", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ url: "https://example.com/" }));
      return new Response(JSON.stringify(validToolResult), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    const response = await POST(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toMatchObject({ contract_version: "webdiag.tool.security_headers.v1", score: 100 });
  });

  it("preserves normalized backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } }), { status: 400, headers: { "content-type": "application/json" } })));

    const response = await POST(request({ url: "http://127.0.0.1/" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } });
  });

  it("maps invalid successful tool API contracts to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...validToolResult, contract_version: "raw" }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await POST(request({ url: "https://example.com/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid security headers result." } });
  });
});
