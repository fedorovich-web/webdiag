import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { homePath, toolsPath } from "../../lib/routes";

export function NotFoundPage({ locale }: { locale: Locale }) {
  const copy = locale === "ru"
    ? {
        eyebrow: "Ошибка 404",
        title: "Такой страницы нет",
        lead: "Похоже, ссылка устарела, адрес введён с ошибкой или страница была перемещена. Вернитесь на главную или найдите нужный инструмент.",
        home: "На главную",
        tools: "Найти инструмент",
        hint: "Популярные разделы",
        audit: "SEO-аудит",
        monitoring: "Мониторинг",
        pricing: "Тарифы",
      }
    : {
        eyebrow: "Error 404",
        title: "Page not found",
        lead: "The link may be outdated, the address may contain a typo, or the page may have moved. Go back home or find the tool you need.",
        home: "Go home",
        tools: "Find a tool",
        hint: "Popular sections",
        audit: "SEO audit",
        monitoring: "Monitoring",
        pricing: "Pricing",
      };
  const prefix = locale === "ru" ? "" : "/en";

  return (
    <main className="wd-not-found">
      <div className="shell wd-not-found-grid">
        <div className="wd-not-found-copy">
          <span className="wd-eyebrow">{copy.eyebrow}</span>
          <strong className="wd-not-found-code" aria-hidden="true">404</strong>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
          <div className="wd-not-found-actions">
            <Link href={homePath(locale)}><Home aria-hidden="true" />{copy.home}</Link>
            <Link className="is-secondary" href={toolsPath(locale)}><Search aria-hidden="true" />{copy.tools}</Link>
          </div>
          <div className="wd-not-found-links">
            <span>{copy.hint}</span>
            <div>
              <Link href={`${prefix}/audit`}>{copy.audit}<ArrowRight aria-hidden="true" /></Link>
              <Link href={`${prefix}/monitoring`}>{copy.monitoring}<ArrowRight aria-hidden="true" /></Link>
              <Link href={`${prefix}/pricing`}>{copy.pricing}<ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </div>

        <div className="wd-not-found-art" aria-hidden="true">
          <img src="/design/hero/404.webp" alt="" width="900" height="900" loading="lazy" decoding="async" />
        </div>
      </div>
    </main>
  );
}
