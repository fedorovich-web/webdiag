import type { Metadata } from "next";
import { ContactPage } from "../../../src/features/contact/contact-page";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Контакты и поддержка WebDiag",
  description: "Свяжитесь с поддержкой WebDiag по вопросам сервиса, аккаунта, оплаты, ошибок и предложений по новым инструментам.",
  canonical: "/contacts",
  ruPath: "/contacts",
  enPath: "/en/contacts",
});

export default function Page() {
  return <ContactPage locale="ru" />;
}
