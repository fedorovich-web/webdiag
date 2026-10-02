import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";
import { AccountAIWorkspace } from "../../../../src/features/account/account-ai-workspace";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "ru",
    title: "AI-инструменты",
    description: "Текстовые AI-инструменты WebDiag для подтверждённых данных проектов.",
    canonical: "/account/ai",
    ruPath: "/account/ai",
    enPath: "/en/account/ai",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AccountWorkspaceShell locale="ru" section="ai">
      <AccountAIWorkspace locale="ru" />
    </AccountWorkspaceShell>
  );
}
