import type { Locale } from "@webdiag/tool-registry";

export function homePath(locale: Locale): string {
  return locale === "ru" ? "/" : "/en";
}

export function toolsPath(locale: Locale): string {
  return locale === "ru" ? "/tools" : "/en/tools";
}

export function loginPath(locale: Locale): string {
  return locale === "ru" ? "/login" : "/en/login";
}

export function registerPath(locale: Locale): string {
  return locale === "ru" ? "/register" : "/en/register";
}

export function accountPath(locale: Locale): string {
  return locale === "ru" ? "/account" : "/en/account";
}

export function reportsPath(locale: Locale): string {
  return `${accountPath(locale)}/reports`;
}

export function accountSettingsPath(locale: Locale): string {
  return `${accountPath(locale)}/settings`;
}

export function accountAIPath(locale: Locale): string {
  return `${accountPath(locale)}/ai`;
}

export function reportPath(locale: Locale, reportId: string): string {
  return `${reportsPath(locale)}/${reportId}`;
}

export function publicReportPath(shareToken: string): string {
  return `/reports/share/${encodeURIComponent(shareToken)}`;
}

export function projectPath(locale: Locale, projectId: string): string {
  return locale === "ru"
    ? `/account/projects/${projectId}`
    : `/en/account/projects/${projectId}`;
}

export function projectMonitoringPath(locale: Locale, projectId: string): string {
  return `${projectPath(locale, projectId)}/monitoring`;
}

export function savedAuditPath(locale: Locale, projectId: string, auditId: string): string {
  return `${projectPath(locale, projectId)}/audits/${auditId}`;
}

export function savedAuditIssuesPath(locale: Locale, projectId: string, auditId: string): string {
  return `${savedAuditPath(locale, projectId, auditId)}/issues`;
}

export function savedAuditIssuePath(
  locale: Locale,
  projectId: string,
  auditId: string,
  issueId: string,
): string {
  return `${savedAuditIssuesPath(locale, projectId, auditId)}/${encodeURIComponent(issueId)}`;
}

export function localizedPath(pathname: string, targetLocale: Locale): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutEnglishPrefix = normalized === "/en" ? "/" : normalized.startsWith("/en/") ? normalized.slice(3) : normalized;

  if (targetLocale === "ru") return withoutEnglishPrefix || "/";
  return withoutEnglishPrefix === "/" ? "/en" : `/en${withoutEnglishPrefix}`;
}

function normalizeSuffix(value: string, prefix: "?" | "#"): string {
  if (!value) return "";
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

export function localizedHref(
  pathname: string,
  targetLocale: Locale,
  search = "",
  hash = "",
): string {
  return `${localizedPath(pathname, targetLocale)}${normalizeSuffix(search, "?")}${normalizeSuffix(hash, "#")}`;
}
