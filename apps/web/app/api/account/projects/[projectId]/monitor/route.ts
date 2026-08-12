import type { NextRequest } from "next/server";
import { proxyAccountMonitor } from "../../../../../../src/features/account/account-monitoring-proxy";
export function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) { return context.params.then(({ projectId }) => proxyAccountMonitor(request, { projectId, method: "GET" })); }
export function POST(request: NextRequest, context: { params: Promise<{ projectId: string }> }) { return context.params.then(({ projectId }) => proxyAccountMonitor(request, { projectId, method: "POST", body: true })); }
export function PATCH(request: NextRequest, context: { params: Promise<{ projectId: string }> }) { return context.params.then(({ projectId }) => proxyAccountMonitor(request, { projectId, method: "PATCH", body: true })); }
