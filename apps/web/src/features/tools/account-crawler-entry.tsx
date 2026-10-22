import Link from "next/link";
import type { Locale } from "@webdiag/tool-registry";
import { accountPath } from "../../lib/routes";

export type AccountCrawlerSlug =
  | "whole-site-audit"
  | "duplicate-meta-checker"
  | "orphan-page-finder";

interface AccountCrawlerEntryCopy {
  readonly href: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly limit: string;
  readonly action: string;
}

const featureCopy: Record<AccountCrawlerSlug, Record<Locale, Pick<AccountCrawlerEntryCopy, "title" | "description">>> = {
  "whole-site-audit": {
    ru: {
      title: "Запустите ограниченный обход проекта",
      description: "Один обход собирает статусы, title, description и внутренние ссылки для доступных страниц одного origin.",
    },
    en: {
      title: "Run a bounded project crawl",
      description: "One crawl collects status, title, description, and internal links for reachable pages on one origin.",
    },
  },
  "duplicate-meta-checker": {
    ru: {
      title: "Найдите повторы в результатах обхода",
      description: "WebDiag группирует одинаковые непустые title и description среди фактически полученных HTML-страниц проекта.",
    },
    en: {
      title: "Find duplicates in crawl results",
      description: "WebDiag groups identical non-empty titles and descriptions among the HTML pages actually fetched for the project.",
    },
  },
  "orphan-page-finder": {
    ru: {
      title: "Проверьте кандидатов без внутренних ссылок",
      description: "WebDiag сравнивает URL из sitemap с внутренними ссылками, найденными в ограниченной выборке обхода.",
    },
    en: {
      title: "Review unlinked page candidates",
      description: "WebDiag compares sitemap URLs with internal links discovered in the bounded crawl sample.",
    },
  },
};

export function getAccountCrawlerEntryCopy(slug: AccountCrawlerSlug, locale: Locale): AccountCrawlerEntryCopy {
  const localized = featureCopy[slug][locale];
  return locale === "ru"
    ? {
        href: accountPath(locale),
        eyebrow: "Доступно после авторизации",
        ...localized,
        limit: "Обход HTML-страниц ограничен серверными лимитами и robots.txt, не исполняет JavaScript и не доказывает полное покрытие сайта. Лимит и пропуски показаны в результате.",
        action: "Открыть проекты",
      }
    : {
        href: accountPath(locale),
        eyebrow: "Available after sign-in",
        ...localized,
        limit: "The crawl of HTML pages uses server limits, respects robots.txt, does not execute JavaScript, and does not prove complete site coverage. Limits and exclusions appear in the result.",
        action: "Open projects",
      };
}

export function AccountCrawlerEntry({ slug, locale }: { slug: AccountCrawlerSlug; locale: Locale }) {
  const copy = getAccountCrawlerEntryCopy(slug, locale);
  const ru = locale === "ru";
  const singleAuditHref = ru ? "/tools/single-page-audit" : "/en/tools/single-page-audit";

  return (
    <div>
      <section className="account-crawler-entry" aria-labelledby="account-crawler-entry-title">
        <div className="account-crawler-entry-copy">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 id="account-crawler-entry-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="account-crawler-entry-action">
          <p>{copy.limit}</p>
          <Link className="button button-link" href={copy.href}>{copy.action}<span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {slug === "whole-site-audit" && (
        <aside className="tool-note" style={{ marginTop: "20px", padding: "18px", borderRadius: "12px", background: "var(--wd-s, #f8fafc)", border: "1px solid var(--wd-l, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <strong style={{ fontSize: "15px", display: "block" }}>{ru ? "Нужен мгновенный экспресс-аудит без регистрации?" : "Need an instant single-page audit without sign-in?"}</strong>
            <span style={{ fontSize: "13px", color: "var(--wd-ms, #64748b)" }}>{ru ? "Проверьте любую страницу онлайн: SEO, Core Web Vitals, Google PageSpeed, SSL и безопасность." : "Analyze any page online: SEO, Core Web Vitals, Google PageSpeed, SSL, and security."}</span>
          </div>
          <Link className="button" href={singleAuditHref}>
            {ru ? "Онлайн экспресс-аудит" : "Launch Express Audit"} <span aria-hidden="true">→</span>
          </Link>
        </aside>
      )}
    </div>
  );
}
