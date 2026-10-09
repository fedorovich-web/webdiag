import type { NextRequest } from "next/server";

export function isAccountWriteAllowed(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin || origin === (process.env.WEBDIAG_ACCOUNT_PUBLIC_ORIGIN || "https://app.webdiag.ru");
}
