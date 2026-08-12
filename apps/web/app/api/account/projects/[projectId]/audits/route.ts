import type { NextRequest } from "next/server";
import {
  accountWorkspacePath,
  proxyAccountWorkspace,
} from "../../../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { readonly params: Promise<{ readonly projectId: string }> },
) {
  const { projectId } = await context.params;
  const projectPath = accountWorkspacePath([projectId]);
  if (!projectPath) return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid project identifier." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
  return proxyAccountWorkspace(request, { method: "POST", path: `${projectPath}/audits` });
}
