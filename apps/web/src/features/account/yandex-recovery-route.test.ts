import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../../app/api/account/yandex/recovery/route";

beforeEach(() => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000");
  vi.stubEnv("RESEND_API_KEY", "test-mail-key");
  vi.stubEnv("WEBDIAG_ACCOUNT_INTERNAL_TOKEN", "test-bridge-token-" + "a".repeat(32));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const request = (body: unknown = { locale: "ru" }, origin = "https://app.webdiag.ru") => new NextRequest("https://app.webdiag.ru/api/account/yandex/recovery", {
  method: "POST", headers: { origin, "content-type": "application/json", cookie: `yandex_oauth_link=${"t".repeat(43)}` }, body: JSON.stringify(body),
});

it("sends the code only by email and never returns it to the browser", async () => {
  const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url).startsWith("http://api:8000")) return new Response(JSON.stringify({ email: "owner@example.com", code: "123456" }));
    expect(String(url)).toBe("https://api.resend.com/emails");
    const payload = JSON.parse(String(init?.body));
    expect(payload.to).toEqual(["owner@example.com"]);
    expect(payload.text).toContain("123456");
    return new Response(JSON.stringify({ id: "delivery-id" }));
  });
  vi.stubGlobal("fetch", fetcher);
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ sent: true });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("does not claim that a code was sent when delivery fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL) => String(url).startsWith("http://api:8000")
    ? new Response(JSON.stringify({ email: "owner@example.com", code: "123456" }))
    : new Response("{}", { status: 503 })));
  expect((await POST(request())).status).toBe(503);
});

it("rejects cross-origin recovery before contacting the backend", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await POST(request({}, "https://attacker.example"))).status).toBe(403);
  expect(fetcher).not.toHaveBeenCalled();
});

it("sets a session only after successful code verification", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { headers: {
    "set-cookie": "webdiag_session=verified-session; Max-Age=3600; HttpOnly; Secure; Path=/; SameSite=Lax",
  }})));
  const response = await POST(request({ code: "123456" }));
  expect(await response.json()).toEqual({ confirmed: true });
  expect(response.headers.get("set-cookie")).toContain("webdiag_session=verified-session");
  expect(response.cookies.get("yandex_oauth_link")?.value).toBe("");
});
