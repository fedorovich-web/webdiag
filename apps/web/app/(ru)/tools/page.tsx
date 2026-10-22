import type { Metadata } from "next";
import { PUBLIC_CATALOG_TOOL_COUNT } from "../../../src/features/tools/public-catalog-data";
import { ToolList } from "../../../src/features/tools/tool-list";
import { JsonLd } from "../../../src/components/json-ld";
import { pageMetadata } from "../../../src/lib/seo";
import { toolItemListJsonLd } from "../../../src/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Все инструменты WebDiag",
  description: `${PUBLIC_CATALOG_TOOL_COUNT} инструментов WebDiag для SEO-аудита, диагностики, скорости, безопасности, доступности, изображений, разработки и AI-сценариев.`,
  canonical: "/tools",
  ruPath: "/tools",
  enPath: "/en/tools",
});

export default function Page() {
  return (
    <main className="wd-tools-page">
      <JsonLd data={toolItemListJsonLd("ru")} />
      <ToolList locale="ru" />
    </main>
  );
}
