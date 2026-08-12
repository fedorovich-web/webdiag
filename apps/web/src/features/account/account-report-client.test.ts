import {
  createAccountReport,
  enableAccountReportShare,
  getPublicReport,
  listAccountReports,
} from "./account-report-client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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

const calls: Array<{ input: string; init?: RequestInit }> = [];
const fetcher = async (input: string, init?: RequestInit): Promise<Response> => {
  calls.push({ input, init });
  if (input.endsWith("/reports") && init?.method === "POST") {
    return Response.json({ contract_version: "webdiag.account.report_detail.v1", report: summary, snapshot });
  }
  if (input.endsWith("/share")) {
    return Response.json({
      contract_version: "webdiag.account.report_share.v1",
      report_id: summary.id,
      share_token: "A".repeat(43),
      share_path: `/reports/share/${"A".repeat(43)}`,
      expires_at: "2026-08-08T10:00:00Z",
    });
  }
  if (input.startsWith("/api/reports/share/")) {
    return Response.json({
      contract_version: "webdiag.public.report.v1",
      report: {
        title: summary.title,
        locale: "en",
        created_at: summary.created_at,
        expires_at: "2026-08-08T10:00:00Z",
      },
      snapshot,
    });
  }
  return Response.json({ contract_version: "webdiag.account.report_list.v1", reports: [summary] });
};

async function main() {
  await createAccountReport(summary.project_id, summary.audit_id, { title: summary.title, locale: "en" }, fetcher);
  await listAccountReports(fetcher);
  await enableAccountReportShare(summary.id, 7, fetcher);
  await getPublicReport("A".repeat(43), fetcher);

  assert(calls[0]?.input.endsWith(`/audits/${summary.audit_id}/reports`), "create path must be scoped to the saved audit");
  assert(calls[0]?.init?.credentials === "same-origin", "private report calls must use same-origin credentials");
  assert(calls[0]?.init?.body === JSON.stringify({ title: summary.title, locale: "en" }), "create body must contain only title and locale");
  assert(calls[2]?.init?.body === JSON.stringify({ expires_in_days: 7 }), "share body must contain only expiry");
  assert(calls[3]?.init?.credentials === "omit", "public report fetch must omit account credentials");
  console.log("account report client: PASS");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
