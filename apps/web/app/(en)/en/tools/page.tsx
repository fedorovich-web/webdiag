import type { Metadata } from "next";
import { ToolList } from "../../../../src/features/tools/tool-list";
import { JsonLd } from "../../../../src/components/json-ld";
import { pageMetadata } from "../../../../src/lib/seo";
import { toolItemListJsonLd } from "../../../../src/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "Supporting Tools for WebDiag Audit Fixes",
  description: "Supporting WebDiag tools for fixing detected issues: JSON, encoding, hashes, contrast, on-site images, and technical values.",
  canonical: "/en/tools",
  ruPath: "/tools",
  enPath: "/en/tools",
});

export default function Page() {
  return <main className="shell page-main catalog-page"><JsonLd data={toolItemListJsonLd("en")} /><header className="page-heading catalog-heading"><span className="eyebrow">WebDiag</span><h1>Supporting tools for audit fixes</h1><p>This section does not replace the website audit. It helps fix detected issues faster: prepare data, check contrast, optimize on-page images, work with encoding, hashes, and technical values.</p></header><ToolList locale="en" /></main>;
}
