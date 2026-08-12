import type { Metadata } from "next";
import { AccountAuthForm } from "../../../../src/features/account/account-auth-form";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
  locale: "en",
  title: "Create an account",
  description: "Create a WebDiag account with a secure server-side session.",
  canonical: "/en/register",
  ruPath: "/register",
  enPath: "/en/register",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <main className="shell wd-account-page"><AccountAuthForm locale="en" mode="register" /></main>;
}
