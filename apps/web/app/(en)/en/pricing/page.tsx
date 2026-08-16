import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag feature availability",
  description: "Current availability of public tools, the account workspace, AI functions, and payments.",
  canonical: "/en/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>WebDiag feature availability</h1>
        <p>This page states what can be used now and what remains closed until product readiness checks are complete.</p>
      </header>
      <section className="wd-internal-grid wd-availability-grid" aria-label="Current availability">
        <article><h2>Public tools</h2><p>Available without connecting payments. The catalog lists every working check.</p></article>
        <article><h2>Account workspace</h2><p>Available after sign-in: projects, saved audits, priorities, reports, and settings.</p><Link className="wd-text-link" href="/en/register">Create an account</Link></article>
        <article><h2>AI tools are not available yet</h2><p>Public runs remain closed until Russian- and English-language output quality, operating cost, security, and storage checks are complete.</p></article>
        <article><h2>Payments are not connected</h2><p>The payment path, checkout, and subscriptions are absent. WebDiag cannot charge a payment method.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>No prices are published</strong>
        <p>Plans can be published only after feature quality, limits, operating cost, and the payment path are validated.</p>
        <Link className="wd-button wd-button-primary" href="/en/tools">Open tools</Link>
      </section>
    </main>
  );
}
