import type { NextRequest } from "next/server";
import {
  accountCrawlPath,
  proxyAccountWorkspace,
} from "../../../../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { readonly params: Promise<{ readonly projectId: string; readonly jobId: string }> },
) {
  const { projectId, jobId } = await context.params;
  const path = accountCrawlPath(projectId, jobId);
  if (!path) return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid crawl identifier." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
  return proxyAccountWorkspace(request, { method: "GET", path });
}
