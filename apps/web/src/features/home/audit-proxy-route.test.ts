import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../../app/api/audits/route";
import type { NextRequest } from "next/server";
import { FRONTEND_AUDIT_RESULT_CONTRACT_VERSION } from "./audit-contract";

const validBackendSnapshot = {
  contract_version: "webdiag.audit.snapshot.v1",
  generated_at: "2026-07-20T00:00:00Z",
  summary: {
    job_id: "00000000-0000-0000-0000-000000000000",
    status: "succeeded",
    run: {
      status: "succeeded",
      score: 100,
      check_count: 1,
      issue_count: 0,
      checks_by_status: { passed: 1 },
      issues_by_severity: {},
      issues_by_priority: {},
      highest_severity: null,
      top_priority: null,
    },
  },
  job: {
    job_id: "00000000-0000-0000-0000-000000000000",
    status: "succeeded",
    target: { original_url: "https://example.ru/", normalized_url: "https://example.ru/", hostname: "example.ru", scope: "single_url" },
  },
  run: {
    run_id: "11111111-1111-1111-1111-111111111111",
    status: "succeeded",
    score: 100,
    checks: [{ check_id: "http.status", name: "HTTP status", category: "technical", status: "passed" }],
    issues: [],
  },
};

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/audits", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("audit proxy route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects request bodies without a URL string", async () => {
    const response = await POST(request({ url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      detail: { code: "audit_bad_request", message: "Request body must include a URL string." },
    });
  });

  it("projects valid backend snapshots to the frontend audit result contract", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ url: "https://example.ru/" }));
      return new Response(JSON.stringify(validBackendSnapshot), { status: 201, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    const response = await POST(request({ url: "https://example.ru/" }));
    expect(response.status).toBe(201);
    await expect(responseJson(response)).resolves.toMatchObject({
      contractVersion: FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
      sourceContractVersion: "webdiag.audit.snapshot.v1",
      job: { id: "00000000-0000-0000-0000-000000000000", target: { hostname: "example.ru" } },
      summary: { checkCount: 1, issueCount: 0 },
      run: { checks: [{ id: "http.status" }] },
    });
  });

  it("preserves normalized upstream API detail errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ detail: { code: "audit_url_rejected", message: "Private network targets are blocked." } }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const response = await POST(request({ url: "https://127.0.0.1/" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      detail: { code: "audit_url_rejected", message: "Private network targets are blocked." },
    });
  });

  it("maps successful non-JSON upstream responses to invalid contract errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 201, headers: { "content-type": "text/plain" } })));

    const response = await POST(request({ url: "https://example.ru/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({
      detail: { code: "audit_api_invalid_response", message: "Audit API returned invalid JSON." },
    });
  });

  it("maps successful invalid upstream snapshots to invalid contract errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ...validBackendSnapshot, contract_version: "unknown" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const response = await POST(request({ url: "https://example.ru/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({
      detail: { code: "audit_api_invalid_response", message: "Audit API returned an invalid audit snapshot." },
    });
  });
});
