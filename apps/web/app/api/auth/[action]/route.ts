import type { NextRequest } from "next/server";

import { proxyAuthRequest } from "../../../../src/features/auth/auth-proxy";

type RouteContext = { params: Promise<{ action: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  return proxyAuthRequest(request, action, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  return proxyAuthRequest(request, action, "POST");
}
