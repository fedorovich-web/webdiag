"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountPath, loginPath, registerPath } from "../lib/routes";
import { MobileNavigation } from "./mobile-navigation";

export function SiteHeaderAccountActions({ locale, mobileLinks }: { locale: Locale; mobileLinks: ReactNode }) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const ru = locale === "ru";

  useEffect(() => {
    let pending: AbortController | undefined;
    const { hostname } = window.location;
    const appOrigin = hostname === "webdiag.ru" || hostname === "www.webdiag.ru" ? "https://app.webdiag.ru" : "";
    const checkSession = async () => {
      pending?.abort();
      const controller = new AbortController();
      pending = controller;
      try {
        const response = await fetch(appOrigin + "/api/account/session-status", {
          credentials: "include",
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2_500)]),
        });
        if (!controller.signal.aborted) setSignedIn(response.status === 204);
      } catch {
        if (!controller.signal.aborted) setSignedIn(false);
      }
    };
    const recheckOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) void checkSession();
    };
    void checkSession();
    window.addEventListener("pageshow", recheckOnRestore);
    return () => {
      pending?.abort();
      window.removeEventListener("pageshow", recheckOnRestore);
    };
  }, [pathname]);

  return (
    <>
      {signedIn ? (
        <Link className="wd-header-cta" href={accountPath(locale)} prefetch={false}>{ru ? "В кабинет" : "My account"}</Link>
      ) : (
        <>
          <Link className="wd-header-login" href={loginPath(locale)} prefetch={false}>{ru ? "Войти" : "Sign in"}</Link>
          <Link className="wd-header-cta" href={registerPath(locale)} prefetch={false}>{ru ? "Создать аккаунт" : "Create account"}</Link>
        </>
      )}
      <MobileNavigation locale={locale} signedIn={signedIn}>{mobileLinks}</MobileNavigation>
    </>
  );
}
