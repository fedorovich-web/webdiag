import type { Metadata } from "next";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Contacts",
  description: "Contact WebDiag support about your account, website diagnostics, or the service.",
  canonical: "/en/contacts",
  ruPath: "/contacts",
  enPath: "/en/contacts",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Contacts</h1>
        <p>For account, tool, or service questions, contact WebDiag support.</p>
      </header>
      <section className="wd-internal-note" aria-labelledby="support-title">
        <strong id="support-title">Support</strong>
        <p>
          <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>
        </p>
      </section>
    </main>
  );
}
