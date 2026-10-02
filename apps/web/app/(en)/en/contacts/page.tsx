import type { Metadata } from "next";
import { ContactPage } from "../../../../src/features/contact/contact-page";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag Contact and Support",
  description: "Contact WebDiag support about the product, account, billing, issues, or ideas for new tools.",
  canonical: "/en/contacts",
  ruPath: "/contacts",
  enPath: "/en/contacts",
});

export default function Page() {
  return <ContactPage locale="en" />;
}
