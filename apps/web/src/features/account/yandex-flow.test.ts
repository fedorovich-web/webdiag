import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as login } from "../../../app/api/account/yandex/login/route";
import { GET as callback } from "../../../app/api/account/yandex/callback/route";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("uses PKCE and retains a safe checkout destination", async () => {
  vi.stubEnv("WEBDIAG_YANDEX_CLIENT_ID", "test-client-id");
  const response = await login(new NextRequest("https://app.webdiag.ru/api/account/yandex/login?return_to=%2Fen%2Faccount%2Fcheckout%3Fpack%3Dplan-team"));
  const url = new URL(response.headers.get("location")!);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("scope")).toBe("login:email login:info");
  expect(response.cookies.get("yandex_oauth_verifier")?.httpOnly).toBe(true);
  expect(response.cookies.get("yandex_oauth_return")?.value).toBe("/en/account/checkout?pack=plan-team");
});

it("does not trust an arbitrary forwarded OAuth host", async () => {
  vi.stubEnv("WEBDIAG_YANDEX_CLIENT_ID", "test-client-id");
  const response = await login(new NextRequest("https://app.webdiag.ru/api/account/yandex/login", {
    headers: { "x-forwarded-host": "webdiag.ru.attacker.example" },
  }));
  expect(new URL(response.headers.get("location")!).searchParams.get("redirect_uri"))
    .toBe("https://app.webdiag.ru/api/account/yandex/callback");
});

it("uses one backend exchange and preserves the server session lifetime", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000");
  const fetcher = vi.fn(async (..._args: unknown[]) => new Response("{}", { headers: {
    "set-cookie": "webdiag_session=session-token; Max-Age=3600; Path=/; HttpOnly; Secure; SameSite=Lax",
  }}));
  vi.stubGlobal("fetch", fetcher);
  const response = await callback(new NextRequest("https://app.webdiag.ru/api/account/yandex/callback?code=code&state=state", {
    headers: { cookie: `yandex_oauth_state=state; yandex_oauth_verifier=${"v".repeat(43)}; yandex_oauth_return=/account/checkout?pack=plan-pro` },
  }));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[0]).toBe("http://api:8000/v1/account/oauth/yandex/exchange");
  expect(response.headers.get("location")).toBe("https://app.webdiag.ru/account/checkout?pack=plan-pro");
  expect(response.headers.get("set-cookie")).toContain("Max-Age=3600");
});
