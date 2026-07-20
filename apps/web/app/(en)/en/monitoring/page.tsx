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
        <article><h2>Regressions</h2><p>Comparing post-release health with previous checks.</p></article>
        <article><h2>History</h2><p>Dynamics of issues, fixes, and technical site health.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Subscription instead of one-off runs</strong>
        <p>Preliminary monitoring starts from 299 ₽/mo. Limits depend on projects, URL volume, and check frequency.</p>
        <Link className="wd-button wd-button-primary" href="/en/pricing">View pricing</Link>
      </section>
    </main>
  );
}
