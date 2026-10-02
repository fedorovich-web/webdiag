import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../src/features/account/account-workspace-shell";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "ru",
    title: "Личный кабинет",
    description: "Проекты и сохранённые аудиты аккаунта WebDiag.",
    canonical: "/account",
    ruPath: "/account",
    enPath: "/en/account",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountWorkspaceShell locale="ru" section="overview" />;
}
