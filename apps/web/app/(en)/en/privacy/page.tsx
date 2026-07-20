import type { Metadata } from "next";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Privacy policy",
  description: "WebDiag privacy policy: what data may be processed when using the website, tools, and future audit flows.",
  canonical: "/en/privacy",
  ruPath: "/privacy",
  enPath: "/en/privacy",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page wd-legal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Privacy policy</h1>
        <p>
          This page describes the baseline data-processing principles for the WebDiag website, tool catalog, and future technical audit flows.
        </p>
      </header>
      <section className="wd-internal-grid wd-legal-grid" aria-label="Privacy policy sections">
        <article>
          <h2>Data that may be processed</h2>
          <p>URLs, technical check parameters, browser data, interface language, and anonymized website usage events.</p>
        </article>
        <article>
          <h2>Why it is needed</h2>
          <p>To run checks, show results, improve the interface, protect the service from abuse, and improve diagnostic quality.</p>
        </article>
        <article>
          <h2>What is not the goal</h2>
          <p>WebDiag should not use submitted URLs to publish private information, resell data, or access websites without authorization.</p>
        </article>
      </section>
      <section className="wd-internal-note">
        <strong>The final legal wording will be refined before public launch</strong>
        <p>Before production release, this policy must be reviewed against the actual architecture, data storage, analytics, payments, and notifications.</p>
      </section>
    </main>
  );
}
