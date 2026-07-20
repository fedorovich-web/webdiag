import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Блог WebDiag о техническом SEO",
  description: "Практические материалы WebDiag об индексации, скорости, редиректах, структурированных данных и техническом аудите сайта.",
  canonical: "/blog",
  ruPath: "/blog",
  enPath: "/en/blog",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Блог о техническом SEO и диагностике сайта</h1>
        <p>Раздел будет собирать практические материалы о проблемах, которые мешают индексации, скорости, доступности и поисковой видимости.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Темы блога">
        <article><h2>Индексация</h2><p>robots.txt, sitemap, canonical, noindex и технические причины выпадения страниц.</p></article>
        <article><h2>Скорость</h2><p>Core Web Vitals, тяжёлые шаблоны, изображения и ресурсы.</p></article>
        <article><h2>Разметка</h2><p>Schema.org, JSON-LD, FAQ, Open Graph и расширенные сниппеты.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Публикации будут добавляться постепенно</strong>
        <p>Сначала приоритет — audit engine, отчёты и мониторинг. Блог должен поддерживать продукт, а не заменять его.</p>
        <Link className="wd-button wd-button-primary" href="/tools">Открыть инструменты</Link>
      </section>
    </main>
  );
}
