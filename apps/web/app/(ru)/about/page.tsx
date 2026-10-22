import type { Metadata } from "next";
import { PUBLIC_CATALOG_TOOL_COUNT } from "../../../src/features/tools/public-catalog-data";
import { AboutPage } from "../../../src/features/about/about-page";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "О проекте WebDiag — Платформа для SEO и технической диагностики сайтов",
  description: `Узнайте больше о WebDiag: технологии, источники данных и ${PUBLIC_CATALOG_TOOL_COUNT} инструментов диагностики, включая AI-сценарии.`,
  canonical: "/about",
  ruPath: "/about",
  enPath: "/en/about",
});

export default function Page() {
  return <AboutPage locale="ru" />;
}
