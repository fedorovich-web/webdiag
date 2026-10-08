import { NextRequest, NextResponse } from "next/server";
import { accountReturnPath } from "./account-navigation";
export { accountReturnPath } from "./account-navigation";

export const OAUTH_STATE = "yandex_oauth_state";
export const OAUTH_VERIFIER = "yandex_oauth_verifier";
export const OAUTH_RETURN = "yandex_oauth_return";
export const OAUTH_LINK = "yandex_oauth_link";

export function accountPublicOrigin(): string {
  const url = new URL(process.env.WEBDIAG_ACCOUNT_PUBLIC_ORIGIN || "https://app.webdiag.ru");
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Invalid account public origin");
  }
  return url.origin;
}

export function oauthCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set(name, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
}

export function clearOAuthCookies(response: NextResponse) {
  for (const name of [OAUTH_STATE, OAUTH_VERIFIER, OAUTH_RETURN]) response.cookies.delete(name);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
}

export async function readOAuthJson(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty OAuth response");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 65536) throw new Error("Oversized OAuth response");
      chunks.push(chunk.value);
    }
  } finally { await reader.cancel(); }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid OAuth response");
  return value as Record<string, unknown>;
}

export function oauthDestination(request: NextRequest): string {
  return accountReturnPath(request.cookies.get(OAUTH_RETURN)?.value);
}
