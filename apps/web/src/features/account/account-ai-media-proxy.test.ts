import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { proxyAIImageUpload, proxyAIArtifact } from "./account-ai-media-proxy";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
it("rejects anonymous uploads before forwarding binary data", async () => {
  const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
  const response = await proxyAIImageUpload(new NextRequest("https://webdiag.test/api/account/ai/uploads/image", { method: "POST", body: "image", headers: { "content-type": "image/png" } }));
  expect(response.status).toBe(401); expect(upstream).not.toHaveBeenCalled();
});
it("refuses artifact paths injected through resource IDs", async () => {
  const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
  const response = await proxyAIArtifact(new NextRequest("https://webdiag.test/api/account/ai/runs/a/artifacts/b"), "../private", "https://evil.test/a");
  expect(response.status).toBe(400); expect(upstream).not.toHaveBeenCalled();
});
it("forwards only the session and bounded image bytes to the private API", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://127.0.0.1:8000");
  let sent: RequestInit | undefined; let url = "";
  vi.stubGlobal("fetch", async (input: string, init: RequestInit) => { url = input; sent = init; return Response.json({ contract_version: "webdiag.ai.upload.v1" }, { status: 201 }); });
  const response = await proxyAIImageUpload(new NextRequest("https://webdiag.test/api/account/ai/uploads/image", { method: "POST", body: "image", headers: { "content-type": "image/png", cookie: "webdiag_session=opaque-session; unrelated=value", "x-user-id": "another-owner" } }));
  expect(response.status).toBe(201); expect(url).toBe("http://127.0.0.1:8000/v1/account/ai/uploads/image");
  expect(new Headers(sent?.headers).get("cookie")).toBe("webdiag_session=opaque-session");
  expect(new Headers(sent?.headers).get("x-user-id")).toBeNull();
  expect(sent?.redirect).toBe("error"); expect(new TextDecoder().decode(sent?.body as Uint8Array)).toBe("image");
});
it("bounds image responses and serves them only through the owner route", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://127.0.0.1:8000");
  const upstream = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } })); vi.stubGlobal("fetch", upstream);
  const request = new NextRequest("https://webdiag.test/api/account/ai/runs/a/artifacts/b", { headers: { cookie: "webdiag_session=opaque-session" } });
  const response = await proxyAIArtifact(request, "11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222");
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("content-disposition")).toContain("attachment"); expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
});
it("rejects uploads above the bound even without content length", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://127.0.0.1:8000");
  const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
  const response = await proxyAIImageUpload(new NextRequest("https://webdiag.test/api/account/ai/uploads/image", { method: "POST", body: new Uint8Array(4194305), headers: { "content-type": "image/png", cookie: "webdiag_session=opaque-session" } }));
  expect(response.status).toBe(413); expect(upstream).not.toHaveBeenCalled();
});
it("rejects a foreign-origin upload before reading the body or forwarding", async () => {
  const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
  const response = await proxyAIImageUpload(new NextRequest("https://webdiag.test/api/account/ai/uploads/image", {
    method: "POST", body: "image", headers: { "content-type": "image/png", cookie: "webdiag_session=opaque-session", origin: "https://foreign.test" },
  }));
  expect(response.status).toBe(403); expect(upstream).not.toHaveBeenCalled();
});
it("cancels a stalled upload reader when the request deadline expires", async () => {
  vi.useFakeTimers(); vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://127.0.0.1:8000");
  const upstream = vi.fn(async () => Response.json({})); vi.stubGlobal("fetch", upstream);
  let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined;
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({ start(controller) { bodyController = controller; }, cancel });
  const requestOptions: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {
    method: "POST", body, duplex: "half", headers: { "content-type": "image/png", cookie: "webdiag_session=opaque-session" },
  };
  const request = new NextRequest("https://webdiag.test/api/account/ai/uploads/image", requestOptions);
  let settled = false;
  const responsePromise = proxyAIImageUpload(request).then((response) => { settled = true; return response; });
  try {
    await vi.advanceTimersByTimeAsync(12001);
    expect(settled).toBe(true);
    const response = await responsePromise;
    expect(response.status).toBe(408);
    expect(await response.json()).toMatchObject({ detail: { code: "account_api_timeout" } });
    expect(cancel).toHaveBeenCalled(); expect(upstream).not.toHaveBeenCalled();
  } finally {
    if (!settled) { bodyController?.close(); await responsePromise; }
  }
});
