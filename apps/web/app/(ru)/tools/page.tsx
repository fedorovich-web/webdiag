import type { Metadata } from "next";
import { ToolList } from "../../../src/features/tools/tool-list";
import { JsonLd } from "../../../src/components/json-ld";
import { pageMetadata } from "../../../src/lib/seo";
import { toolItemListJsonLd } from "../../../src/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Дополнительные инструменты для аудита и исправлений WebDiag",
  description: "Вспомогательные инструменты WebDiag для исправления найденных проблем: JSON, кодирование, хеши, контраст, изображения на сайте и технические значения.",
  canonical: "/tools",
  ruPath: "/tools",
  enPath: "/en/tools",
});

export default function Page() {
  return <main className="shell page-main catalog-page"><JsonLd data={toolItemListJsonLd("ru")} /><header className="page-heading catalog-heading"><span className="eyebrow">WebDiag</span><h1>Дополнительные инструменты для аудита и исправлений</h1><p>Этот раздел не заменяет аудит сайта. Он помогает быстрее исправлять найденные проблемы: подготовить данные, проверить контраст, оптимизировать изображения на страницах, работать с кодированием, хешами и техническими значениями.</p></header><ToolList locale="ru" /></main>;
}
