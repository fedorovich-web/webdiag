import type { Metadata } from "next";
import { AccountAuthForm } from "../../../src/features/account/account-auth-form";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    locale: "ru",
    title: "Вход в WebDiag",
    description: "Войдите в личный кабинет WebDiag и продолжите работу с проектами, аудитами и мониторингом.",
    canonical: "/login",
    ruPath: "/login",
    enPath: "/en/login",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="wd-auth-page">
      <AccountAuthForm locale="ru" mode="login" />
    </main>
  );
}
