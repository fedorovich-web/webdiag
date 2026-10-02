import type { NextRequest } from "next/server";
import {
  accountAIRunPath,
  proxyAccountAI,
} from "../../../../../../src/features/account/account-ai-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { readonly params: Promise<{ readonly runId: string }> };

function invalidRequest() {
  return Response.json(
    { detail: { code: "account_invalid_request", message: "Invalid AI run request." } },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const path = accountAIRunPath((await context.params).runId);
  if (!path || request.nextUrl.search) return invalidRequest();
  return proxyAccountAI(request, { method: "GET", path });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const path = accountAIRunPath((await context.params).runId);
  if (!path || request.nextUrl.search) return invalidRequest();
  return proxyAccountAI(request, { method: "DELETE", path });
}
