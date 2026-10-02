"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Menu,
  Grid3X3,
  SearchCheck,
  CreditCard,
  BookOpen,
  Info,
  Mail,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { SiteBrand } from "./site-brand";
import { LanguageSwitcher } from "./language-switcher";
import { loginPath, toolsPath } from "../lib/routes";

interface MobileDrawerProps {
  readonly locale: Locale;
}

export function MobileDrawer({ locale }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const ru = locale === "ru";

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const navLinks = [
    {
      href: toolsPath(locale),
      label: ru ? "Все инструменты" : "All Tools",
      icon: Grid3X3,
      badge: "115+",
    },
    {
      href: ru ? "/audit" : "/en/audit",
      label: ru ? "SEO-аудит" : "SEO Audit",
      icon: SearchCheck,
    },
    {
      href: ru ? "/pricing" : "/en/pricing",
      label: ru ? "Тарифы" : "Pricing",
      icon: CreditCard,
    },
    {
      href: ru ? "/knowledge" : "/en/knowledge",
      label: ru ? "Материалы" : "Knowledge Base",
      icon: BookOpen,
    },
    {
      href: ru ? "/account/ai" : "/en/account/ai",
      label: ru ? "AI-инструменты" : "AI Workspace",
      icon: Sparkles,
      badge: "AI",
    },
    {
      href: ru ? "/about" : "/en/about",
      label: ru ? "О проекте" : "About WebDiag",
      icon: Info,
    },
    {
      href: ru ? "/contacts" : "/en/contacts",
      label: ru ? "Контакты" : "Contacts",
      icon: Mail,
    },
  ];

  const registerHref = ru ? "/register" : "/en/register";

  return (
    <>
      <button
        type="button"
        className="wd-mobile-menu-trigger"
        onClick={() => setIsOpen(true)}
        aria-label={ru ? "Открыть меню навигации" : "Open navigation menu"}
        aria-expanded={isOpen}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      {/* Backdrop overlay */}
      <div
        className={`wd-drawer-overlay ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in drawer panel */}
      <aside
        className={`wd-drawer-panel ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={ru ? "Мобильная навигация" : "Mobile navigation"}
      >
        <div className="wd-drawer-header">
          <SiteBrand locale={locale} className="brand wd-brand" variant="header" />
          <button
            type="button"
            className="wd-drawer-close"
            onClick={() => setIsOpen(false)}
            aria-label={ru ? "Закрыть меню" : "Close menu"}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="wd-drawer-lang-row">
          <span className="wd-drawer-lang-label">{ru ? "Язык интерфейса:" : "Language:"}</span>
          <LanguageSwitcher locale={locale} className="language-switcher-drawer language-switcher-mobile" />
        </div>

        <nav className="wd-drawer-nav" aria-label={ru ? "Основное меню" : "Main menu"}>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`wd-drawer-link ${isActive ? "is-active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="wd-drawer-icon-wrap">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="wd-drawer-link-text">{item.label}</span>
                {item.badge && <span className="wd-drawer-badge">{item.badge}</span>}
                <ArrowRight size={14} className="wd-drawer-arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <div className="wd-drawer-footer">
          <Link
            href={loginPath(locale)}
            prefetch={false}
            className="wd-drawer-login-btn"
            onClick={() => setIsOpen(false)}
          >
            <LogIn size={18} aria-hidden="true" />
            <span>{ru ? "Войти в аккаунт" : "Sign in"}</span>
          </Link>
          <Link
            href={registerHref}
            prefetch={false}
            className="wd-drawer-cta-btn"
            onClick={() => setIsOpen(false)}
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>{ru ? "Создать аккаунт" : "Create account"}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </>
  );
}
