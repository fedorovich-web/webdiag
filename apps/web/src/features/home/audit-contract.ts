export const BACKEND_AUDIT_CONTRACT_VERSION = "webdiag.audit.snapshot.v1";
export const FRONTEND_AUDIT_RESULT_CONTRACT_VERSION = "webdiag.web.audit_result.v1";

type NumberBuckets = Record<string, number>;

export interface AuditApiErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

export interface BackendAuditRunSummary {
  readonly status: string;
  readonly score: number | null;
  readonly check_count: number;
  readonly issue_count: number;
  readonly checks_by_status: NumberBuckets;
  readonly issues_by_severity: NumberBuckets;
  readonly issues_by_priority: NumberBuckets;
  readonly highest_severity: string | null;
  readonly top_priority: string | null;
}

export interface BackendAuditIssuePreview {
  readonly issue_id: string;
  readonly check_id?: string | null;
  readonly category: string;
  readonly severity: string;
  readonly priority: string;
  readonly title: string;
  readonly description: string;
}

export interface BackendAuditCheckPreview {
  readonly check_id: string;
  readonly name: string;
  readonly category: string;
  readonly status: string;
}

export interface BackendAuditSnapshotResponse {
  readonly contract_version: typeof BACKEND_AUDIT_CONTRACT_VERSION;
  readonly generated_at: string;
  readonly summary: {
    readonly job_id: string;
    readonly status: string;
    readonly run: BackendAuditRunSummary | null;
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
    readonly checks: readonly BackendAuditCheckPreview[];
    readonly issues: readonly BackendAuditIssuePreview[];
  } | null;
}

export interface AuditFrontendSummary {
  readonly status: string;
  readonly score: number | null;
  readonly checkCount: number;
  readonly issueCount: number;
  readonly checksByStatus: NumberBuckets;
  readonly issuesBySeverity: NumberBuckets;
  readonly issuesByPriority: NumberBuckets;
  readonly highestSeverity: string | null;
  readonly topPriority: string | null;
}

export interface AuditFrontendIssue {
  readonly id: string;
  readonly checkId: string | null;
  readonly category: string;
  readonly severity: string;
  readonly priority: string;
  readonly title: string;
  readonly description: string;
}

export interface AuditFrontendCheck {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly status: string;
}

export interface AuditFrontendResult {
  readonly contractVersion: typeof FRONTEND_AUDIT_RESULT_CONTRACT_VERSION;
  readonly sourceContractVersion: typeof BACKEND_AUDIT_CONTRACT_VERSION;
  readonly generatedAt: string;
  readonly job: {
    readonly id: string;
    readonly status: string;
    readonly target: {
      readonly originalUrl: string;
      readonly normalizedUrl: string;
      readonly hostname: string;
      readonly scope: string;
    };
  };
  readonly summary: AuditFrontendSummary | null;
  readonly run: {
    readonly id: string;
    readonly status: string;
    readonly score: number | null;
    readonly checks: readonly AuditFrontendCheck[];
    readonly issues: readonly AuditFrontendIssue[];
  } | null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNumberRecord(value: unknown): value is NumberBuckets {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number");
}

function isBackendRunSummary(payload: unknown): payload is BackendAuditRunSummary {
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

function isBackendCheckPreview(payload: unknown): payload is BackendAuditCheckPreview {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.check_id === "string" &&
    typeof payload.name === "string" &&
    typeof payload.category === "string" &&
    typeof payload.status === "string"
  );
}

function isBackendIssuePreview(payload: unknown): payload is BackendAuditIssuePreview {
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

export function isAuditErrorPayload(payload: unknown): payload is AuditApiErrorPayload {
  if (!isRecord(payload) || !isRecord(payload.detail)) return false;
  return typeof payload.detail.code === "string" && typeof payload.detail.message === "string";
}

export function isBackendAuditSnapshotResponse(payload: unknown): payload is BackendAuditSnapshotResponse {
  if (!isRecord(payload)) return false;
  if (payload.contract_version !== BACKEND_AUDIT_CONTRACT_VERSION || typeof payload.generated_at !== "string") return false;
  if (!isRecord(payload.summary) || !isRecord(payload.job)) return false;
  if (typeof payload.summary.job_id !== "string" || typeof payload.summary.status !== "string") return false;
  if (payload.summary.run !== null && !isBackendRunSummary(payload.summary.run)) return false;
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
    payload.run.checks.every(isBackendCheckPreview) &&
    Array.isArray(payload.run.issues) &&
    payload.run.issues.every(isBackendIssuePreview)
  );
}

function isFrontendSummary(payload: unknown): payload is AuditFrontendSummary {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.status === "string" &&
    (typeof payload.score === "number" || payload.score === null) &&
    typeof payload.checkCount === "number" &&
    typeof payload.issueCount === "number" &&
    isNumberRecord(payload.checksByStatus) &&
    isNumberRecord(payload.issuesBySeverity) &&
    isNumberRecord(payload.issuesByPriority) &&
    (typeof payload.highestSeverity === "string" || payload.highestSeverity === null) &&
    (typeof payload.topPriority === "string" || payload.topPriority === null)
  );
}

