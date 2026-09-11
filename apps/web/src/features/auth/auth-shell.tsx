import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./auth-shell.module.css";

export type AuthLocale = "ru" | "en";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  locale: AuthLocale;
  title: string;
};

const previewCopy = {
  ru: {
    kicker: "WebDiag workspace",
    title: "Проверка сайта начинается сразу после входа",
    description: "Техническое состояние, SEO, скорость и безопасность — в одном отчёте с понятными приоритетами.",
  },
  en: {
    kicker: "WebDiag workspace",
    title: "Start diagnosing your website right after sign-in",
    description: "Technical health, SEO, performance and security in one prioritized report.",
  },
} satisfies Record<AuthLocale, { kicker: string; title: string; description: string }>;

export function AuthShell({ children, description, locale, title }: AuthShellProps) {
  const homeHref = locale === "ru" ? "/" : "/en";
  const copy = previewCopy[locale];

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.formPanel} aria-labelledby="auth-title">
        <div className={styles.formContainer}>
          <Link className={styles.brand} href={homeHref} aria-label={locale === "ru" ? "WebDiag — на главную" : "WebDiag — home"}>
            <span className={styles.brandMark} aria-hidden="true">W</span>
            <span>WebDiag</span>
          </Link>

          <div className={styles.heading}>
            <span className={styles.eyebrow}>{locale === "ru" ? "Аккаунт WebDiag" : "WebDiag account"}</span>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>

          {children}

          <p className={styles.support}>
            {locale === "ru" ? "Нужна помощь?" : "Need help?"}{" "}
            <a href="mailto:support@webdiag.ru">support@webdiag.ru</a>
          </p>
        </div>
      </section>

      <aside className={styles.previewPanel} aria-label={locale === "ru" ? "Превью интерфейса WebDiag" : "WebDiag interface preview"}>
        <div className={styles.previewIntro}>
          <span>{copy.kicker}</span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>

        <div className={styles.auditCard} aria-hidden="true">
          <div className={styles.auditHeader}>
            <div>
              <span>webdiag.ru</span>
              <strong>Website health</strong>
            </div>
            <div className={styles.score}><strong>92</strong><span>/ 100</span></div>
          </div>

          <div className={styles.metrics}>
            <div><span>SEO</span><strong>96</strong><i style={{ "--metric": "96%" } as React.CSSProperties} /></div>
            <div><span>Performance</span><strong>88</strong><i style={{ "--metric": "88%" } as React.CSSProperties} /></div>
            <div><span>Security</span><strong>94</strong><i style={{ "--metric": "94%" } as React.CSSProperties} /></div>
            <div><span>Accessibility</span><strong>91</strong><i style={{ "--metric": "91%" } as React.CSSProperties} /></div>
          </div>

          <div className={styles.issueSummary}>
            <span className={styles.issueDot} />
            <div><strong>3 issues found</strong><span>Prioritized by impact</span></div>
            <span className={styles.issueLink}>View report →</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
