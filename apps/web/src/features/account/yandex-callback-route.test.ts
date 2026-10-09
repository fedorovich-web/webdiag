import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/account/yandex/callback/route";
import { POST as login } from "../../../app/api/account/login/route";

const verifier = "v".repeat(43);
const sessionCookie = "webdiag_session=session-token; Max-Age=3600; Path=/; HttpOnly; Secure; SameSite=Lax";
function request(query = "code=good-code&state=state", cookie = `yandex_oauth_state=state; yandex_oauth_verifier=${verifier}`) {
  return new NextRequest(`https://app.webdiag.ru/api/account/yandex/callback?${query}`, { headers: { cookie } });
}
function errorCode(response: Response) { return new URL(response.headers.get("location")!).searchParams.get("error"); }

beforeEach(() => { vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Yandex OAuth callback", () => {
  it("handles provider cancellation without exchanging a code", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(errorCode(await GET(request("error=access_denied")))).toBe("yandex_access_denied");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects missing codes", async () => {
    expect(errorCode(await GET(request("state=state")))).toBe("yandex_missing_code");
  });
  it("rejects a mismatched state or missing PKCE cookie", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(errorCode(await GET(request("code=good&state=wrong")))).toBe("yandex_state_mismatch");
    expect(errorCode(await GET(request("code=good&state=state", "yandex_oauth_state=state")))).toBe("yandex_state_mismatch");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sets the backend session after clearing all temporary cookies", async () => {
    const fetcher = vi.fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response("{}", { headers: { "set-cookie": sessionCookie } }));
    vi.stubGlobal("fetch", fetcher);
    vi.stubEnv("WEBDIAG_YANDEX_CLIENT_SECRET", "unused-web-secret");
    const response = await GET(request());
    expect(response.headers.get("location")).toBe("https://app.webdiag.ru/account");
    expect(response.headers.get("set-cookie")).toContain(sessionCookie);
    expect(response.cookies.get("yandex_oauth_state")?.value).toBe("");
    expect(response.cookies.get("yandex_oauth_verifier")?.value).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("http://api:8000/v1/account/oauth/yandex/exchange");
    expect(JSON.parse(String(init?.body))).toEqual({ code: "good-code", code_verifier: verifier, redirect_uri: "https://app.webdiag.ru/api/account/yandex/callback" });
    expect(String(init?.body)).not.toContain("unused-web-secret");
  });
  it("asks an existing user for ownership proof with an HttpOnly challenge", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "account_link_required" }, link_token: "t".repeat(43) }), { status: 409 })));
    const response = await GET(request());
    expect(errorCode(response)).toBe("yandex_account_link_required");
    expect(response.cookies.get("yandex_oauth_link")?.httpOnly).toBe(true);
    expect(response.cookies.get("yandex_oauth_link")?.secure).toBe(true);
    expect(response.headers.get("set-cookie")).not.toContain("webdiag_session=");
  });
  it("does not accept a successful response without a session", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
    expect(errorCode(await GET(request()))).toBe("yandex_session_missing");
  });
  it("does not link an unverified email account through its local password", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => String(url).endsWith("/link")
      ? new Response("{}") : new Response("{}", { headers: { "set-cookie": sessionCookie } }));
    vi.stubGlobal("fetch", fetcher);
    const response = await login(new NextRequest("https://app.webdiag.ru/api/account/login", {
      method: "POST", headers: { "content-type": "application/json", cookie: `yandex_oauth_link=${"t".repeat(43)}` },
      body: JSON.stringify({ email: "buyer@example.com", password: "correct password" }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(sessionCookie);
    expect(response.headers.get("set-cookie")).not.toContain("yandex_oauth_link=");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
