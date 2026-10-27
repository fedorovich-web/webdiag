import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as csp } from "../../../app/api/tools/csp/route";
import { POST as asset } from "../../../app/api/tools/css-delivery/route";
import { POST as accessibility } from "../../../app/api/tools/form-accessibility/route";
import { POST as network } from "../../../app/api/tools/domain-rdap/route";
import { POST as redirects } from "./url-management-proxy";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it.each([["client", csp], ["asset", asset], ["accessibility", accessibility], ["network", network], ["redirects", redirects]] as const)("%s bounds oversized streaming JSON before parsing", async (_name, proxy) => {
  let consumed = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      consumed += 4096;
      controller.enqueue(new TextEncoder().encode(" ".repeat(4096)));
      if (consumed === 1_048_576) controller.close();
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const response = await proxy(new NextRequest("https://webdiag.test/api/tools/test", { method: "POST", body, duplex: "half" } as NonNullable<ConstructorParameters<typeof NextRequest>[1]>));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ detail: { code: "tool_bad_request" } });
  expect(consumed).toBeLessThan(1_048_576);
  expect(cancelled).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});
