import type { Metadata } from "next";
import { AccountAuthForm } from "../../../src/features/account/account-auth-form";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
  locale: "ru",
  title: "Регистрация в WebDiag",
  description: "Создайте аккаунт WebDiag с защищённой серверной сессией.",
  canonical: "/register",
  ruPath: "/register",
  enPath: "/en/register",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <main className="shell wd-account-page"><AccountAuthForm locale="ru" mode="register" /></main>;
}
