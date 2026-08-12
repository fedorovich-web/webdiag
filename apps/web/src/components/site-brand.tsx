"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@webdiag/tool-registry";

interface SiteBrandProps {
  locale: Locale;
  className?: string;
  variant: "header" | "footer";
}

function normalizePath(path: string) {
  const cleaned = path.replace(/\/$/, "");
  return cleaned === "" ? "/" : cleaned;
}

function BrandArtwork() {
  return (
    <>
      <picture className="brand-picture" aria-hidden="true">
        <source srcSet="/logo.avif" type="image/avif" />
        <img
          className="brand-logo"
          src="/logo.webp"
          width={230}
          height={40}
          alt=""
          decoding="async"
          draggable={false}
        />
      </picture>
      <img
        className="brand-mark"
        src="/favicon.svg"
        width={40}
        height={40}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
      />
    </>
  );
}

export function SiteBrand({ locale, className = "brand", variant }: SiteBrandProps) {
  const pathname = normalizePath(usePathname() ?? "/");
  const home = locale === "ru" ? "/" : "/en";
  const normalizedHome = normalizePath(home);
  const isHome = pathname === normalizedHome;
  const label = locale === "ru" ? "WebDiag — главная" : "WebDiag home";

  if (isHome) {
    return (
      <span
        className={className}
        data-brand-variant={variant}
        aria-current="page"
        aria-label={label}
      >
        <BrandArtwork />
      </span>
    );
  }

  return (
    <Link
      className={className}
      data-brand-variant={variant}
      href={home}
      aria-label={label}
    >
      <BrandArtwork />
    </Link>
  );
}
