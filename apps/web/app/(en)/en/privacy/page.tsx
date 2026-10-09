import type { Metadata } from "next";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Privacy policy",
  description: "WebDiag privacy policy: the individual controller, accounts, diagnostics, payments, AI and privacy requests.",
  canonical: "/en/privacy",
  ruPath: "/privacy",
  enPath: "/en/privacy",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page wd-legal-page">
      <header className="page-heading wd-internal-hero wd-internal-hero-split" data-hero="privacy">
        <div className="wd-internal-hero-copy">
        <span className="eyebrow">WebDiag</span>
        <h1>Privacy policy</h1>
        <p>
          How WebDiag processes data on webdiag.ru and app.webdiag.ru. Updated 9 October 2026.
        </p>
              </div>
        <div className="wd-internal-hero-visual" aria-hidden="true">
          <img src="/design/hero/privacy.webp" alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        </div>
      </header>
      <section className="wd-internal-grid wd-legal-grid" aria-label="Privacy policy sections">
        <article>
          <h2>1. Controller and scope</h2>
          <p>The personal data controller is Федорович Роман Олегович (Roman Olegovich Fedorovich), an individual operating WebDiag. Contact: <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>.</p>
          <p>This policy covers visitors, account holders and people contacting support. External websites and services apply their own policies.</p>
        </article>
        <article>
          <h2>2. Data processed</h2>
          <p>Account data includes your name, email, account identifier, cryptographic password hash, sessions and access-verification records. Yandex provides its user identifier and email; WebDiag does not receive your Yandex password.</p>
          <p>Service data includes URLs, project names, check parameters and results, audit, monitoring, report and AI-job history, submitted text and server uploads. Payment records include invoices, products, amounts, currencies, payment status, plan periods and credit transactions.</p>
          <p>Support processes your name, email, subject and message. Infrastructure operation and abuse prevention may involve IP addresses, request timestamps, browser details, request URLs and technical error information.</p>
        </article>
        <article>
          <h2>3. Purposes and grounds</h2>
          <p>Data supports registration, sign-in and access recovery, requested checks, saved projects and results, payment processing, plans and credits, service emails, support and abuse prevention.</p>
          <p>Processing relies on providing the service you request and contractual obligations, consent where required, or applicable legal duties. Each operation needs an appropriate basis; this policy does not replace separate consent where necessary. Without required data, registration, payment or a selected check may be unavailable. Account-free tools remain available without registration.</p>
        </article>
        <article>
          <h2>4. Tools, AI and shared reports</h2>
          <p>Some tools run in your browser; network tools contact WebDiag servers and external sources. Server image conversion receives the uploaded file. Each tool describes its processing mode.</p>
          <p>AI jobs send submitted text and necessary diagnostic evidence through Vercel AI Gateway to the selected model provider. An abuse-prevention identifier is pseudonymous; submitted content is not thereby anonymous.</p>
          <p>Do not submit passwords, API keys, payment credentials, sensitive personal data or third-party data without an appropriate basis. You must have permission to check a website and submit its contents. A public report link you create is accessible to its recipients; revoking it does not erase copies already made.</p>
        </article>
        <article>
          <h2>5. Recipients and external services</h2>
          <p>The controller and necessary infrastructure providers receive data required for selected functions: Yandex for sign-in, Lava.top for invoices and payments, Resend for service emails, Nevtan for support mail, and Vercel AI Gateway and the model provider for AI jobs. Network checks use relevant sources, including DNS, RDAP and Google PageSpeed Insights.</p>
          <p>Payment credentials are entered with the payment provider; WebDiag does not request or store card numbers or CVC. Selling personal data or disclosing it to advertisers is not a processing purpose.</p>
          <p>Some providers process data outside your country. Resend mail is configured in Ireland (eu-west-1); AI routing depends on the model provider. Transfers and storage must meet applicable requirements, including localization and cross-border transfer rules where relevant. This policy does not claim all data stays in one country.</p>
        </article>
        <article>
          <h2>6. Cookies and browser settings</h2>
          <p>WebDiag uses a session cookie for sign-in and short-lived OAuth security cookies. Interface settings such as the theme may use browser local storage. You can remove this data in browser settings; sign-in or preferences may reset. The current version does not integrate separate advertising trackers or third-party website analytics counters.</p>
        </article>
        <article>
          <h2>7. Processing, retention and protection</h2>
          <p>Operations include collection, recording, storage, use, necessary transfers, correction, access restriction and deletion. Core operations are automated; support and privacy requests may be handled manually.</p>
          <p>Account data and saved results are used while needed to provide the service. Sessions expire; account-ownership verification records are valid for up to ten minutes. Payments, correspondence, technical logs and backups may be retained longer for obligations, security or applicable legal requirements. Session expiry does not itself delete an account or its history.</p>
          <p>When processing grounds cease, data must be deleted or anonymized, subject to applicable retention duties and backup handling. Controls include HTTPS for public connections, password hashing, access restrictions, session revocation and limits on service requests; they do not eliminate every risk.</p>
        </article>
        <article>
          <h2>8. Your rights and requests</h2>
          <p>You may request processing information, correction, restriction or deletion where grounds exist, and withdraw consent for consent-based operations. Other lawful processing grounds may remain.</p>
          <p>Write to <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>, preferably from your account email, and describe the request. Account ownership or clarification may be required to protect your data. Do not send passwords, sign-in codes or passport copies without a separate justified request. Applicable legal deadlines govern responses; you may also contact the competent authority or a court.</p>
        </article>
        <article>
          <h2>9. Updates</h2>
          <p>This page contains the current version. Changes to purposes, data categories or recipients require an updated policy and, where necessary, notification or renewed consent. The revision date appears at the top.</p>
        </article>
      </section>
      <section className="wd-internal-note">
        <strong>Privacy contact</strong>
        <p>Send privacy requests to <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>.</p>
      </section>
    </main>
  );
}
