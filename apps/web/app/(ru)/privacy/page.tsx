import type { Metadata } from "next";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности WebDiag: какие данные обрабатываются при использовании сайта, инструментов, аудита и личного кабинета.",
  canonical: "/privacy",
  ruPath: "/privacy",
  enPath: "/en/privacy",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page wd-legal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Политика конфиденциальности</h1>
        <p>
          Документ описывает базовые принципы обработки данных при использовании сайта WebDiag, инструментов, аудита и личного кабинета.
        </p>
      </header>
      <section className="wd-internal-grid wd-legal-grid" aria-label="Разделы политики конфиденциальности">
        <article>
          <h2>Какие данные могут обрабатываться</h2>
          <p>URL, технические параметры проверки, данные браузера, язык интерфейса и обезличенные события использования сайта.</p>
        </article>
        <article>
          <h2>Зачем это нужно</h2>
          <p>Чтобы выполнить проверку, показать результат, улучшать интерфейс, защищать сервис от злоупотреблений и развивать качество диагностики.</p>
        </article>
        <article>
          <h2>Что не является целью</h2>
          <p>WebDiag не использует введённые URL для публикации закрытой информации, перепродажи данных или несанкционированного доступа к сайтам.</p>
        </article>
      </section>
      <section className="wd-internal-note">
        <strong>Контакты по вопросам конфиденциальности</strong>
        <p>Если у вас есть вопрос об обработке данных, напишите на <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>.</p>
      </section>
    </main>
  );
}
