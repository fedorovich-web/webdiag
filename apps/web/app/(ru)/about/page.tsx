import type { Metadata } from "next";
import { AboutPage } from "../../../src/features/about/about-page";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "О проекте WebDiag — Платформа для SEO и технической диагностики сайтов",
  description: "Узнайте больше о WebDiag: миссия, технологии, принципы точности, более 125 инструментов веб-анализа и AI-сценарии.",
  canonical: "/about",
  ruPath: "/about",
  enPath: "/en/about",
});

export default function Page() {
  return <AboutPage locale="ru" />;
}
