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

export interface RobotsTxtRuleResult {
  readonly user_agent: string;
  readonly directive: "allow" | "disallow";
  readonly value: string;
}

export interface RobotsTxtSitemapResult {
  readonly url: string;
}

export interface RobotsTxtToolResponse {
  readonly contract_version: "webdiag.tool.robots_txt.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly target_url: string;
  readonly target_path: string;
  readonly robots_url: string;
  readonly user_agent: string;
  readonly status_code: number | null;
  readonly available: boolean;
  readonly allows_target: boolean | null;
  readonly matched_allow_rule: string | null;
  readonly matched_disallow_rule: string | null;
  readonly disallow_count: number;
  readonly disallow_rules: readonly RobotsTxtRuleResult[];
  readonly sitemap_count: number;
  readonly sitemap_urls: readonly RobotsTxtSitemapResult[];
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

function isRobotsRule(payload: unknown): payload is RobotsTxtRuleResult {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.user_agent === "string" &&
    (payload.directive === "allow" || payload.directive === "disallow") &&
    typeof payload.value === "string"
  );
}

function isSitemap(payload: unknown): payload is RobotsTxtSitemapResult {
  return isRecord(payload) && typeof payload.url === "string";
}

export function isRobotsTxtToolResponse(payload: unknown): payload is RobotsTxtToolResponse {
  if (!isRecord(payload)) return false;
  if (payload.contract_version !== "webdiag.tool.robots_txt.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.target_url === "string" &&
    typeof payload.target_path === "string" &&
    typeof payload.robots_url === "string" &&
    typeof payload.user_agent === "string" &&
    (typeof payload.status_code === "number" || payload.status_code === null) &&
    typeof payload.available === "boolean" &&
    (typeof payload.allows_target === "boolean" || payload.allows_target === null) &&
    (typeof payload.matched_allow_rule === "string" || payload.matched_allow_rule === null) &&
    (typeof payload.matched_disallow_rule === "string" || payload.matched_disallow_rule === null) &&
    typeof payload.disallow_count === "number" &&
    Array.isArray(payload.disallow_rules) &&
    payload.disallow_rules.every(isRobotsRule) &&
    typeof payload.sitemap_count === "number" &&
    Array.isArray(payload.sitemap_urls) &&
    payload.sitemap_urls.every(isSitemap) &&
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
    const upstream = await fetch(`${getApiBaseUrl()}/v1/tools/robots-txt`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        url: (payload as { url: string }).url,
        user_agent: typeof (payload as { user_agent?: unknown }).user_agent === "string"
          ? (payload as { user_agent: string }).user_agent
          : undefined,
      }),
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

    if (!isRobotsTxtToolResponse(data)) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid robots.txt result." } },
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
