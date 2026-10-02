import { describe, expect, it } from "vitest";
import {
  isAccountReportDetailResponse,
  isAccountReportListResponse,
  isAccountReportShareResponse,
  isPublicReportResponse,
} from "./account-report-contract";

const snapshot = {
  contract_version: "webdiag.account.report_snapshot.v1",
  title: "Audit report",
  locale: "en",
  project_name: "Main",
  target_origin: "https://example.com",
  audit_completed_at: "2026-07-31T10:00:00Z",
  score: 90,
  checks: [],
  issues: [],
  generated_at: "2026-08-01T10:00:00Z",
} as const;
const summary = {
  id: "11111111-1111-4111-8111-111111111111",
  project_id: "22222222-2222-4222-8222-222222222222",
  audit_id: "33333333-3333-4333-8333-333333333333",
  title: "Audit report",
  locale: "en",
  status: "ready",
  created_at: "2026-08-01T10:00:00Z",
  updated_at: "2026-08-01T10:00:00Z",
  shared: false,
  share_expires_at: null,
} as const;
const listItem = {
  ...summary,
  project_name: snapshot.project_name,
  target_origin: snapshot.target_origin,
  audit_completed_at: snapshot.audit_completed_at,
} as const;

describe("account report contracts", () => {
  it("accepts exact private report list, detail, and share contracts", () => {
    expect(isAccountReportListResponse({
      contract_version: "webdiag.account.report_list.v2",
      reports: [listItem],
    })).toBe(true);
    expect(isAccountReportDetailResponse({
      contract_version: "webdiag.account.report_detail.v1",
      report: summary,
      snapshot,
    })).toBe(true);
    expect(isAccountReportShareResponse({
      contract_version: "webdiag.account.report_share.v1",
      report_id: summary.id,
      share_token: "A".repeat(43),
      share_path: `/reports/share/${"A".repeat(43)}`,
      expires_at: "2026-08-08T10:00:00Z",
    })).toBe(true);
    expect(isAccountReportShareResponse({
      contract_version: "webdiag.account.report_share.v1",
      report_id: summary.id,
      share_token: "A".repeat(43),
      share_path: "/reports/share/different-token",
      expires_at: "2026-08-08T10:00:00Z",
    })).toBe(false);
    expect(isAccountReportDetailResponse({
      contract_version: "webdiag.account.report_detail.v1",
      report: { ...summary, title: "Different title" },
      snapshot,
    })).toBe(false);
  });

  it("accepts the public report shape and rejects internal account identifiers", () => {
    expect(isPublicReportResponse({
      contract_version: "webdiag.public.report.v1",
      report: {
        title: "Audit report",
        locale: "en",
        created_at: "2026-08-01T10:00:00Z",
        expires_at: "2026-08-08T10:00:00Z",
      },
      snapshot,
    })).toBe(true);
    expect(isPublicReportResponse({
      contract_version: "webdiag.public.report.v1",
      report: { ...summary },
      snapshot,
    })).toBe(false);
    expect(isPublicReportResponse({
      contract_version: "webdiag.public.report.v1",
      report: {
        title: "Different title",
        locale: "en",
        created_at: "2026-08-01T10:00:00Z",
        expires_at: "2026-08-08T10:00:00Z",
      },
      snapshot,
    })).toBe(false);
  });

  it("rejects malformed report primitives and inconsistent share state", () => {
    const detail = (report: unknown, reportSnapshot: unknown = snapshot) => ({
      contract_version: "webdiag.account.report_detail.v1",
      report,
      snapshot: reportSnapshot,
    });
    expect(isAccountReportDetailResponse(detail({ ...summary, id: "not-a-uuid" }))).toBe(false);
    expect(isAccountReportDetailResponse(detail({ ...summary, created_at: "not-a-date" }))).toBe(false);
    expect(isAccountReportDetailResponse(detail({ ...summary, shared: true, share_expires_at: null }))).toBe(false);
    expect(isAccountReportDetailResponse(detail(summary, { ...snapshot, score: 100.5 }))).toBe(false);
    expect(isAccountReportDetailResponse(detail(summary, { ...snapshot, score: 101 }))).toBe(false);
    expect(isAccountReportDetailResponse(detail(summary, { ...snapshot, target_origin: "https://example.com/path" }))).toBe(false);
    expect(isAccountReportShareResponse({
      contract_version: "webdiag.account.report_share.v1",
      report_id: summary.id,
      share_token: "A".repeat(43),
      share_path: `/reports/share/${"A".repeat(43)}`,
      expires_at: "not-a-date",
    })).toBe(false);
    expect(isAccountReportListResponse({
      contract_version: "webdiag.account.report_list.v2",
      reports: [{ ...listItem, target_origin: "https://example.com/path" }],
    })).toBe(false);
    expect(isAccountReportListResponse({
      contract_version: "webdiag.account.report_list.v2",
      reports: [{ ...listItem, audit_completed_at: "2026-02-30T10:00:00Z" }],
    })).toBe(false);
  });
});
