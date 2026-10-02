import type { NextRequest } from "next/server";
import { accountReportListUpstreamPath } from "../../../../src/features/account/account-report-query";
import { proxyAccountReportJson } from "../../../../src/features/account/account-report-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const path = accountReportListUpstreamPath(request.nextUrl.searchParams);
  if (!path) {
    return Response.json(
      { detail: { code: "account_invalid_request", message: "Invalid report query." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  return proxyAccountReportJson(request, { method: "GET", path });
}
