export interface AuditRunSummary {
  readonly status: string;
  readonly score: number | null;
  readonly check_count: number;
  readonly issue_count: number;
  readonly checks_by_status: Record<string, number>;
  readonly issues_by_severity: Record<string, number>;
  readonly issues_by_priority: Record<string, number>;
  readonly highest_severity: string | null;
  readonly top_priority: string | null;
}

export interface AuditIssuePreview {
  readonly issue_id: string;
  readonly check_id?: string | null;
  readonly category: string;
  readonly severity: string;
  readonly priority: string;
  readonly title: string;
  readonly description: string;
}

export interface AuditCheckPreview {
  readonly check_id: string;
  readonly name: string;
  readonly category: string;
  readonly status: string;
}

export interface AuditSnapshotResponse {
  readonly contract_version: string;
  readonly generated_at: string;
  readonly summary: {
    readonly job_id: string;
    readonly status: string;
    readonly run: AuditRunSummary | null;
  };
  readonly job: {
    readonly job_id: string;
    readonly status: string;
    readonly target: {
      readonly original_url: string;
      readonly normalized_url: string;
      readonly hostname: string;
      readonly scope: string;
    };
  };
  readonly run: {
    readonly run_id: string;
    readonly status: string;
    readonly score: number | null;
    readonly checks: readonly AuditCheckPreview[];
    readonly issues: readonly AuditIssuePreview[];
  } | null;
}

const AUDIT_CONTRACT_VERSION = "webdiag.audit.snapshot.v1";

export class AuditClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code?: string }) {
    super(message);
    this.name = "AuditClientError";
    this.status = options.status;
    this.code = options.code ?? "audit_client_error";
  }
}

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export function normalizeAuditUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseAuditUrlInput(value: string): URL | null {
  const normalized = normalizeAuditUrlInput(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number");
}

function isAuditRunSummary(payload: unknown): payload is AuditRunSummary {
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

function isAuditCheckPreview(payload: unknown): payload is AuditCheckPreview {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.check_id === "string" &&
    typeof payload.name === "string" &&
    typeof payload.category === "string" &&
    typeof payload.status === "string"
  );
}

function isAuditIssuePreview(payload: unknown): payload is AuditIssuePreview {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.issue_id === "string" &&
    (typeof payload.check_id === "string" || payload.check_id === null || payload.check_id === undefined) &&
    typeof payload.category === "string" &&
    typeof payload.severity === "string" &&
    typeof payload.priority === "string" &&
    typeof payload.title === "string" &&
    typeof payload.description === "string"
  );
}

function isAuditSnapshotResponse(payload: unknown): payload is AuditSnapshotResponse {
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
    payload.run.checks.every(isAuditCheckPreview) &&
    Array.isArray(payload.run.issues) &&
    payload.run.issues.every(isAuditIssuePreview)
  );
}

function extractErrorMessage(payload: unknown): { code?: string; message?: string } {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Record<string, unknown>;
  const detail = record.detail;
  if (detail && typeof detail === "object") {
    const detailRecord = detail as Record<string, unknown>;
    return {
      code: typeof detailRecord.code === "string" ? detailRecord.code : undefined,
      message: typeof detailRecord.message === "string" ? detailRecord.message : undefined,
    };
  }
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

export async function startAuditSnapshot(
  url: string,
  options: { endpoint?: string; fetcher?: Fetcher } = {},
): Promise<AuditSnapshotResponse> {
  const endpoint = options.endpoint ?? "/api/audits";
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const extracted = extractErrorMessage(payload);
    throw new AuditClientError(extracted.message ?? "Audit request failed.", {
      status: response.status,
      code: extracted.code,
    });
  }

  if (!isAuditSnapshotResponse(payload)) {
    throw new AuditClientError("Audit API returned an invalid response.", { status: response.status, code: "invalid_response" });
  }

  return payload;
}
