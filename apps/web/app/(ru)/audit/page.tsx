import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Технический аудит сайта и SEO-отчёт",
  description: "Технический SEO-аудит сайта: обход страниц, проблемы, приоритеты, затронутые URL и повторная проверка исправлений.",
  canonical: "/audit",
  ruPath: "/audit",
  enPath: "/en/audit",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Технический аудит сайта с приоритетами исправлений</h1>
        <p>Будущий audit engine WebDiag будет проходить по URL, sitemap и внутренним ссылкам, собирать технические проблемы и показывать, какие страницы затронуты.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Состав аудита">
        <article><h2>Что проверяется</h2><p>Индексация, robots.txt, sitemap, canonical, статусы ответа, редиректы, мета-теги, скорость, SSL и доступность.</p></article>
        <article><h2>Что получает пользователь</h2><p>Сводная оценка, список проблем, приоритеты, затронутые URL, рекомендации и повторная проверка после исправлений.</p></article>
        <article><h2>Статус</h2><p>До запуска audit engine доступны пример отчёта и рабочие вспомогательные инструменты.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Полный аудит будет платным по объёму сайта</strong>
        <p>Предварительная цена начинается от 490 ₽ для небольших сайтов. Перед запуском проверки WebDiag должен показывать лимиты и стоимость.</p>
        <Link className="wd-button wd-button-primary" href="/pricing">Посмотреть тарифы</Link>
      </section>
    </main>
  );
}
