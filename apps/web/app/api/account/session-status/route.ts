import type { NextRequest } from "next/server";
import { resolveRequestSessionCookie } from "../../../../src/features/account/account-proxy-contract";
import { accountSessionStatus } from "../../../../src/features/account/account-session-status";

const publicOrigins = new Set(["https://webdiag.ru", "https://www.webdiag.ru"]);

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "cache-control": "private, no-store",
    vary: "Origin",
    "x-robots-tag": "noindex, nofollow",
  });
  if (origin && publicOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
  } else if (origin && origin !== request.nextUrl.origin) {
    return new Response(null, { status: 403, headers });
  }
  const status = await accountSessionStatus(resolveRequestSessionCookie(request));
  return new Response(null, { status, headers });
}
