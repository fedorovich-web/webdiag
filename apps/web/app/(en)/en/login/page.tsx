import type { Metadata } from "next";
import { AccountAuthForm } from "../../../../src/features/account/account-auth-form";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
  locale: "en",
  title: "Sign in",
  description: "Sign in to WebDiag using a secure server-side session.",
  canonical: "/en/login",
  ruPath: "/login",
  enPath: "/en/login",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <main className="shell wd-account-page"><AccountAuthForm locale="en" mode="login" /></main>;
}
