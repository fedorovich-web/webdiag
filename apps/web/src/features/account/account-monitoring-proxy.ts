import type { NextRequest } from "next/server";
import { validAccountResourceId, proxyAccountWorkspace } from "./account-workspace-proxy";

export function accountMonitorPath(projectId: string, suffix = ""): string | null {
  if (!validAccountResourceId(projectId)) return null;
  if (!["", "/history", "/run"].includes(suffix)) return null;
  return `/v1/account/projects/${projectId}/monitor${suffix}`;
}

export function proxyAccountMonitor(
  request: NextRequest,
  options: {
    readonly projectId: string;
    readonly suffix?: "" | "/history" | "/run";
    readonly method: "GET" | "POST" | "PATCH";
    readonly body?: boolean;
  },
) {
  const path = accountMonitorPath(options.projectId, options.suffix ?? "");
  if (!path || request.nextUrl.search) {
    return Response.json(
      { detail: { code: "account_invalid_request", message: "Invalid monitoring request." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  return proxyAccountWorkspace(request, {
    method: options.method,
    path,
    body: options.body,
  });
}
