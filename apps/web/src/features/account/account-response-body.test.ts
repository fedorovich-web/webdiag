import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { proxyReportHtml } from "./account-report-proxy";
import { proxyBilling } from "./billing-proxy";
import { proxyAIImageUpload } from "./account-ai-media-proxy";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it.each(["report", "image metadata"] as const)("%s stops oversized upstream streams and cancels the reader", async (kind) => {
  const maximum = kind === "report" ? 3_000_000 : 16_384;
  let consumed = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      consumed += 4096;
      controller.enqueue(new TextEncoder().encode(" ".repeat(4096)));
      if (consumed >= maximum * 4) controller.close();
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  vi.stubGlobal("fetch", async () => new Response(body, { headers: { "content-type": "text/html" } }));
  const response = kind === "report"
    ? await proxyReportHtml(new NextRequest("https://webdiag.test/api/reports/a"), { path: "/report/a" })
    : await proxyAIImageUpload(new NextRequest("https://webdiag.test/api/image", { method: "POST", body: "image", headers: { cookie: "webdiag_session=session", "content-type": "image/png" } }));
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({ detail: { code: kind === "report" ? "account_report_too_large" : "account_api_invalid_response" } });
  expect(consumed).toBeLessThanOrEqual(maximum + 4096);
  expect(cancelled).toBe(true);
});

it.each(["report", "billing", "image metadata"] as const)("%s cancels a stalled body at its deadline", async (kind) => {
  vi.useFakeTimers();
  let cancelled = false;
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const body = new ReadableStream<Uint8Array>({ start(value) { controller = value; }, cancel() { cancelled = true; } });
  const fetcher = vi.fn(async () => kind === "billing" ? Response.json({}) : new Response(body));
  vi.stubGlobal("fetch", fetcher);
  const result = kind === "report"
    ? proxyReportHtml(new NextRequest("https://webdiag.test/api/reports/a"), { path: "/report/a" })
    : kind === "billing"
      ? proxyBilling(new NextRequest("https://webdiag.test/api/billing/invoice", {
        method: "POST", body, duplex: "half", headers: { cookie: "webdiag_session=session", "content-type": "application/json" },
      }), "invoice")
      : proxyAIImageUpload(new NextRequest("https://webdiag.test/api/image", { method: "POST", body: "image", headers: { cookie: "webdiag_session=session", "content-type": "image/png" } }));
  let settled = false;
  void result.then(() => { settled = true; });
  try {
    await vi.advanceTimersByTimeAsync(10_001);
    expect(settled).toBe(true);
    const response = await result;
    expect(response.status).toBe(kind === "report" ? 502 : 408);
    expect(await response.json()).toMatchObject({ detail: { code: kind === "billing" ? "billing_request_timeout" : "account_api_timeout" } });
    expect(cancelled).toBe(true);
    if (kind === "billing") expect(fetcher).not.toHaveBeenCalled();
  } finally {
    if (!settled) { controller?.close(); await result; }
  }
});
