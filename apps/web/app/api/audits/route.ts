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
const REQUEST_TIMEOUT_MS = 15_000;

function getAuditApiBaseUrl(): string {
  const raw = process.env.WEBDIAG_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function toJsonResponse(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
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
    const upstream = await fetch(`${getAuditApiBaseUrl()}/v1/audits`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: (payload as { url: string }).url }),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await upstream.text();
    const parsed = parseJsonPayload(text);
    if (!parsed.ok) {
      return toJsonResponse(
        errorPayload("audit_api_invalid_response", "Audit API returned invalid JSON."),
        502,
      );
    }

    if (!upstream.ok) {
      if (isAuditErrorPayload(parsed.payload)) {
        return toJsonResponse(parsed.payload, upstream.status);
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
