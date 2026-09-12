import type { NextRequest } from "next/server";
import { proxyAccountWorkspace } from "../../../../src/features/account/account-workspace-proxy";
export function GET(request: NextRequest) { return proxyAccountWorkspace(request, { method: "GET", path: "/v1/account/monitors" }); }
