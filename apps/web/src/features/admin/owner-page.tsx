
import { adminLoginPath, adminPath } from "./admin-routing";
import { ownerAccessStatus } from "./owner-access";
import { OwnerDashboard } from "./owner-dashboard";
import "./owner-dashboard.css";

export const ownerMetadata = {
  robots: { index: false, follow: false, nocache: true },
};

export async function OwnerPage({ locale }: { locale: "ru" | "en" }) {
  const status = await ownerAccessStatus();
  const ru = locale === "ru";
  return (
    <main className="shell wd-owner-page">
      <header className="wd-owner-header">
        <h1>{ru ? "Кабинет владельца" : "Owner dashboard"}</h1>
        <div className="wd-owner-actions">
          <a className="wd-button wd-button-secondary" href={ru ? "/account" : "/en/account"}>
            {ru ? "Личный кабинет" : "My account"}
          </a>
          <a href={adminPath(ru ? "en" : "ru")} hrefLang={ru ? "en" : "ru"} lang={ru ? "en" : "ru"}>
            {ru ? "English" : "Русский"}
          </a>
        </div>
      </header>
      {status === 200 ? <OwnerDashboard locale={locale} /> : (
        <section className="wd-owner-panel wd-owner-notice">
          <p>{status === 401
            ? (ru ? "Войдите в WebDiag, чтобы открыть кабинет владельца." : "Sign in to WebDiag to open the owner dashboard.")
            : status === 403
              ? (ru ? "Кабинет доступен владельцу WebDiag." : "This dashboard is available to the WebDiag owner.")
              : (ru ? "Данные кабинета временно недоступны." : "Dashboard data is temporarily unavailable.")}</p>
          {status === 401 && <a className="wd-button wd-button-primary" href={adminLoginPath(locale)}>{ru ? "Войти" : "Sign in"}</a>}
          {status >= 500 && <a className="wd-button wd-button-secondary" href={adminPath(locale)}>{ru ? "Повторить" : "Retry"}</a>}
        </section>
      )}
    </main>
  );
}
