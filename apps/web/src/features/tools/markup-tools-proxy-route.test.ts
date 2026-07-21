import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as postHtmlValidator } from "../../../app/api/tools/html-validator/route";
import { POST as postStructuredData } from "../../../app/api/tools/structured-data/route";

const validStructuredData = {
  contract_version: "webdiag.tool.structured_data.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  json_ld_count: 1,
  valid_json_ld_count: 1,
  invalid_json_ld_count: 0,
  detected_types: [{ type: "Organization", count: 1 }],
  blocks: [{ index: 1, valid: true, types: ["Organization"], node_count: 1, error: null }],
  recommendation: "OK",
};

const validHtmlMarkup = {
  contract_version: "webdiag.tool.html_markup.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  doctype_present: true,
  html_tag_present: true,
  head_tag_present: true,
  body_tag_present: true,
  html_lang: "ru",
  title: "Example",
  viewport_present: true,
  duplicate_id_count: 0,
  unexpected_end_tag_count: 0,
  unclosed_tag_count: 0,
  checks: [{ id: "doctype", title: "Doctype", status: "pass", severity: "info", message: "OK", recommendation: "No action required." }],
  recommendation: "OK",
};

function request(path: string, body: unknown): NextRequest {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("markup tool proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects request bodies without a URL string", async () => {
    const response = await postStructuredData(request("/api/tools/structured-data", { url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } });
  });

  it("proxies valid structured data and HTML validator API results", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ url: "https://example.com/" }));
      const payload = String(input).endsWith("/structured-data") ? validStructuredData : validHtmlMarkup;
      return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    await expect(responseJson(await postStructuredData(request("/api/tools/structured-data", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.structured_data.v1" });
    await expect(responseJson(await postHtmlValidator(request("/api/tools/html-validator", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.html_markup.v1" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("preserves normalized upstream errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "tool_url_rejected", message: "blocked" } }), { status: 400, headers: { "content-type": "application/json" } })));

    const response = await postHtmlValidator(request("/api/tools/html-validator", { url: "https://example.com/" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_url_rejected", message: "blocked" } });
  });

  it("maps invalid upstream JSON to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 200 })));

    const response = await postStructuredData(request("/api/tools/structured-data", { url: "https://example.com/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned invalid JSON." } });
  });

  it("maps invalid success contracts to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...validHtmlMarkup, contract_version: "raw" }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await postHtmlValidator(request("/api/tools/html-validator", { url: "https://example.com/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid HTML markup result." } });
  });
});
