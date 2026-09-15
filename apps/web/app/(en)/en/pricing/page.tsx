import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag Pricing — Tools and Account Workspace",
  description: "Access terms for WebDiag tools and the account workspace. Rely only on pricing, limits, and conditions explicitly published in the service interface.",
  canonical: "/en/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>WebDiag pricing</h1>
        <p>Choose the workflow that fits the task: focused public checks or an account workspace for projects, saved history, and repeated work with results.</p>
      </header>
      <section className="wd-internal-grid wd-availability-grid" aria-label="WebDiag access terms">
        <article><h2>Public tools</h2><p>Use focused tools for individual technical and SEO checks. Availability of each tool is shown directly in the catalog.</p><Link className="wd-text-link" href="/en/tools">All tools</Link></article>
        <article><h2>Account workspace</h2><p>Use an account for projects, saved results, priorities, reports, and repeated checks.</p><Link className="wd-text-link" href="/en/register">Create an account</Link></article>
        <article><h2>Pricing</h2><p>WebDiag does not display unconfirmed prices. Rely only on pricing explicitly shown on this page or directly in the service interface.</p></article>
        <article><h2>Limits and conditions</h2><p>Use only limits and conditions explicitly shown alongside the relevant WebDiag feature.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Want to start with a website check?</strong>
        <p>Open the catalog and choose the technical or SEO check that matches your task.</p>
        <Link className="wd-button wd-button-primary" href="/en/tools">Open tools</Link>
      </section>
    </main>
  );
}
