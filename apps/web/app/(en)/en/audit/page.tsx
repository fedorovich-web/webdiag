import type { Metadata } from "next";
import { AuditHubPage } from "../../../../src/features/audit/audit-hub-page";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Technical SEO Audit Online — Check Issues and Core Web Vitals | WebDiag",
  description: "Comprehensive technical SEO audit online: inspect indexation, robots.txt, sitemap.xml, canonicals, redirects, Core Web Vitals, HTTPS, and AI fix plans.",
  canonical: "/en/audit",
  ruPath: "/audit",
  enPath: "/en/audit",
});

export default function Page() {
  return <AuditHubPage locale="en" />;
}
