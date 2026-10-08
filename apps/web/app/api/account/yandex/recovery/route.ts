import { NextRequest, NextResponse } from "next/server";
import { resolveAccountApiBaseUrl, selectAccountSetCookie } from "../../../../../src/features/account/account-proxy-contract";
import { isAccountWriteAllowed } from "../../../../../src/features/account/account-origin";
import { OAUTH_LINK, readOAuthJson } from "../../../../../src/features/account/yandex-flow";
import { sendTransactionalEmailViaResend } from "../../../../../src/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
const error = (code: string, status: number) => json({ detail: { code, message: "Yandex account confirmation could not be completed." } }, status);

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAccountWriteAllowed(request)) return error("account_cross_origin", 403);
  const token = request.cookies.get(OAUTH_LINK)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43,128}$/u.test(token)) return error("account_oauth_link_expired", 409);
  try {
    const data = await readOAuthJson(new Response(request.body));
    if ("code" in data && typeof data.code !== "string") return error("account_oauth_recovery_invalid", 400);
    const verifying = typeof data.code === "string";
    if (verifying && !/^\d{6}$/u.test(String(data.code))) return error("account_oauth_recovery_invalid", 400);
    if (!verifying && (!process.env.RESEND_API_KEY || !process.env.WEBDIAG_ACCOUNT_INTERNAL_TOKEN)) return error("account_email_unavailable", 503);
    const upstream = await fetch(`${resolveAccountApiBaseUrl()}/v1/account/oauth/yandex/${verifying ? "recover" : "recovery"}`, {
      method: "POST", headers: { "content-type": "application/json", ...(!verifying ? { authorization: `Bearer ${process.env.WEBDIAG_ACCOUNT_INTERNAL_TOKEN}` } : {}) },
      body: JSON.stringify({ token, ...(verifying ? { code: data.code } : {}) }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
    });
    if (!upstream.ok) return json(await readOAuthJson(upstream), upstream.status);
    if (verifying) {
      const sessionCookie = selectAccountSetCookie(upstream.headers.get("set-cookie"));
      if (!sessionCookie) return error("account_api_invalid_response", 502);
      const response = json({ confirmed: true });
      response.cookies.delete(OAUTH_LINK);
      response.headers.append("set-cookie", sessionCookie);
      return response;
    }
    const proof = await readOAuthJson(upstream);
    if (typeof proof.email !== "string" || typeof proof.code !== "string" || !/^\d{6}$/u.test(proof.code)) return error("account_api_invalid_response", 502);
    const ru = data.locale !== "en";
    const message = ru ? `Код подтверждения WebDiag: ${proof.code}. Действует 10 минут. Если вы не запрашивали вход, не сообщайте этот код.` : `Your WebDiag confirmation code: ${proof.code}. It expires in 10 minutes. If you did not request sign-in, do not share this code.`;
    const sent = await sendTransactionalEmailViaResend({ to: proof.email,
      subject: ru ? "Подтверждение входа в WebDiag" : "Confirm WebDiag sign-in", html: `<p>${message}</p>`, text: message });
    if (!sent.success) return error("account_email_unavailable", 503);
    return json({ sent: true });
  } catch { return error("account_api_unavailable", 502); }
}
