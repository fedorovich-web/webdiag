import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Мониторинг сайта после правок и релизов",
  description: "Мониторинг сайта WebDiag: регулярный контроль доступности, SSL, SEO-изменений, новых ошибок и технических регрессий.",
  canonical: "/monitoring",
  ruPath: "/monitoring",
  enPath: "/en/monitoring",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Мониторинг сайта после релизов, миграций и SEO-правок</h1>
        <p>Мониторинг нужен, чтобы не пропустить новые технические ошибки, возврат исправленных проблем и сбои доступности после изменений на сайте.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Возможности мониторинга">
        <article><h2>Регулярные проверки</h2><p>Плановый контроль доступности, SSL, sitemap, robots.txt, canonical, noindex и статусов ответа.</p></article>
        <article><h2>Регрессии</h2><p>Сравнение состояния сайта после релиза с предыдущими проверками.</p></article>
        <article><h2>История</h2><p>Динамика ошибок, исправлений и технического состояния проекта.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Подписка вместо разовых запусков</strong>
        <p>Предварительный старт мониторинга — от 299 ₽/мес. Лимиты будут зависеть от количества проектов, URL и частоты проверок.</p>
        <Link className="wd-button wd-button-primary" href="/pricing">Посмотреть цены</Link>
      </section>
    </main>
  );
}
