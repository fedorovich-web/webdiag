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

export default function Page() {
  return (
    <main className="wd-auth-page">
      <AccountAuthForm locale="en" mode="login" />
    </main>
  );
}
