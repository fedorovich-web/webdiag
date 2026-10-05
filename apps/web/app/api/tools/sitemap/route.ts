import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15_000;

interface ToolApiErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

export interface SitemapLocResult {
  readonly url: string;
}

export interface SitemapXmlToolResponse {
  readonly contract_version: "webdiag.tool.sitemap_xml.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly sitemap_url: string;
  readonly target_url: string | null;
  readonly status_code: number | null;
  readonly available: boolean;
  readonly valid_xml: boolean;
  readonly kind: "urlset" | "sitemapindex" | "unknown";
  readonly url_count: number;
  readonly sitemap_count: number;
  readonly contains_target: boolean | null;
  readonly sample_urls: readonly SitemapLocResult[];
  readonly sample_sitemaps: readonly SitemapLocResult[];
  readonly content_type: string | null;
  readonly parse_error: string | null;
  readonly fetch_error: string | null;
  readonly recommendation: string;
}

function getApiBaseUrl(): string {
  const raw = process.env.WEBDIAG_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function toJsonResponse(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isToolErrorPayload(payload: unknown): payload is ToolApiErrorPayload {
  if (!isRecord(payload) || !isRecord(payload.detail)) return false;
  return typeof payload.detail.code === "string" && typeof payload.detail.message === "string";
}

function isLoc(payload: unknown): payload is SitemapLocResult {
  return isRecord(payload) && typeof payload.url === "string";
}

export function isSitemapXmlToolResponse(payload: unknown): payload is SitemapXmlToolResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.sitemap_xml.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.sitemap_url === "string" &&
    (typeof payload.target_url === "string" || payload.target_url === null) &&
    (typeof payload.status_code === "number" || payload.status_code === null) &&
    typeof payload.available === "boolean" &&
    typeof payload.valid_xml === "boolean" &&
    (payload.kind === "urlset" || payload.kind === "sitemapindex" || payload.kind === "unknown") &&
    typeof payload.url_count === "number" &&
    typeof payload.sitemap_count === "number" &&
    (typeof payload.contains_target === "boolean" || payload.contains_target === null) &&
    Array.isArray(payload.sample_urls) &&
    payload.sample_urls.every(isLoc) &&
    Array.isArray(payload.sample_sitemaps) &&
    payload.sample_sitemaps.every(isLoc) &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.parse_error === "string" || payload.parse_error === null) &&
    (typeof payload.fetch_error === "string" || payload.fetch_error === null) &&
    typeof payload.recommendation === "string"
  );
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || typeof (payload as { url?: unknown }).url !== "string") {
    return toJsonResponse(
      { detail: { code: "tool_bad_request", message: "Request body must include a URL string." } },
      400,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body: { url: string; target_url?: string } = { url: (payload as { url: string }).url };
    if (typeof (payload as { target_url?: unknown }).target_url === "string") {
      body.target_url = (payload as { target_url: string }).target_url;
    }

    const upstream = await fetch(`${getApiBaseUrl()}/v1/tools/sitemap`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await parseJson(upstream);
    if (data === undefined) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned invalid JSON." } },
        502,
      );
    }

    if (!upstream.ok) {
      return toJsonResponse(
        isToolErrorPayload(data) ? data : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
        upstream.status,
      );
    }

    if (!isSitemapXmlToolResponse(data)) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid sitemap result." } },
        502,
      );
    }

    return toJsonResponse(data, upstream.status);
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return toJsonResponse(
      {
        detail: {
          code: aborted ? "tool_api_timeout" : "tool_api_unavailable",
          message: aborted ? "Tool API request timed out." : "Tool API is not available.",
        },
      },
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
