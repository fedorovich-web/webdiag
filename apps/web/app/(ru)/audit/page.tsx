import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Технический SEO-аудит сайта — ошибки и рекомендации | WebDiag",
  description: "Технический SEO-аудит сайта: индексация, robots.txt, sitemap.xml, canonical, статусы, редиректы, мета-теги, скорость, HTTPS и другие сигналы.",
  canonical: "/audit",
  ruPath: "/audit",
  enPath: "/en/audit",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Технический SEO-аудит сайта с приоритетами исправлений</h1>
        <p>Проверяйте ключевые технические и SEO-сигналы, находите проблемы на конкретных страницах и переходите от найденной ошибки к понятному следующему шагу.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Состав аудита">
        <article><h2>Что проверяется</h2><p>Индексация, robots.txt, sitemap.xml, canonical, статусы ответа, редиректы, мета-теги, скорость, HTTPS и доступность.</p></article>
        <article><h2>Что показывает результат</h2><p>Найденные проблемы, затронутые URL, приоритет и рекомендации, которые помогают понять, что исправлять в первую очередь.</p></article>
        <article><h2>Как работать с результатом</h2><p>Начните с критичных проблем, исправьте их и перепроверьте нужные страницы или отдельные технические сигналы инструментами WebDiag.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Нужна точечная проверка?</strong>
        <p>Для отдельной задачи — robots.txt, sitemap.xml, canonical, редиректов, мета-тегов, скорости и других сигналов — используйте специализированные инструменты WebDiag.</p>
        <Link className="wd-button wd-button-primary" href="/tools">Открыть инструменты</Link>
      </section>
    </main>
  );
}
