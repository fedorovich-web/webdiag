import type { NextRequest } from "next/server";
import { proxyAccountReportJson } from "../../../../src/features/account/account-report-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return proxyAccountReportJson(request, { method: "GET", path: "/v1/account/reports" });
}
