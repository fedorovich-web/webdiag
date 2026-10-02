import type { NextRequest } from "next/server";
import { proxyAccountMonitor } from "../../../../../../../src/features/account/account-monitoring-proxy";
export function POST(request: NextRequest, context: { params: Promise<{ projectId: string }> }) { return context.params.then(({ projectId }) => proxyAccountMonitor(request, { projectId, suffix: "/run", method: "POST" })); }
