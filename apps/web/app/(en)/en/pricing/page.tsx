import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Pricing for technical audits and site monitoring",
  description: "Preliminary WebDiag pricing: free URL check, one-off checks, full site audit, and monitoring.",
  canonical: "/en/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Pricing for site audits, one-off checks, and monitoring</h1>
        <p>Basic checks stay free. Full audits, higher limits, and monitoring are paid separately.</p>
      </header>
      <section className="wd-internal-grid" aria-label="Pricing model">
        <article><h2>Free — 0 ₽</h2><p>One express URL check and basic tools without project history.</p></article>
        <article><h2>One-off checks — from 99 ₽</h2><p>Sitemap, broken links, images, HTML validation, and AI helpers are paid per run.</p></article>
        <article><h2>Full audit — from 490 ₽</h2><p>Technical SEO audit with priorities and affected URLs.</p></article>
        <article><h2>Monitoring — from 299 ₽/mo</h2><p>Ongoing control after releases and SEO changes.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Prices are preliminary</strong>
        <p>Final plans will be adjusted after audit engine cost, page limits, and monitoring cadence are validated.</p>
        <Link className="wd-button wd-button-primary" href="/en/tools">Open tools</Link>
      </section>
    </main>
  );
}
