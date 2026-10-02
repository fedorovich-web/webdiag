import type { Metadata } from "next";
import { KnowledgeHubPage } from "../../../../src/features/knowledge/knowledge-hub-page";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag Knowledge Base — Technical SEO Guides, Core Web Vitals & Web Standards",
  description: "Expert guides and documentation on technical SEO: robots.txt directives, canonical configuration, Core Web Vitals (LCP, INP, CLS), Schema.org, and pre-launch checklists.",
  canonical: "/en/knowledge",
  ruPath: "/knowledge",
  enPath: "/en/knowledge",
});

export default function Page() {
  return <KnowledgeHubPage locale="en" />;
}
