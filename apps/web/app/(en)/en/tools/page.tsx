import type { Metadata } from "next";
import { PUBLIC_CATALOG_TOOL_COUNT } from "../../../../src/features/tools/public-catalog-data";
import { ToolList } from "../../../../src/features/tools/tool-list";
import { JsonLd } from "../../../../src/components/json-ld";
import { pageMetadata } from "../../../../src/lib/seo";
import { toolItemListJsonLd } from "../../../../src/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "All WebDiag Tools",
  description: `${PUBLIC_CATALOG_TOOL_COUNT} WebDiag tools for SEO audits, diagnostics, performance, security, accessibility, images, development and AI workflows.`,
  canonical: "/en/tools",
  ruPath: "/tools",
  enPath: "/en/tools",
});

export default function Page() {
  return (
    <main className="wd-tools-page">
      <JsonLd data={toolItemListJsonLd("en")} />
      <ToolList locale="en" />
    </main>
  );
}
