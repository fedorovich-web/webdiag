"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@webdiag/tool-registry";
import { localizedHref } from "../lib/routes";

function subscribeToUrl(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

function getUrlSuffix() {
  return `${window.location.search}${window.location.hash}`;
}

function getServerUrlSuffix() {
  return "";
}

export function LanguageSwitcher({ locale, className = "" }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const suffix = useSyncExternalStore(subscribeToUrl, getUrlSuffix, getServerUrlSuffix);
  const hashIndex = suffix.indexOf("#");
  const search = hashIndex === -1 ? suffix : suffix.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : suffix.slice(hashIndex);
  const label = locale === "ru" ? "Выбор языка" : "Language selection";

  return (
    <nav className={`language-switcher ${className}`.trim()} aria-label={label} data-active-locale={locale}>
      <span className="language-active-surface" aria-hidden="true" />
      {(["ru", "en"] as const).map((targetLocale) => (
        <Link
          key={targetLocale}
          className="language-segment"
          href={localizedHref(pathname, targetLocale, search, hash)}
          hrefLang={targetLocale}
          lang={targetLocale}
          aria-current={locale === targetLocale ? "page" : undefined}
          aria-label={targetLocale === "ru" ? "Русская версия" : "English version"}
        >
          {targetLocale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
