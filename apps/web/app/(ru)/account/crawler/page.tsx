import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "ru",
    title: "Краулер сайтов и проектов — WebDiag",
    description: "Многостраничный краулер и аудит структуры сайта в личном кабинете WebDiag.",
    canonical: "/account/crawler",
    ruPath: "/account/crawler",
    enPath: "/en/account/crawler",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountWorkspaceShell locale="ru" section="projects" />;
}
