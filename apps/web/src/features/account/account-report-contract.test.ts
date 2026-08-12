import {
  isAccountReportDetailResponse,
  isAccountReportListResponse,
  isAccountReportShareResponse,
  isPublicReportResponse,
} from "./account-report-contract";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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

assert(isAccountReportListResponse({ contract_version: "webdiag.account.report_list.v1", reports: [summary] }), "report list must validate");
assert(isAccountReportDetailResponse({ contract_version: "webdiag.account.report_detail.v1", report: summary, snapshot }), "report detail must validate");
assert(isAccountReportShareResponse({ contract_version: "webdiag.account.report_share.v1", report_id: summary.id, share_token: "A".repeat(43), share_path: `/reports/share/${"A".repeat(43)}`, expires_at: "2026-08-08T10:00:00Z" }), "share response must validate");
assert(isPublicReportResponse({ contract_version: "webdiag.public.report.v1", report: { title: "Audit report", locale: "en", created_at: "2026-08-01T10:00:00Z", expires_at: "2026-08-08T10:00:00Z" }, snapshot }), "public report must validate");
assert(!isPublicReportResponse({ contract_version: "webdiag.public.report.v1", report: { ...summary }, snapshot }), "public report must reject internal IDs");
console.log("account report contract: PASS");
