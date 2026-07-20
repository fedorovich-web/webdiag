import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag blog about technical SEO",
  description: "Practical WebDiag materials about indexing, performance, redirects, structured data, and technical site audits.",
  canonical: "/en/blog",
  ruPath: "/blog",
  enPath: "/en/blog",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Technical SEO and site diagnostics blog</h1>
        <p>This section will collect practical materials about issues that affect indexing, performance, accessibility, and search visibility.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Blog topics">
        <article><h2>Indexing</h2><p>robots.txt, sitemap, canonical, noindex, and technical reasons pages disappear.</p></article>
        <article><h2>Performance</h2><p>Core Web Vitals, heavy templates, images, and resources.</p></article>
        <article><h2>Markup</h2><p>Schema.org, JSON-LD, FAQ, Open Graph, and rich snippets.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Articles will be added gradually</strong>
        <p>The first priority is the audit engine, reports, and monitoring. The blog should support the product, not replace it.</p>
        <Link className="wd-button wd-button-primary" href="/en/tools">Open tools</Link>
      </section>
    </main>
  );
}
