
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/admin/[section]/route";
import { POST } from "../../../app/api/admin/clients/[userId]/[action]/route";
import { middleware } from "../../middleware";
import { accountReturnPath } from "../account/account-navigation";

afterEach(() => vi.unstubAllGlobals());

describe("owner dashboard routes", () => {
  it("routes the owner page to the app host without exposing the BFF on the public host", async () => {
    const page = middleware(new NextRequest("https://webdiag.ru/en/admin", { headers: { host: "webdiag.ru" } }));
    expect(page.headers.get("location")).toBe("https://app.webdiag.ru/en/admin");
    expect(page.headers.get("cache-control")).toBe("private, no-store");
    const api = middleware(new NextRequest("https://webdiag.ru/api/admin/overview", { headers: { host: "webdiag.ru" } }));
    expect(api.status).toBe(404);
    expect(api.headers.get("cache-control")).toBe("private, no-store");
  });

  it("allows a fixed internal owner return path for both sign-in methods", () => {
    expect(accountReturnPath("/admin")).toBe("/admin");
    expect(accountReturnPath("/en/admin", "en")).toBe("/en/admin");
    expect(accountReturnPath("/admin?next=//other.example")).toBe("/admin");
    expect(accountReturnPath("/admin/elsewhere")).toBe("/account");
    expect(accountReturnPath("//other.example/admin")).toBe("/account");
  });

  it("forwards only the session and supported parameters, and normalizes errors", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ private: "upstream detail" }, { status: 403 }));
    vi.stubGlobal("fetch", fetch);
    const request = new NextRequest("http://localhost/api/admin/clients?page=2&private=ignore", {
      headers: { cookie: "unrelated=secret; webdiag_session=example", authorization: "Bearer ignored", "x-admin-email-query": "client%40example.test" },
    });
    const response = await GET(request, { params: Promise.resolve({ section: "clients" }) });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/v1\/admin\/clients\?page=2$/), expect.objectContaining({
      headers: expect.objectContaining({ cookie: "webdiag_session=example", "x-admin-email-query": "client%40example.test" }),
      cache: "no-store", redirect: "error",
    }));
    expect(fetch.mock.calls[0]?.[1].headers).not.toHaveProperty("authorization");
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).not.toContain("upstream detail");
  });

  it("rejects unknown routes and guest BFF reads without sending upstream requests", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const request = new NextRequest("http://localhost/api/admin/overview");
    expect((await GET(request, { params: Promise.resolve({ section: "browse" }) })).status).toBe(404);
    expect((await GET(request, { params: Promise.resolve({ section: "overview" }) })).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects guest, missing origin, cross-origin and invalid moderation requests", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const userId = "6d8bb30c-2cf4-4700-bad0-38943d2acf00";
    const params = (action = "block") => ({ params: Promise.resolve({ userId, action }) });
    const url = "https://app.webdiag.ru/api/admin/clients/" + userId + "/block";
    const request = (headers: Record<string, string>) => new NextRequest(url, { method: "POST", headers });
    const cookie = "webdiag_session=example";
    const origin = "https://app.webdiag.ru";
    expect((await POST(request({ origin }), params())).status).toBe(401);
    expect((await POST(request({ cookie }), params())).status).toBe(403);
    expect((await POST(request({ cookie, origin: "https://webdiag.ru" }), params())).status).toBe(403);
    expect((await POST(request({ cookie, origin, "sec-fetch-site": "cross-site" }), params())).status).toBe(403);
    expect((await POST(request({ cookie, origin }), params("delete"))).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forwards a typed moderation operation privately and returns only the result fields", async () => {
    const userId = "6d8bb30c-2cf4-4700-bad0-38943d2acf00";
    const fetch = vi.fn().mockResolvedValue(Response.json({
      id: userId, status: "blocked", revoked_session_count: 2, private: "ignored",
    }));
    vi.stubGlobal("fetch", fetch);
    const request = new NextRequest(`https://app.webdiag.ru/api/admin/clients/${userId}/block?ignore=1`, {
      method: "POST",
      headers: {
        cookie: "unrelated=secret; webdiag_session=example",
        authorization: "Bearer ignored",
        origin: "https://app.webdiag.ru",
      },
    });
    const response = await POST(request, { params: Promise.resolve({ userId, action: "block" }) });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(`/v1/admin/clients/${userId}/block$`), expect.objectContaining({
      method: "POST",
      headers: { accept: "application/json", cookie: "webdiag_session=example", "x-webdiag-admin-action": "1" },
      cache: "no-store",
      redirect: "error",
    }));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ id: userId, status: "blocked", revoked_session_count: 2 });
  });
});
