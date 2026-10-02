import type { Metadata } from "next";
import { PricingHubPage } from "../../../src/features/pricing/pricing-hub-page";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Тарифы WebDiag — Цены на SEO-аудит, инструменты и AI-функции",
  description: "Тарифные планы WebDiag: Стартовый (бесплатно), Pro и Team. Глубокий краулинг, AI-планы исправлений, автоматический мониторинг сайтов и экспорт отчетов.",
  canonical: "/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return <PricingHubPage locale="ru" />;
}
