import type { NextRequest } from "next/server";
import { proxyReportHtml, validReportId } from "../../../../../../src/features/account/account-report-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { readonly params: Promise<{ readonly reportId: string }> }) {
  const { reportId } = await context.params;
  if (!validReportId(reportId)) return Response.json({ detail: { code: "account_invalid_request", message: "Invalid report identifier." } }, { status: 400, headers: { "cache-control": "no-store" } });
  return proxyReportHtml(request, { path: `/v1/account/reports/${reportId}/export.html` });
}
