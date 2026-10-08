import { after, NextRequest, NextResponse } from "next/server";
import { createAccountProxy } from "../../../../src/features/account/account-proxy";
import { sendWelcomeEmail } from "../../../../src/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyHandler = createAccountProxy({ method: "POST", path: "/v1/account/register", body: true });

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = await proxyHandler(request);
  if (response.ok) {
    const account = await response.clone().json();
    if (typeof account?.user?.email === "string") {
      const email = account.user.email;
      const locale = /^https?:\/\/[^/]+\/en(?:\/|$)/u.test(request.headers.get("referer") || "") ? "en" : "ru";
      after(() => sendWelcomeEmail(email, locale));
    }
  }

  return response;
}
