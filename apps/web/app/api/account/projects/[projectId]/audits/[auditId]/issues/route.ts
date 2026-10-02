import type { NextRequest } from "next/server";
import { accountIssueListPath } from "../../../../../../../../src/features/account/account-issues-contract";
import { proxyAccountWorkspace } from "../../../../../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalid() {
  return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid issue filters." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(
  request: NextRequest,
  context: {
    readonly params: Promise<{ readonly projectId: string; readonly auditId: string }>;
  },
) {
  const { projectId, auditId } = await context.params;
  const path = accountIssueListPath(projectId, auditId, request.nextUrl.searchParams);
  if (!path) return invalid();
  return proxyAccountWorkspace(request, { method: "GET", path });
}
