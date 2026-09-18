import type { NextRequest } from "next/server";
import {
  accountCrawlPath,
  proxyAccountWorkspace,
} from "../../../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(request: NextRequest, projectId: string, method: "GET" | "POST") {
  const path = accountCrawlPath(projectId);
  if (!path) return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid project identifier." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
  return proxyAccountWorkspace(request, { method, path });
}

export async function GET(request: NextRequest, context: { readonly params: Promise<{ readonly projectId: string }> }) {
  const { projectId } = await context.params;
  return forward(request, projectId, "GET");
}

export async function POST(request: NextRequest, context: { readonly params: Promise<{ readonly projectId: string }> }) {
  const { projectId } = await context.params;
  return forward(request, projectId, "POST");
}
