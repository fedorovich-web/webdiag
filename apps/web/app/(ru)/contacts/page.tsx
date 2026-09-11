import type { Metadata } from "next";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Контакты",
  description: "Связаться с поддержкой WebDiag по вопросам аккаунта, диагностики сайтов и работы сервиса.",
  canonical: "/contacts",
  ruPath: "/contacts",
  enPath: "/en/contacts",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Контакты</h1>
        <p>По вопросам аккаунта, работы инструментов и сервиса напишите в поддержку WebDiag.</p>
      </header>
      <section className="wd-internal-note" aria-labelledby="support-title">
        <strong id="support-title">Поддержка</strong>
        <p>
          <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>
        </p>
      </section>
    </main>
  );
}
