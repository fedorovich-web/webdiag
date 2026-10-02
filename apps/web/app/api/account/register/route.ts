import { NextRequest, NextResponse } from "next/server";
import { createAccountProxy } from "../../../../src/features/account/account-proxy";
import { sendWelcomeEmail } from "../../../../src/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyHandler = createAccountProxy({ method: "POST", path: "/v1/account/register", body: true });

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Clone request so we can inspect body for email delivery without disturbing stream
  let registeredEmail: string | null = null;
  try {
    const clone = request.clone();
    const json = await clone.json();
    if (json && typeof json.email === "string") {
      registeredEmail = json.email.trim();
    }
  } catch {
    // Ignore parsing error, proxy will handle validation
  }

  const response = await proxyHandler(request);

  if (response.status >= 200 && response.status < 300 && registeredEmail) {
    // Determine locale from referer or accept-language
    const referer = request.headers.get("referer") || "";
    const locale = referer.includes("/en") ? "en" : "ru";
    // Fire welcome email asynchronously from no-replay@webdiag.ru via Resend
    sendWelcomeEmail(registeredEmail, locale).catch((err) => {
      console.warn("[Welcome Email] Failed to dispatch welcome email via Resend:", err);
    });
  }

  return response;
}
