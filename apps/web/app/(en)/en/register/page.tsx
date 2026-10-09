import type { Metadata } from "next";
import { AccountAuthForm } from "../../../../src/features/account/account-auth-form";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "en",
    title: "Create a WebDiag account",
    description: "Create a WebDiag account for projects, reports, and website monitoring.",
    canonical: "/en/register",
    ruPath: "/register",
    enPath: "/en/register",
  }),
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ return_to?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="wd-auth-page">
      <AccountAuthForm locale="en" mode="register" returnTo={params.return_to} oauthError={params.error} key={`${params.return_to}:${params.error}`} />
    </main>
  );
}
