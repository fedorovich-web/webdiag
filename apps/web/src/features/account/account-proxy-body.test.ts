import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxyAccountWorkspace } from "./account-workspace-proxy";
import { proxyAccountAI } from "./account-ai-proxy";
import { proxyAccountReportJson } from "./account-report-proxy";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const proxies = [
  ["workspace", 16_384, (request: NextRequest) => proxyAccountWorkspace(request, { method: "POST", path: "/v1/account/projects", body: true })],
  ["AI", 300_000, (request: NextRequest) => proxyAccountAI(request, { method: "POST", path: "/v1/account/ai/runs", body: true })],
  ["report", 16_384, (request: NextRequest) => proxyAccountReportJson(request, { method: "POST", path: "/v1/account/reports", body: true })],
] as const;

it.each(proxies)("%s rejects mutations from a same-site sibling origin", async (_name, _maximum, proxy) => {
  const fetcher = vi.fn(async () => Response.json({}));
  vi.stubGlobal("fetch", fetcher);
  const request = new NextRequest("https://app.webdiag.test/api/account/projects", {
    method: "POST", headers: { origin: "https://sibling.webdiag.test", "content-type": "text/plain", cookie: "webdiag_session=session" }, body: "{}",
  });
  const response = await proxy(request);
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ detail: { code: "account_cross_origin" } });
  expect(fetcher).not.toHaveBeenCalled();
});

it.each(proxies)("%s stops oversized chunked input before consuming the rest", async (_name, maximum, proxy) => {
  let consumed = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      consumed += 4096;
      controller.enqueue(new Uint8Array(4096));
      if (consumed >= maximum * 4) controller.close();
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const request = new NextRequest("https://webdiag.test/api/account/projects", { method: "POST", body, duplex: "half" } as NonNullable<ConstructorParameters<typeof NextRequest>[1]>);
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const response = await proxy(request);
  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({ detail: { code: "account_request_too_large" } });
  expect(consumed).toBeLessThanOrEqual(maximum + 4096);
  expect(cancelled).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});

it.each(proxies)("%s cancels stalled body reads on the request deadline", async (_name, _maximum, proxy) => {
  vi.useFakeTimers();
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const request = new NextRequest("https://webdiag.test/api/account/projects", { method: "POST", body, duplex: "half" } as NonNullable<ConstructorParameters<typeof NextRequest>[1]>);
  const result = proxy(request);
  await vi.advanceTimersByTimeAsync(10_000);
  const response = await result;
  expect(response.status).toBe(408);
  expect(await response.json()).toMatchObject({ detail: { code: "account_request_body_invalid" } });
  expect(cancelled).toBe(true);
});
