import type { Metadata } from "next";
import { AccountAuthForm } from "../../../src/features/account/account-auth-form";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
  locale: "ru",
  title: "Вход в личный кабинет",
  description: "Войдите в аккаунт WebDiag через защищённую серверную сессию.",
  canonical: "/login",
  ruPath: "/login",
  enPath: "/en/login",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <main className="shell wd-account-page"><AccountAuthForm locale="ru" mode="login" /></main>;
}
