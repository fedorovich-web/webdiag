import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";
import { AccountAIWorkspace } from "../../../../../src/features/account/account-ai-workspace";
import { pageMetadata } from "../../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "en",
    title: "AI tools",
    description: "WebDiag text AI tools for confirmed project evidence.",
    canonical: "/en/account/ai",
    ruPath: "/account/ai",
    enPath: "/en/account/ai",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AccountWorkspaceShell locale="en" section="ai">
      <AccountAIWorkspace locale="en" />
    </AccountWorkspaceShell>
  );
}
