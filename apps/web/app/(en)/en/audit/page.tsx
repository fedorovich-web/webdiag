import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Technical SEO Audit — Issues and Recommendations | WebDiag",
  description: "Technical SEO audit for indexing, robots.txt, sitemap.xml, canonicals, statuses, redirects, metadata, performance, HTTPS, and other signals.",
  canonical: "/en/audit",
  ruPath: "/audit",
  enPath: "/en/audit",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Technical SEO audit with clear fix priorities</h1>
        <p>Check key technical and SEO signals, find issues on specific pages, and move from each detected problem to a clear next step.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Audit scope">
        <article><h2>What is checked</h2><p>Indexing, robots.txt, sitemap.xml, canonicals, response statuses, redirects, metadata, performance, HTTPS, and accessibility.</p></article>
        <article><h2>What the result shows</h2><p>Detected issues, affected URLs, priority, and recommendations that help you decide what to fix first.</p></article>
        <article><h2>How to use the result</h2><p>Start with critical issues, apply fixes, then re-check the relevant pages or individual technical signals with WebDiag tools.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Need a focused check?</strong>
        <p>For a specific task such as robots.txt, sitemap.xml, canonicals, redirects, metadata, performance, or other signals, use WebDiag's dedicated tools.</p>
        <Link className="wd-button wd-button-primary" href="/en/tools">Open tools</Link>
      </section>
    </main>
  );
}
