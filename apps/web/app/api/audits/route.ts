import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15_000;
const AUDIT_CONTRACT_VERSION = "webdiag.audit.snapshot.v1";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number");
}

function isAuditErrorPayload(payload: unknown): boolean {
  if (!isRecord(payload) || !isRecord(payload.detail)) return false;
  return typeof payload.detail.code === "string" && typeof payload.detail.message === "string";
}

function isAuditRunSummary(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.status === "string" &&
    (typeof payload.score === "number" || payload.score === null) &&
    typeof payload.check_count === "number" &&
    typeof payload.issue_count === "number" &&
    isNumberRecord(payload.checks_by_status) &&
    isNumberRecord(payload.issues_by_severity) &&
    isNumberRecord(payload.issues_by_priority) &&
    (typeof payload.highest_severity === "string" || payload.highest_severity === null) &&
    (typeof payload.top_priority === "string" || payload.top_priority === null)
  );
}

function isAuditSnapshotPayload(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  if (payload.contract_version !== AUDIT_CONTRACT_VERSION || typeof payload.generated_at !== "string") return false;
  if (!isRecord(payload.summary) || !isRecord(payload.job)) return false;
  if (typeof payload.summary.job_id !== "string" || typeof payload.summary.status !== "string") return false;
  if (payload.summary.run !== null && !isAuditRunSummary(payload.summary.run)) return false;
  if (typeof payload.job.job_id !== "string" || typeof payload.job.status !== "string") return false;
  if (!isRecord(payload.job.target)) return false;
  if (
    typeof payload.job.target.original_url !== "string" ||
    typeof payload.job.target.normalized_url !== "string" ||
    typeof payload.job.target.hostname !== "string" ||
    typeof payload.job.target.scope !== "string"
  ) {
    return false;
  }
  if (payload.run === null) return true;
  if (!isRecord(payload.run)) return false;
  return (
    typeof payload.run.run_id === "string" &&
    typeof payload.run.status === "string" &&
    (typeof payload.run.score === "number" || payload.run.score === null) &&
    Array.isArray(payload.run.checks) &&
    Array.isArray(payload.run.issues)
  );
}

function parseJsonPayload(text: string): { ok: true; payload: unknown } | { ok: false } {
  if (!text.trim()) return { ok: false };
  try {
    return { ok: true, payload: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
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

    if (!isAuditSnapshotPayload(parsed.payload)) {
      return toJsonResponse(
        errorPayload("audit_api_invalid_response", "Audit API returned an invalid audit snapshot."),
        502,
      );
    }

    return toJsonResponse(parsed.payload, upstream.status);
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
