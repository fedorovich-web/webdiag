import type { Metadata } from "next";
import { AccountAuthForm } from "../../../../src/features/account/account-auth-form";
import { redirectExistingAccountSession } from "../../../../src/features/account/account-login-session";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "en",
    title: "Sign in to WebDiag",
    description: "Sign in to WebDiag and continue working with projects, audits, and monitoring.",
    canonical: "/en/login",
    ruPath: "/login",
    enPath: "/en/login",
  }),
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ return_to?: string | string[]; error?: string | string[] }> }) {
  const params = await searchParams;
  const returnTo = typeof params.return_to === "string" ? params.return_to : undefined;
  const oauthError = typeof params.error === "string" ? params.error : undefined;
  if (!oauthError) await redirectExistingAccountSession("en", returnTo);
  return (
    <main className="wd-auth-page">
      <AccountAuthForm locale="en" mode="login" returnTo={returnTo} oauthError={oauthError} key={returnTo + ":" + oauthError} />
    </main>
  );
}
