import type { NextRequest } from "next/server";
import { accountIssueDetailPath } from "../../../../../../../../../src/features/account/account-issues-contract";
import { proxyAccountWorkspace } from "../../../../../../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalid() {
  return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid issue identifier." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(
  request: NextRequest,
  context: {
    readonly params: Promise<{
      readonly projectId: string;
      readonly auditId: string;
      readonly issueId: string;
    }>;
  },
) {
  const { projectId, auditId, issueId } = await context.params;
  const path = accountIssueDetailPath(projectId, auditId, issueId, request.nextUrl.searchParams);
  if (!path) return invalid();
  return proxyAccountWorkspace(request, { method: "GET", path });
}
