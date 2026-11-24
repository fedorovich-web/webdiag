import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../../app/api/account/session-status/route";

const endpoint = "https://app.webdiag.ru/api/account/session-status";
afterEach(() => vi.unstubAllGlobals());

describe("public header session status", () => {
  it("allows the WebDiag site to read only the session status", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(JSON.stringify({ email: "client@example.test" })));
    vi.stubGlobal("fetch", upstream);
    const response = await GET(new NextRequest(endpoint, {
      headers: { origin: "https://webdiag.ru", cookie: "webdiag_session=test-token; preference=dark" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
    expect(response.headers.get("access-control-allow-origin")).toBe("https://webdiag.ru");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Origin");
    expect(upstream).toHaveBeenCalledWith(expect.stringContaining("/v1/account/me"), expect.objectContaining({
      cache: "no-store",
      headers: { accept: "application/json", cookie: "webdiag_session=test-token" },
    }));
  });

  it("returns guest status without calling the account service when the cookie is absent", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await GET(new NextRequest(endpoint, { headers: { origin: "https://webdiag.ru" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false });
    expect(response.headers.get("access-control-allow-origin")).toBe("https://webdiag.ru");
    expect(upstream).not.toHaveBeenCalled();
  });

  it("declines an untrusted origin before examining the session", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await GET(new NextRequest(endpoint, {
      headers: { origin: "https://unrelated.example", cookie: "webdiag_session=test-token" },
    }));
    expect(response.status).toBe(403);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(upstream).not.toHaveBeenCalled();
  });
});
