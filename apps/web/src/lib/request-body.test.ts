import { expect, it } from "vitest";
import { readBoundedBody } from "./request-body";

it("bounds streaming requests even when Content-Length is absent", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(16385)); },
    cancel() { cancelled = true; },
  });
  const request = new Request("https://app.webdiag.ru/api/contact", { method: "POST", body, duplex: "half" } as RequestInit);
  await expect(readBoundedBody(request, 16384)).rejects.toMatchObject({ status: 413 });
  expect(cancelled).toBe(true);
});
