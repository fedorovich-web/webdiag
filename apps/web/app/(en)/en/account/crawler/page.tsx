import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";
import { pageMetadata } from "../../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "en",
    title: "Website & Project Crawler — WebDiag",
    description: "Multi-page website crawler and structure audit in WebDiag workspace.",
    canonical: "/en/account/crawler",
    ruPath: "/account/crawler",
    enPath: "/en/account/crawler",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountWorkspaceShell locale="en" section="projects" />;
}
