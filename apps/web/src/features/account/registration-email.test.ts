import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../../app/api/account/register/route";
import { GET } from "../../../app/api/account/yandex/callback/route";

const mocks = vi.hoisted(() => ({ after: vi.fn(), welcome: vi.fn(async () => {}) }));
vi.mock("next/server", async (original) => ({ ...await original<object>(), after: mocks.after }));
vi.mock("../../lib/email-service", () => ({ sendWelcomeEmail: mocks.welcome }));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("sends welcome mail to the persisted registration address after the response", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ user: { email: "canonical@example.com" } }), { status: 201 })));
  const response = await POST(new NextRequest("https://app.webdiag.ru/api/account/register", {
    method: "POST", headers: { "content-type": "application/json", referer: "https://app.webdiag.ru/en/register" },
    body: JSON.stringify({ email: "CANONICAL@example.com", password: "secure pass", display_name: "User" }),
  }));
  expect(response.status).toBe(201);
  expect(mocks.welcome).not.toHaveBeenCalled();
  await mocks.after.mock.calls[0]![0]();
  expect(mocks.welcome).toHaveBeenCalledWith("canonical@example.com", "en");
});

it("does not send a welcome email after rejected registration", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 409 })));
  await POST(new NextRequest("https://app.webdiag.ru/api/account/register", { method: "POST", body: "{}" }));
  expect(mocks.after).not.toHaveBeenCalled();
});

it("welcomes a newly created Yandex user without resending on an ordinary login", async () => {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000");
  let created = true;
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ created, user: { email: "yandex@example.com" } }), {
    headers: { "set-cookie": "webdiag_session=session; Path=/; HttpOnly; Secure; SameSite=Lax" },
  })));
  const request = () => new NextRequest("https://app.webdiag.ru/api/account/yandex/callback?code=code&state=state", {
    headers: { cookie: `yandex_oauth_state=state; yandex_oauth_verifier=${"v".repeat(43)}` },
  });
  expect((await GET(request())).status).toBe(307);
  await mocks.after.mock.calls[0]![0]();
  expect(mocks.welcome).toHaveBeenCalledWith("yandex@example.com", "ru");
  created = false;
  await GET(request());
  expect(mocks.after).toHaveBeenCalledTimes(1);
});
