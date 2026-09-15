import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  accountAIRunPath,
  proxyAccountAI,
  selectAIIdempotencyKey,
} from "./account-ai-proxy";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("account AI proxy boundary", () => {
  it("accepts only bounded printable idempotency keys and UUID run paths", () => {
    expect(selectAIIdempotencyKey("550e8400-e29b-41d4-a716-446655440000"))
      .toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(selectAIIdempotencyKey(" too-short ")).toBeNull();
    expect(selectAIIdempotencyKey("line\nbreak-value")).toBeNull();
    expect(selectAIIdempotencyKey("x".repeat(129))).toBeNull();
    expect(accountAIRunPath("11111111-1111-4111-8111-111111111111"))
      .toBe("/v1/account/ai/runs/11111111-1111-4111-8111-111111111111");
    expect(accountAIRunPath("../credits")).toBeNull();
  });

  it("rejects oversized request bodies before contacting the API", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const request = new NextRequest("http://localhost/api/account/ai/runs", {
      method: "POST",
      headers: { "idempotency-key": "550e8400-e29b-41d4-a716-446655440000" },
      body: "x".repeat(300_001),
    });

    const response = await proxyAccountAI(request, {
      method: "POST",
      path: "/v1/account/ai/runs",
      body: true,
      requireIdempotencyKey: true,
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      detail: { code: "account_request_too_large", message: "Request body is too large." },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("forwards only the account cookie and validated idempotency key", async () => {
    let upstreamUrl = "";
    let upstreamInit: RequestInit | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      upstreamUrl = String(input);
      upstreamInit = init;
      return Response.json({ contract_version: "webdiag.ai.run.v1", run: null }, { status: 201 });
    }));
    const request = new NextRequest("http://localhost/api/account/ai/runs", {
      method: "POST",
      headers: {
        cookie: "analytics=1; webdiag_session=session-secret; theme=dark",
        "content-type": "application/json",
        "idempotency-key": "550e8400-e29b-41d4-a716-446655440000",
        "x-browser-secret": "must-not-forward",
      },
      body: JSON.stringify({ tool_id: "ai_audit_action_plan", input: {} }),
    });

    const response = await proxyAccountAI(request, {
      method: "POST",
      path: "/v1/account/ai/runs",
      body: true,
      requireIdempotencyKey: true,
    });

    const headers = new Headers(upstreamInit?.headers);
    expect(response.status).toBe(201);
    expect(upstreamUrl).toBe("http://127.0.0.1:8000/v1/account/ai/runs");
    expect(headers.get("cookie")).toBe("webdiag_session=session-secret");
    expect(headers.get("idempotency-key")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(headers.get("x-browser-secret")).toBeNull();
    expect(upstreamInit?.cache).toBe("no-store");
  });

  it("rejects a missing idempotency key without forwarding the request", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const request = new NextRequest("http://localhost/api/account/ai/runs", {
      method: "POST",
      body: "{}",
    });

    const response = await proxyAccountAI(request, {
      method: "POST",
      path: "/v1/account/ai/runs",
      body: true,
      requireIdempotencyKey: true,
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      detail: { code: "ai_invalid_idempotency_key", message: "Invalid idempotency key." },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps invalid JSON, unavailable API, and ambiguous timeout to stable errors", async () => {
    const request = new NextRequest("http://localhost/api/account/ai/catalog");
    const options = { method: "GET", path: "/v1/account/ai/catalog" } as const;

    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 200 })));
    const invalid = await proxyAccountAI(request, options);
    expect(invalid.status).toBe(502);
    expect(await invalid.json()).toEqual({
      detail: { code: "account_api_invalid_response", message: "Account API returned invalid JSON." },
    });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("private network detail"); }));
    const unavailable = await proxyAccountAI(request, options);
    expect(unavailable.status).toBe(502);
    expect(await unavailable.json()).toEqual({
      detail: { code: "account_api_unavailable", message: "Account API is unavailable." },
    });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("aborted", "AbortError"); }));
    const timeout = await proxyAccountAI(request, options);
    expect(timeout.status).toBe(502);
    expect(await timeout.json()).toEqual({
      detail: { code: "account_api_timeout", message: "Account API request timed out." },
    });
  });
});
