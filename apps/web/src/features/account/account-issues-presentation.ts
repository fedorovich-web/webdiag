import type { Locale } from "@webdiag/tool-registry";
import type {
  AccountIssueCategory,
  AccountIssueFilters,
  AccountIssuePriority,
} from "./account-issues-contract";

const priorityLabels: Record<Locale, Record<AccountIssuePriority, string>> = {
  ru: {
    p0: "P0 — исправить первым",
    p1: "P1 — следующим",
    p2: "P2 — планово",
    p3: "P3 — позже",
  },
  en: {
    p0: "P0 — fix first",
    p1: "P1 — next",
    p2: "P2 — planned",
    p3: "P3 — later",
  },
};

const categoryLabels: Record<Locale, Record<AccountIssueCategory, string>> = {
  ru: {
    seo: "SEO",
    performance: "Производительность",
    accessibility: "Доступность",
    security: "Безопасность",
    content: "Контент",
    technical: "Технические",
  },
  en: {
    seo: "SEO",
    performance: "Performance",
    accessibility: "Accessibility",
    security: "Security",
    content: "Content",
    technical: "Technical",
  },
};

export const defaultAccountIssueFilters: AccountIssueFilters = {
  sort: "priority",
  order: "asc",
};

export function issuePriorityLabel(locale: Locale, priority: AccountIssuePriority): string {
  return priorityLabels[locale][priority];
}

export function issueCategoryLabel(locale: Locale, category: AccountIssueCategory): string {
  return categoryLabels[locale][category];
}

export function formatAffectedUrlCount(locale: Locale, count: number): string {
  if (locale === "en") return `${count} ${count === 1 ? "page" : "pages"}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun = mod10 === 1 && mod100 !== 11
    ? "страница"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "страницы"
      : "страниц";
  return `${count} ${noun}`;
}

export function hasActiveAccountIssueFilters(filters: AccountIssueFilters): boolean {
  return Boolean(filters.category)
    || Boolean(filters.priority)
    || (filters.sort ?? "priority") !== "priority"
    || (filters.order ?? "asc") !== "asc";
}
