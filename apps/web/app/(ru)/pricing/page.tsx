import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Цены на технический аудит и мониторинг сайта",
  description: "Предварительные тарифы WebDiag: бесплатная проверка URL, разовые проверки, полный аудит сайта и мониторинг.",
  canonical: "/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Цены на аудит сайта, разовые проверки и мониторинг</h1>
        <p>Базовые проверки остаются бесплатными. Полный аудит, расширенные лимиты и мониторинг оплачиваются отдельно.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Модель тарифов">
        <article><h2>Бесплатно — 0 ₽</h2><p>Экспресс-проверка одного URL и базовые инструменты без истории проекта.</p></article>
        <article><h2>Разовые проверки — от 99 ₽</h2><p>Sitemap, битые ссылки, изображения, HTML validation и AI-помощники оплачиваются за запуск.</p></article>
        <article><h2>Полный аудит — от 490 ₽</h2><p>Технический SEO-аудит сайта с приоритетами и затронутыми URL.</p></article>
        <article><h2>Мониторинг — от 299 ₽/мес</h2><p>Регулярный контроль сайта после релизов и SEO-изменений.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Цены предварительные</strong>
        <p>Итоговые тарифы будут уточняться после проверки себестоимости audit engine, лимитов страниц и частоты мониторинга.</p>
        <Link className="wd-button wd-button-primary" href="/tools">Открыть инструменты</Link>
      </section>
    </main>
  );
}
