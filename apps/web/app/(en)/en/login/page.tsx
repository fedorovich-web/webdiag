import type { Metadata } from "next";
import { AccountAuthForm } from "../../../../src/features/account/account-auth-form";
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

export default async function Page({ searchParams }: { searchParams: Promise<{ return_to?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="wd-auth-page">
      <AccountAuthForm locale="en" mode="login" returnTo={params.return_to} oauthError={params.error} key={`${params.return_to}:${params.error}`} />
    </main>
  );
}