function isFrontendCheck(payload: unknown): payload is AuditFrontendCheck {
  if (!isRecord(payload)) return false;
  return typeof payload.id === "string" && typeof payload.name === "string" && typeof payload.category === "string" && typeof payload.status === "string";
}

function isFrontendIssue(payload: unknown): payload is AuditFrontendIssue {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.id === "string" &&
    (typeof payload.checkId === "string" || payload.checkId === null) &&
    typeof payload.category === "string" &&
    typeof payload.severity === "string" &&
    typeof payload.priority === "string" &&
    typeof payload.title === "string" &&
    typeof payload.description === "string"
  );
}

export function isAuditFrontendResult(payload: unknown): payload is AuditFrontendResult {
  if (!isRecord(payload)) return false;
  if (payload.contractVersion !== FRONTEND_AUDIT_RESULT_CONTRACT_VERSION) return false;
  if (payload.sourceContractVersion !== BACKEND_AUDIT_CONTRACT_VERSION || typeof payload.generatedAt !== "string") return false;
  if (!isRecord(payload.job) || !isRecord(payload.job.target)) return false;
  if (typeof payload.job.id !== "string" || typeof payload.job.status !== "string") return false;
  if (
    typeof payload.job.target.originalUrl !== "string" ||
    typeof payload.job.target.normalizedUrl !== "string" ||
    typeof payload.job.target.hostname !== "string" ||
    typeof payload.job.target.scope !== "string"
  ) {
    return false;
  }
  if (payload.summary !== null && !isFrontendSummary(payload.summary)) return false;
  if (payload.run === null) return true;
  if (!isRecord(payload.run)) return false;
  return (
    typeof payload.run.id === "string" &&
    typeof payload.run.status === "string" &&
    (typeof payload.run.score === "number" || payload.run.score === null) &&
    Array.isArray(payload.run.checks) &&
    payload.run.checks.every(isFrontendCheck) &&
    Array.isArray(payload.run.issues) &&
    payload.run.issues.every(isFrontendIssue)
  );
}

export function toAuditFrontendResult(snapshot: BackendAuditSnapshotResponse): AuditFrontendResult {
  const summary = snapshot.summary.run;
  return {
    contractVersion: FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
    sourceContractVersion: snapshot.contract_version,
    generatedAt: snapshot.generated_at,
    job: {
      id: snapshot.job.job_id,
      status: snapshot.job.status,
      target: {
        originalUrl: snapshot.job.target.original_url,
        normalizedUrl: snapshot.job.target.normalized_url,
        hostname: snapshot.job.target.hostname,
        scope: snapshot.job.target.scope,
      },
    },
    summary: summary
      ? {
          status: summary.status,
          score: summary.score,
          checkCount: summary.check_count,
          issueCount: summary.issue_count,
          checksByStatus: summary.checks_by_status,
          issuesBySeverity: summary.issues_by_severity,
          issuesByPriority: summary.issues_by_priority,
          highestSeverity: summary.highest_severity,
          topPriority: summary.top_priority,
        }
      : null,
    run: snapshot.run
      ? {
          id: snapshot.run.run_id,
          status: snapshot.run.status,
          score: snapshot.run.score,
          checks: snapshot.run.checks.map((check) => ({
            id: check.check_id,
            name: check.name,
            category: check.category,
            status: check.status,
          })),
          issues: snapshot.run.issues.map((issue) => ({
            id: issue.issue_id,
            checkId: issue.check_id ?? null,
            category: issue.category,
            severity: issue.severity,
            priority: issue.priority,
            title: issue.title,
            description: issue.description,
          })),
        }
      : null,
  };
}

export function parseJsonPayload(text: string): { ok: true; payload: unknown } | { ok: false } {
  if (!text.trim()) return { ok: false };
  try {
    return { ok: true, payload: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}
