import { describe, expect, it } from "vitest";
import {
  BACKEND_AUDIT_CONTRACT_VERSION,
  FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
  isAuditFrontendResult,
  isBackendAuditSnapshotResponse,
  parseJsonPayload,
  toAuditFrontendResult,
  type BackendAuditSnapshotResponse,
} from "./audit-contract";

const backendSnapshot: BackendAuditSnapshotResponse = {
  contract_version: BACKEND_AUDIT_CONTRACT_VERSION,
  generated_at: "2026-07-21T00:00:00Z",
  summary: {
    job_id: "00000000-0000-0000-0000-000000000000",
    status: "succeeded",
    run: {
      status: "succeeded",
      score: 74,
      check_count: 4,
      issue_count: 1,
      checks_by_status: { passed: 2, warning: 2 },
      issues_by_severity: { medium: 1 },
      issues_by_priority: { p1: 1 },
      highest_severity: "medium",
      top_priority: "p1",
    },
  },
  job: {
    job_id: "00000000-0000-0000-0000-000000000000",
    status: "succeeded",
    target: {
      original_url: "https://example.ru/page",
      normalized_url: "https://example.ru/page",
      hostname: "example.ru",
      scope: "single_url",
    },
  },
  run: {
    run_id: "11111111-1111-1111-1111-111111111111",
    status: "succeeded",
    score: 74,
    checks: [{ check_id: "metadata.title", name: "Title", category: "metadata", status: "warning" }],
    issues: [
      {
        issue_id: "metadata.title.missing",
        check_id: "metadata.title",
        category: "metadata",
        severity: "medium",
        priority: "p1",
        title: "Title is missing",
        description: "The page has no title tag.",
      },
    ],
  },
};

describe("audit frontend contract", () => {
  it("validates backend snapshots and maps them to a frontend-safe result", () => {
    expect(isBackendAuditSnapshotResponse(backendSnapshot)).toBe(true);

    const frontend = toAuditFrontendResult(backendSnapshot);

    expect(frontend).toMatchObject({
      contractVersion: FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
      sourceContractVersion: BACKEND_AUDIT_CONTRACT_VERSION,
      job: { id: "00000000-0000-0000-0000-000000000000", target: { hostname: "example.ru" } },
      summary: { score: 74, checkCount: 4, issueCount: 1, topPriority: "p1" },
      run: {
        id: "11111111-1111-1111-1111-111111111111",
        checks: [{ id: "metadata.title" }],
        issues: [{ id: "metadata.title.missing", checkId: "metadata.title" }],
      },
    });
    expect(isAuditFrontendResult(frontend)).toBe(true);
  });

  it("rejects raw backend snapshots as frontend results", () => {
    expect(isAuditFrontendResult(backendSnapshot)).toBe(false);
  });

  it("parses JSON defensively", () => {
    expect(parseJsonPayload(JSON.stringify({ ok: true }))).toEqual({ ok: true, payload: { ok: true } });
    expect(parseJsonPayload("not-json")).toEqual({ ok: false });
    expect(parseJsonPayload("   ")).toEqual({ ok: false });
  });
});
