import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Technical site audit and SEO report",
  description: "Technical SEO site audit: crawl, issues, priorities, affected URLs, recommendations, and re-checks after fixes.",
  canonical: "/en/audit",
  ruPath: "/audit",
  enPath: "/en/audit",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Technical site audit with fix priorities</h1>
        <p>The future WebDiag audit engine will crawl URLs, sitemap, and internal links, collect technical issues, and show affected pages.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Audit scope">
        <article><h2>What is checked</h2><p>Indexing, robots.txt, sitemap, canonical, response statuses, redirects, metadata, performance, SSL, and accessibility.</p></article>
        <article><h2>What the user gets</h2><p>A health score, issue list, priorities, affected URLs, recommendations, and re-checks after fixes.</p></article>
        <article><h2>Status</h2><p>Until the audit engine launches, the sample report and supporting tools are available.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Full audit is priced by site volume</strong>
        <p>Preliminary pricing starts from 490 ₽ for small sites. WebDiag should show limits and price before starting a paid audit.</p>
        <Link className="wd-button wd-button-primary" href="/en/pricing">View pricing</Link>
      </section>
    </main>
  );
}
