import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag knowledge base for technical audits",
  description: "WebDiag knowledge base: technical SEO audit methodology, terms, guides, and issue explanations.",
  canonical: "/en/knowledge",
  ruPath: "/knowledge",
  enPath: "/en/knowledge",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Knowledge base for technical site audits</h1>
        <p>This section will explain the check methodology, the limits of automated auditing, and practical issue-fixing steps.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Knowledge base sections">
        <article><h2>Methodology</h2><p>How WebDiag prioritizes issues and why an issue is considered critical.</p></article>
        <article><h2>Glossary</h2><p>Clear definitions of SEO and web terms without unnecessary theory.</p></article>
        <article><h2>Guides</h2><p>Step-by-step materials for sitemap, redirects, indexing, and technical fixes.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>The knowledge base is connected to the report</strong>
        <p>Every future report issue should lead to an explanation: what is broken, why it matters, and how to fix it.</p>
        <Link className="wd-button wd-button-primary" href="/en/audit">View audit</Link>
      </section>
    </main>
  );
}
