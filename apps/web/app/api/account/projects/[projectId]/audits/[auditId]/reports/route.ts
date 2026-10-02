import type { NextRequest } from "next/server";
import { proxyAccountReportJson } from "../../../../../../../../src/features/account/account-report-proxy";
import { validAccountResourceId } from "../../../../../../../../src/features/account/account-workspace-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, context: { readonly params: Promise<{ readonly projectId: string; readonly auditId: string }> }) {
  const { projectId, auditId } = await context.params;
  if (!validAccountResourceId(projectId) || !validAccountResourceId(auditId)) return Response.json({ detail: { code: "account_invalid_request", message: "Invalid project or audit identifier." } }, { status: 400, headers: { "cache-control": "no-store" } });
  return proxyAccountReportJson(request, { method: "POST", path: `/v1/account/projects/${projectId}/audits/${auditId}/reports`, body: true });
}
