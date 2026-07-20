import type { Locale } from "@webdiag/tool-registry";

export function homePath(locale: Locale): string {
  return locale === "ru" ? "/" : "/en";
}

export function toolsPath(locale: Locale): string {
  return locale === "ru" ? "/tools" : "/en/tools";
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
