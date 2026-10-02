import type { NextRequest } from "next/server";
import { proxyAccountReportJson, validReportId } from "../../../../../../src/features/account/account-report-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function path(context: { readonly params: Promise<{ readonly reportId: string }> }) {
  const { reportId } = await context.params;
  return validReportId(reportId) ? `/v1/account/reports/${reportId}/share` : null;
}

export async function POST(request: NextRequest, context: { readonly params: Promise<{ readonly reportId: string }> }) {
  const resolved = await path(context);
  if (!resolved) return Response.json({ detail: { code: "account_invalid_request", message: "Invalid report identifier." } }, { status: 400, headers: { "cache-control": "no-store" } });
  return proxyAccountReportJson(request, { method: "POST", path: resolved, body: true });
}

export async function DELETE(request: NextRequest, context: { readonly params: Promise<{ readonly reportId: string }> }) {
  const resolved = await path(context);
  if (!resolved) return Response.json({ detail: { code: "account_invalid_request", message: "Invalid report identifier." } }, { status: 400, headers: { "cache-control": "no-store" } });
  return proxyAccountReportJson(request, { method: "DELETE", path: resolved });
}
