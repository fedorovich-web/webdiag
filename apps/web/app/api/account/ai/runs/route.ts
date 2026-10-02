import type { NextRequest } from "next/server";
import { proxyAccountAI } from "../../../../../src/features/account/account-ai-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  if (request.nextUrl.search) {
    return Response.json(
      { detail: { code: "account_invalid_request", message: "Invalid AI run query." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  return proxyAccountAI(request, { method: "GET", path: "/v1/account/ai/runs" });
}

export function POST(request: NextRequest) {
  if (request.nextUrl.search) {
    return Response.json(
      { detail: { code: "account_invalid_request", message: "Invalid AI run request." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  return proxyAccountAI(request, {
    method: "POST",
    path: "/v1/account/ai/runs",
    body: true,
    requireIdempotencyKey: true,
  });
}
