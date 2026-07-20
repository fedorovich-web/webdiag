import type { Metadata } from "next";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности WebDiag: какие данные обрабатываются при использовании сайта, инструментов и будущих проверок.",
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
          Документ описывает базовые принципы обработки данных на сайте WebDiag, в каталоге инструментов и в будущих сценариях технического аудита.
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
          <p>WebDiag не должен использовать введённые URL для публикации закрытой информации, перепродажи данных или несанкционированного доступа к сайтам.</p>
        </article>
      </section>
      <section className="wd-internal-note">
        <strong>Полная юридическая редакция будет уточнена перед публичным запуском</strong>
        <p>До production-релиза текст политики должен быть проверен с учётом фактической архитектуры, хранения данных, аналитики, платежей и уведомлений.</p>
      </section>
    </main>
  );
}
