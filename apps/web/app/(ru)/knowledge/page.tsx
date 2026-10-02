import type { Metadata } from "next";
import { KnowledgeHubPage } from "../../../src/features/knowledge/knowledge-hub-page";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "База знаний WebDiag — Руководства по SEO, Core Web Vitals и техническому аудиту",
  description: "Экспертные материалы и статьи по техническому SEO: настройка robots.txt, canonical, Core Web Vitals (LCP, INP, CLS), Schema.org и чеклист перед релизом.",
  canonical: "/knowledge",
  ruPath: "/knowledge",
  enPath: "/en/knowledge",
});

export default function Page() {
  return <KnowledgeHubPage locale="ru" />;
}
