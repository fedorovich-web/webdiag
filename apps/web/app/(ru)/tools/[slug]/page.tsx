import type { Metadata } from "next";
import { publicTools } from "@webdiag/tool-registry";
import { ToolPage } from "../../../../src/features/tools/tool-page";
import { JsonLd } from "../../../../src/components/json-ld";
import { getToolPageContent } from "../../../../src/content/tool-pages";
import { toolMetadata } from "../../../../src/lib/seo";
import { toolBreadcrumbJsonLd } from "../../../../src/lib/structured-data";

export function generateStaticParams() { return publicTools.map((tool) => ({ slug: tool.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = getToolPageContent(slug);
  return content ? toolMetadata(content, "ru") : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const breadcrumbs = toolBreadcrumbJsonLd(slug, "ru");
  return <>{breadcrumbs && <JsonLd data={breadcrumbs} />}<ToolPage locale="ru" slug={slug} /></>;
}
