import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "en",
    title: "Account",
    description: "WebDiag account projects and saved audits.",
    canonical: "/en/account",
    ruPath: "/account",
    enPath: "/en/account",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountWorkspaceShell locale="en" section="overview" />;
}
