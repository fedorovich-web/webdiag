import { describe, expect, it } from "vitest";
import { AuditClientError, normalizeAuditUrlInput, parseAuditUrlInput, startAuditSnapshot } from "./audit-client";
import { FRONTEND_AUDIT_RESULT_CONTRACT_VERSION, type AuditFrontendResult } from "./audit-contract";

const validFrontendResult: AuditFrontendResult = {
  contractVersion: FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
  sourceContractVersion: "webdiag.audit.snapshot.v1",
  generatedAt: "2026-07-20T00:00:00Z",
  job: {
    id: "00000000-0000-0000-0000-000000000000",
    status: "succeeded",
    target: { originalUrl: "https://example.ru/", normalizedUrl: "https://example.ru/", hostname: "example.ru", scope: "single_url" },
  },
  summary: {
    status: "succeeded",
    score: 100,
    checkCount: 1,
    issueCount: 0,
    checksByStatus: { passed: 1 },
    issuesBySeverity: {},
    issuesByPriority: {},
    highestSeverity: null,
    topPriority: null,
  },
  run: {
    id: "11111111-1111-1111-1111-111111111111",
    status: "succeeded",
    score: 100,
    checks: [{ id: "http.status", name: "HTTP status", category: "technical", status: "passed" }],
    issues: [],
  },
};

describe("home audit client", () => {
  it("normalizes user URL input without changing explicit schemes", () => {
    expect(normalizeAuditUrlInput(" example.ru/page ")).toBe("https://example.ru/page");
    expect(normalizeAuditUrlInput("http://example.ru")).toBe("http://example.ru");
    expect(normalizeAuditUrlInput("https://example.ru")).toBe("https://example.ru");
  });

  it("rejects empty, non-http, and suffixless host input", () => {
    expect(parseAuditUrlInput("")).toBeNull();
    expect(parseAuditUrlInput("localhost")).toBeNull();
    expect(parseAuditUrlInput("ftp://example.ru")).toBeNull();
  });

  it("posts the normalized URL to the audit proxy", async () => {
    const fetcher = async (input: string, init: RequestInit) => {
      expect(input).toBe("/api/audits");
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ url: "https://example.ru/" }));
      return new Response(JSON.stringify(validFrontendResult), { status: 201, headers: { "content-type": "application/json" } });
    };

    await expect(startAuditSnapshot("https://example.ru/", { fetcher })).resolves.toMatchObject({
      contractVersion: FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
      job: { target: { hostname: "example.ru" } },
      run: { checks: [{ id: "http.status" }] },
    });
  });

  it("maps API detail errors to typed client errors", async () => {
    const fetcher = async () =>
      new Response(
        JSON.stringify({ detail: { code: "audit_url_rejected", message: "Private network targets are blocked." } }),
        { status: 400, headers: { "content-type": "application/json" } },
      );

    await expect(startAuditSnapshot("https://127.0.0.1/", { fetcher })).rejects.toMatchObject({
      name: "AuditClientError",
      status: 400,
      code: "audit_url_rejected",
      message: "Private network targets are blocked.",
    } satisfies Partial<AuditClientError>);
  });

  it("rejects successful responses with invalid frontend result contracts", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ ...validFrontendResult, contractVersion: "unknown" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });

    await expect(startAuditSnapshot("https://example.ru/", { fetcher })).rejects.toMatchObject({
      name: "AuditClientError",
      status: 201,
      code: "invalid_response",
      message: "Audit API returned an invalid response.",
    } satisfies Partial<AuditClientError>);
  });

  it("rejects successful non-JSON responses as invalid responses", async () => {
    const fetcher = async () => new Response("not-json", { status: 201, headers: { "content-type": "text/plain" } });

    await expect(startAuditSnapshot("https://example.ru/", { fetcher })).rejects.toMatchObject({
      name: "AuditClientError",
      status: 201,
      code: "invalid_response",
    } satisfies Partial<AuditClientError>);
  });
});
