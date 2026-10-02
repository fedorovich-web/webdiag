import type { Metadata } from "next";
import { AboutPage } from "../../../../src/features/about/about-page";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "About WebDiag — Website Diagnostics and SEO Auditing Platform",
  description: "Learn more about WebDiag: mission, engineering standards, data transparency, 125+ diagnostic utilities, and AI workflows.",
  canonical: "/en/about",
  ruPath: "/about",
  enPath: "/en/about",
});

export default function Page() {
  return <AboutPage locale="en" />;
}
