"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@webdiag/tool-registry";
import { LogoMark } from "./logo-mark";

interface SiteBrandProps {
  locale: Locale;
  className?: string;
  variant: "header" | "footer";
}

function normalizePath(path: string) {
  const cleaned = path.replace(/\/$/, "");
  return cleaned === "" ? "/" : cleaned;
}

export function SiteBrand({ locale, className = "brand", variant }: SiteBrandProps) {
  const pathname = normalizePath(usePathname() ?? "/");
  const home = locale === "ru" ? "/" : "/en";
  const normalizedHome = normalizePath(home);
  const isHome = pathname === normalizedHome;

  const label = locale === "ru" ? "WebDiag — главная" : "WebDiag home";
  const subtitle = locale === "ru" ? "аудит сайта" : "site audit";

  const content = (
    <>
      <LogoMark />
      <span className="brand-copy">
        <strong>WebDiag</strong>
        {variant === "header" ? <small>{subtitle}</small> : null}
      </span>
    </>
  );

  if (isHome) {
    return (
      <span className={className} aria-current="page" aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <Link className={className} href={home} aria-label={label}>
      {content}
    </Link>
  );
}
