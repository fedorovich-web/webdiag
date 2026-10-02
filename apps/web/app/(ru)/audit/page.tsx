import type { Metadata } from "next";
import { AuditHubPage } from "../../../src/features/audit/audit-hub-page";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Технический SEO-аудит сайта онлайн — Проверка ошибок и Core Web Vitals | WebDiag",
  description: "Глубокий технический SEO-аудит сайта онлайн: проверка индексации, robots.txt, sitemap.xml, canonical, редиректов, Core Web Vitals, HTTPS и AI-план исправлений.",
  canonical: "/audit",
  ruPath: "/audit",
  enPath: "/en/audit",
});

export default function Page() {
  return <AuditHubPage locale="ru" />;
}
