import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "База знаний WebDiag по техническому аудиту",
  description: "База знаний WebDiag: методология технического SEO-аудита, термины, руководства и объяснения ошибок.",
  canonical: "/knowledge",
  ruPath: "/knowledge",
  enPath: "/en/knowledge",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero wd-internal-hero-split" data-hero="knowledge">
        <div className="wd-internal-hero-copy">
        <span className="eyebrow">WebDiag</span>
        <h1>База знаний по техническому аудиту сайта</h1>
        <p>Раздел будет объяснять методологию проверок, границы автоматического аудита и практические шаги исправления ошибок.</p>
              </div>
        <div className="wd-internal-hero-visual" aria-hidden="true">
          <img src="/design/hero/knowledge.webp" alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        </div>
      </header>
      <section className="wd-internal-grid" aria-label="Разделы базы знаний">
        <article><h2>Методология</h2><p>Как WebDiag расставляет приоритеты и почему проблема считается критичной.</p></article>
        <article><h2>Глоссарий</h2><p>Понятные определения SEO- и web-терминов без лишней теории.</p></article>
        <article><h2>Руководства</h2><p>Пошаговые материалы по sitemap, редиректам, индексации и техническим исправлениям.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>База знаний связана с отчётом</strong>
        <p>Каждая проблема в будущем отчёте должна вести к объяснению: что сломано, почему важно и как исправить.</p>
        <Link className="wd-button wd-button-primary" href="/audit">Посмотреть аудит</Link>
      </section>
    </main>
  );
}
