import { describe, expect, it } from "vitest";
import {
  DEFAULT_API_BASE_URL,
  DOKPLOY_API_CONTAINER_URL,
  getBackendApiBaseUrl,
  parseJsonResponse,
  toJsonResponse,
} from "./backend-api";

describe("backend-api utility", () => {
  it("defaults to localhost in development", () => {
    expect(getBackendApiBaseUrl({})).toBe(DEFAULT_API_BASE_URL);
  });

  it("respects WEBDIAG_API_INTERNAL_URL when set", () => {
    expect(
      getBackendApiBaseUrl({
        WEBDIAG_API_INTERNAL_URL: "http://custom-api:9000/",
      }),
    ).toBe("http://custom-api:9000");
  });

  it("resolves Dokploy container in production when api:8000 is specified", () => {
    expect(
      getBackendApiBaseUrl({
        NODE_ENV: "production",
        WEBDIAG_API_INTERNAL_URL: "http://api:8000",
      }),
    ).toBe(DOKPLOY_API_CONTAINER_URL);
  });

  it("does not override non-default URLs in production", () => {
    expect(
      getBackendApiBaseUrl({
        NODE_ENV: "production",
        WEBDIAG_API_INTERNAL_URL: "http://specific-host:8000",
      }),
    ).toBe("http://specific-host:8000");
  });

  it("produces no-store JSON responses", async () => {
    const res = toJsonResponse({ ok: true }, 200);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("handles valid, empty, and malformed JSON upstream responses", async () => {
    const valid = new Response(JSON.stringify({ score: 100 }), { status: 200 });
    await expect(parseJsonResponse(valid)).resolves.toEqual({ score: 100 });

    const empty = new Response(null, { status: 204 });
    await expect(parseJsonResponse(empty)).resolves.toBeNull();

    const invalid = new Response("<html>Bad Gateway</html>", { status: 502 });
    await expect(parseJsonResponse(invalid)).resolves.toBeUndefined();
  });
});
