import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "../../../app/api/tools/redirect-map/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/redirect-map", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const validPayload = {
  contract_version: "webdiag.tool.redirect_map_validator.v1",
  generated_at: "2026-07-22T00:00:00Z",
  scan_mode: "explicit_map_bounded_safe_fetch",
  entry_count: 1,
  checked_count: 1,
  matched_count: 1,
  mismatch_count: 0,
  failed_count: 0,
  duplicate_source_count: 0,
  conflicting_source_count: 0,
  self_redirect_count: 0,
  chain_source_count: 0,
  cycle_count: 0,
  issue_count: 0,
  entries: [{
    position: 1,
    source_url: "https://example.com/old",
    target_url: "https://example.com/new",
    expected_status_code: 301,
    normalized_source_url: "https://example.com/old",
    normalized_target_url: "https://example.com/new",
    fetch_state: "ok",
    observed_first_status_code: 301,
    observed_first_target_url: "https://example.com/new",
    final_url: "https://example.com/new",
    redirect_count: 1,
    target_matches: true,
    status_matches: true,
    issues: [],
    status: "pass",
  }],
  findings: [],
  status: "pass",
  recommendation: "OK",
};

describe("redirect map proxy route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards only normalized allowlisted entries", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        entries: [{
          source_url: "https://example.com/old",
          target_url: "https://example.com/new",
          expected_status_code: 301,
        }],
      });
      return new Response(JSON.stringify(validPayload), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({
      entries: [{
        source_url: " https://example.com/old ",
        target_url: "https://example.com/new",
        expected_status_code: 301,
        headers: { host: "127.0.0.1" },
      }],
      extra: "ignored",
    }));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid row counts, URLs, and status values before backend calls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await POST(request({ entries: [] }))).status).toBe(400);
    expect((await POST(request({ entries: [{
      source_url: "file:///tmp/a",
      target_url: "https://example.com/b",
    }] }))).status).toBe(400);
    expect((await POST(request({ entries: [{
      source_url: "https://example.com/a",
      target_url: "https://example.com/b",
      expected_status_code: 304,
    }] }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid successful upstream contracts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "wrong",
    }), { status: 200 })));
    const response = await POST(request({ entries: [{
      source_url: "https://example.com/a",
      target_url: "https://example.com/b",
    }] }));
    expect(response.status).toBe(502);
    expect((await response.json()).detail.code).toBe("tool_api_invalid_response");
  });

  it("preserves structured backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      detail: { code: "tool_fetch_failed", message: "Fetch failed." },
    }), { status: 502 })));
    const response = await POST(request({ entries: [{
      source_url: "https://example.com/a",
      target_url: "https://example.com/b",
    }] }));
    expect(response.status).toBe(502);
    expect((await response.json()).detail.code).toBe("tool_fetch_failed");
  });
});
