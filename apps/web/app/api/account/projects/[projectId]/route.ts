import type { NextRequest } from "next/server";
import {
  accountWorkspacePath,
  proxyAccountWorkspace,
} from "../../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { readonly params: Promise<{ readonly projectId: string }> },
) {
  const { projectId } = await context.params;
  const path = accountWorkspacePath([projectId]);
  if (!path) return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid project identifier." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
  return proxyAccountWorkspace(request, { method: "GET", path });
}

export async function PATCH(
  request: NextRequest,
  context: { readonly params: Promise<{ readonly projectId: string }> },
) {
  const { projectId } = await context.params;
  const path = accountWorkspacePath([projectId]);
  if (!path) return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid project identifier." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
  return proxyAccountWorkspace(request, { method: "PATCH", path, body: true });
}
