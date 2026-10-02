import type { NextRequest } from "next/server";
import { proxyAccountWorkspace } from "../../../../src/features/account/account-workspace-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return proxyAccountWorkspace(request, { method: "GET", path: "/v1/account/projects" });
}

export function POST(request: NextRequest) {
  return proxyAccountWorkspace(request, {
    method: "POST",
    path: "/v1/account/projects",
    body: true,
  });
}
