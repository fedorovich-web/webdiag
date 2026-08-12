import type { NextRequest } from "next/server";
import { proxyReportHtml, validReportShareToken } from "../../../../../../src/features/account/account-report-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { readonly params: Promise<{ readonly shareToken: string }> }) {
  const { shareToken } = await context.params;
  if (!validReportShareToken(shareToken)) return Response.json({ detail: { code: "public_report_not_found", message: "Report was not found." } }, { status: 404, headers: { "cache-control": "no-store" } });
  return proxyReportHtml(request, { path: `/v1/public/reports/${shareToken}/export.html`, authenticated: false });
}
