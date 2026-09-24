import type { Metadata } from "next";
import { ToolList } from "../../../../src/features/tools/tool-list";
import { JsonLd } from "../../../../src/components/json-ld";
import { pageMetadata } from "../../../../src/lib/seo";
import { toolItemListJsonLd } from "../../../../src/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "All WebDiag Tools",
  description: "More than 140 WebDiag tools for SEO audits, diagnostics, performance, security, accessibility, images, and development.",
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
