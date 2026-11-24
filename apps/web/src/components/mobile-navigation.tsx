"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { accountPath, loginPath, registerPath } from "../lib/routes";
import { LanguageSwitcher } from "./language-switcher";
import { SiteBrand } from "./site-brand";

export function MobileNavigation({ locale, signedIn, children }: { locale: Locale; signedIn: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const ru = locale === "ru";

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const desktop = window.matchMedia("(min-width: 961px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialog?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog?.close();
    };
  }, []);

  function openMenu() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setIsOpen(true);
    closeButtonRef.current?.focus();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    if (event.target instanceof Element && event.target.closest("a[href]")) {
      dialog.close();
      return;
    }
    if (event.target !== dialog) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      dialog.close();
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))
      .filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    const target = event.shiftKey && document.activeElement === first ? last
      : !event.shiftKey && document.activeElement === last ? first : undefined;
    if (target) {
      event.preventDefault();
      target.focus();
    }
  }

  return (
    <div className="mobile-menu wd-mobile-navigation">
      <button
        className="wd-mobile-navigation-trigger"
        type="button"
        aria-label={ru ? "Открыть меню" : "Open menu"}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={isOpen}
        onClick={openMenu}
      >
        <Menu size={22} aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        id={id}
        className="wd-mobile-navigation-dialog"
        aria-labelledby={`${id}-title`}
        onClose={() => setIsOpen(false)}
        onClick={handleDialogClick}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="wd-mobile-navigation-head">
          <SiteBrand locale={locale} className="brand wd-mobile-navigation-brand" variant="header" />
          <h2 className="sr-only" id={`${id}-title`}>{ru ? "Меню сайта" : "Site menu"}</h2>
          <button
            ref={closeButtonRef}
            className="wd-mobile-navigation-close"
            type="button"
            aria-label={ru ? "Закрыть меню" : "Close menu"}
            onClick={() => dialogRef.current?.close()}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="wd-mobile-navigation-body">{children}</div>
        <div className="wd-mobile-navigation-footer">
          <LanguageSwitcher locale={locale} className="language-switcher-mobile" />
          <div className="wd-mobile-navigation-account">
            {signedIn ? (
              <Link className="wd-mobile-navigation-register" href={accountPath(locale)} prefetch={false}>
                {ru ? "В кабинет" : "My account"}
              </Link>
            ) : (
              <>
                <Link href={loginPath(locale)} prefetch={false}>{ru ? "Войти" : "Sign in"}</Link>
                <Link className="wd-mobile-navigation-register" href={registerPath(locale)} prefetch={false}>
                  {ru ? "Создать аккаунт" : "Create account"}
                </Link>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
