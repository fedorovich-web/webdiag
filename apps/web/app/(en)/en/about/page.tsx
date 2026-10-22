import type { Metadata } from "next";
import { PUBLIC_CATALOG_TOOL_COUNT } from "../../../../src/features/tools/public-catalog-data";
import { AboutPage } from "../../../../src/features/about/about-page";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "About WebDiag — Website Diagnostics and SEO Auditing Platform",
  description: `Learn more about WebDiag: technologies, data sources and ${PUBLIC_CATALOG_TOOL_COUNT} diagnostic tools, including AI workflows.`,
  canonical: "/en/about",
  ruPath: "/about",
  enPath: "/en/about",
});

export default function Page() {
  return <AboutPage locale="en" />;
}
