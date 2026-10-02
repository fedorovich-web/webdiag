import { NextRequest, NextResponse } from "next/server";
import {
  isAuditErrorPayload,
  isBackendAuditSnapshotResponse,
  parseJsonPayload,
  toAuditFrontendResult,
} from "../../../src/features/home/audit-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const DOKPLOY_API_CONTAINER_URL = "http://webdiag-webdiagcore-mlnqpr-api-1:8000";
const REQUEST_TIMEOUT_MS = 45_000;

function getAuditApiBaseUrls(): string[] {
  const primary = (process.env.WEBDIAG_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const urls = [primary];
  if (primary.includes("api:8000")) {
    urls.push(DOKPLOY_API_CONTAINER_URL);
  }
  return urls;
}

function toJsonResponse(payload: unknown, status: number, headers?: HeadersInit) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function errorPayload(code: string, message: string) {
  return { detail: { code, message } };
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object" || typeof (payload as { url?: unknown }).url !== "string") {
    return toJsonResponse(errorPayload("audit_bad_request", "Request body must include a URL string."), 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const urls = getAuditApiBaseUrls();
    let upstream: Response | null = null;
    let text = "";
    let activeUrl = urls[0];

    for (const url of urls) {
      activeUrl = url;
      try {
        const res = await fetch(`${url}/v1/audits`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({ url: (payload as { url: string }).url }),
          cache: "no-store",
          signal: controller.signal,
        });

        const bodyText = await res.text();
        if (res.status === 400 && bodyText.includes("Invalid host header") && urls.length > 1 && url !== urls[urls.length - 1]) {
          console.warn(`[AUDIT PROXY] ${url} returned 'Invalid host header' (collision on shared network), attempting fallback...`);
          continue;
        }

        upstream = res;
        text = bodyText;
        break;
      } catch (err) {
        if (url === urls[urls.length - 1]) {
          throw err;
        }
        console.warn(`[AUDIT PROXY] Connection error to ${url}, attempting fallback:`, err);
      }
    }

    if (!upstream) {
      return toJsonResponse(
        errorPayload("audit_api_unavailable", "Audit API is not available."),
        502,
      );
    }

    const parsed = parseJsonPayload(text);
    if (!parsed.ok) {
      console.error("[AUDIT UPSTREAM INVALID JSON]", {
        url: `${activeUrl}/v1/audits`,
        status: upstream.status,
        text: text.slice(0, 300),
      });
      return toJsonResponse(
        errorPayload("audit_api_invalid_response", "Audit API returned invalid JSON."),
        502,
      );
    }

    if (!upstream.ok) {
      if (isAuditErrorPayload(parsed.payload)) {
        const retryAfter = upstream.headers.get("retry-after");
        return toJsonResponse(parsed.payload, upstream.status, retryAfter ? { "retry-after": retryAfter } : undefined);
      }
      return toJsonResponse(
        errorPayload("audit_api_invalid_response", "Audit API returned an invalid error payload."),
        502,
      );
    }

    if (!isBackendAuditSnapshotResponse(parsed.payload)) {
      return toJsonResponse(
        errorPayload("audit_api_invalid_response", "Audit API returned an invalid audit snapshot."),
        502,
      );
    }

    return toJsonResponse(toAuditFrontendResult(parsed.payload), upstream.status);
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return toJsonResponse(
      errorPayload(
        aborted ? "audit_api_timeout" : "audit_api_unavailable",
        aborted ? "Audit API request timed out." : "Audit API is not available.",
      ),
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
