import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Site monitoring after fixes and releases",
  description: "WebDiag site monitoring: recurring checks for availability, SSL, SEO changes, new issues, and technical regressions.",
  canonical: "/en/monitoring",
  ruPath: "/monitoring",
  enPath: "/en/monitoring",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Site monitoring after releases, migrations, and SEO changes</h1>
        <p>Monitoring helps catch new technical issues, returning fixed problems, and availability failures after site changes.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Monitoring capabilities">
        <article><h2>Scheduled checks</h2><p>Recurring control of availability, SSL, sitemap, robots.txt, canonical, noindex, and response statuses.</p></article>
        <article><h2>Regressions</h2><p>Compare site health after a release with previous checks.</p></article>
        <article><h2>History</h2><p>Track changes in issues, fixes, and technical site health over time.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Monitoring is available in the account workspace</strong>
        <p>Add a project, run checks manually or on a schedule, and use saved history to track new and resolved issues.</p>
        <Link className="wd-button wd-button-primary" href="/en/register">Create an account</Link>
      </section>
    </main>
  );
}
