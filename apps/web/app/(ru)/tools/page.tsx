import type { Metadata } from "next";
import { ToolList } from "../../../src/features/tools/tool-list";
import { JsonLd } from "../../../src/components/json-ld";
import { pageMetadata } from "../../../src/lib/seo";
import { toolItemListJsonLd } from "../../../src/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Все инструменты WebDiag",
  description: "Более 140 инструментов WebDiag для SEO-аудита, диагностики, скорости, безопасности, доступности, изображений и разработки.",
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
