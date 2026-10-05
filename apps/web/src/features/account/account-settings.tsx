"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import type { AccountSessionResponse } from "./account-contract";
import { AccountClientError } from "./account-client";
import { accountAuthenticationWasLost } from "./account-authentication-state";
import { accountErrorMessage } from "./account-messages";
import {
  changeAccountPassword,
  getAccountSessions,
  revokeOtherAccountSessions,
} from "./account-settings-client";

export function AccountSettings({
  locale,
  session,
  onUnauthenticated,
}: {
  readonly locale: Locale;
  readonly session: AccountSessionResponse;
  readonly onUnauthenticated: () => void;
}) {
  const ru = locale === "ru";
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [sessionLoadError, setSessionLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordErrorScope, setPasswordErrorScope] = useState<"current" | "new" | "all" | null>(null);
  const [passwordStatus, setPasswordStatus] = useState("");
  const [sessionsPending, setSessionsPending] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionsStatus, setSessionsStatus] = useState("");
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [packError, setPackError] = useState("");

  async function handleDirectBuyPack(packId: string) {
    setLoadingPack(packId);
    setPackError("");
    try {
      const resp = await fetch("/api/billing/lava/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack_id: packId }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(
          data?.detail?.message ||
            (ru ? "Не удалось выставить счёт на оплату." : "Failed to create payment invoice.")
        );
      }
      const data = await resp.json();
      if (data.payment_url) {
        window.location.assign(data.payment_url);
      } else {
        throw new Error(ru ? "Ссылка на оплату не получена." : "Payment URL not returned.");
      }
    } catch (err: unknown) {
      setPackError(
        err instanceof Error
          ? err.message
          : ru
          ? "Ошибка связи с платежным сервисом."
          : "Payment service connection error."
      );
    } finally {
      setLoadingPack(null);
    }
  }

  useEffect(() => {
    let active = true;
    getAccountSessions()
      .then((value) => {
        if (!active) return;
        setSessionCount(value.active_session_count);
        setSessionLoadError("");
      })
      .catch((caught) => {
        if (!active) return;
        if (accountAuthenticationWasLost(caught)) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          onUnauthenticated();
          return;
        }
        setSessionLoadError(accountErrorMessage(locale, caught));
      });
    return () => { active = false; };
  }, [locale, onUnauthenticated, reload]);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordErrorScope(null);
    setPasswordStatus("");
    if (newPassword !== confirmPassword) {
      setPasswordError(ru ? "Новые пароли не совпадают." : "The new passwords do not match.");
      setPasswordErrorScope("new");
      return;
    }
    setPasswordPending(true);
    try {
      await changeAccountPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSessionCount(1);
      setSessionsStatus("");
      setPasswordStatus(ru
        ? "Пароль изменён. Осталась только текущая сессия."
        : "Password changed. Only the current session remains.");
    } catch (caught) {
      setNewPassword("");
      setConfirmPassword("");
      if (accountAuthenticationWasLost(caught)) {
        setCurrentPassword("");
        onUnauthenticated();
        return;
      }
      setPasswordError(accountErrorMessage(locale, caught));
      setPasswordErrorScope(
        caught instanceof AccountClientError && caught.code === "account_invalid_current_password"
          ? "current"
          : caught instanceof AccountClientError && caught.code === "account_password_unchanged"
            ? "new"
            : "all",
      );
    } finally {
      setPasswordPending(false);
    }
  }

  async function revokeOthers() {
    if (!window.confirm(ru
      ? "Завершить все остальные сессии? Текущая сессия останется активной."
      : "End all other sessions? The current session will remain active.")) return;
    setSessionsPending(true);
    setSessionsError("");
    setSessionsStatus("");
    try {
      const value = await revokeOtherAccountSessions();
      setSessionCount(value.active_session_count);
      setSessionsStatus(value.revoked_session_count > 0
        ? (ru ? `Завершено сессий: ${value.revoked_session_count}.` : `Sessions ended: ${value.revoked_session_count}.`)
        : (ru ? "Других активных сессий нет." : "There are no other active sessions."));
    } catch (caught) {
      if (accountAuthenticationWasLost(caught)) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onUnauthenticated();
        return;
      }
      setSessionsError(accountErrorMessage(locale, caught));
    } finally {
      setSessionsPending(false);
    }
  }

  function retrySessions() {
    setSessionLoadError("");
    setReload((value) => value + 1);
  }

  const createdAt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "long",
  }).format(new Date(session.user.created_at));

  return (
    <section className="wd-account-dashboard wd-account-settings-page">
      <header className="wd-account-dashboard-head">
        <div>
          <span className="eyebrow">{ru ? "Безопасность аккаунта" : "Account security"}</span>
          <h1>{ru ? "Настройки аккаунта" : "Account settings"}</h1>
          <p>{ru ? "Проверьте данные профиля, смените пароль или завершите другие активные сессии." : "Review your profile, change your password, or end other active sessions."}</p>
        </div>
      </header>

      <div className="wd-account-settings-grid">
        <section className="wd-account-card" aria-labelledby="account-identity-title">
          <span className="eyebrow">{ru ? "Профиль" : "Profile"}</span>
          <h2 id="account-identity-title">{ru ? "Данные аккаунта" : "Account details"}</h2>
          <dl className="wd-account-settings-identity">
            <div><dt>{ru ? "Имя" : "Name"}</dt><dd>{session.user.display_name}</dd></div>
            <div><dt>{ru ? "Электронная почта" : "Email"}</dt><dd>{session.user.email}</dd></div>
            <div><dt>{ru ? "Аккаунт создан" : "Account created"}</dt><dd>{createdAt}</dd></div>
          </dl>
        </section>

        <section className="wd-account-card wd-account-billing-card" aria-labelledby="account-billing-title">
          <span className="eyebrow">{ru ? "Тариф и баланс" : "Plan & Balance"}</span>
          <h2 id="account-billing-title">{ru ? "Подписка и AI-кредиты" : "Subscription & Credits"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--wd-s, #f8fafc)", borderRadius: "10px", border: "1px solid var(--wd-l, #e2e8f0)" }}>
              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>{ru ? "Тариф: Стартовый" : "Plan: Starter"}</strong>
                <small style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Базовая диагностика и экспресс-аудиты" : "Base diagnostics & express audits"}</small>
              </div>
              <span className="tool-badge tool-badge-success">{ru ? "Активен" : "Active"}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--wd-ms, #64748b)", margin: "4px 0 8px 0" }}>
              {ru
                ? "AI-кредиты расходуются на умные рекомендации, генерацию планов исправлений, анализ конкурентных пробелов и ТЗ для копирайтеров."
                : "AI credits are used for smart recommendations, fix plan generation, competitor gap analysis, and content briefs."}
            </p>
            {packError && (
              <p className="wd-account-error" role="alert" style={{ margin: "4px 0" }}>
                {packError}
              </p>
            )}

            <div style={{ marginTop: "8px" }}>
              <strong style={{ fontSize: "13px", display: "block", marginBottom: "8px", color: "var(--wd-f, #0f172a)" }}>
                {ru ? "Быстрое пополнение баланса AI-кредитов:" : "Quick credit top-up:"}
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--wd-l, #e2e8f0)", background: "var(--wd-s, #fff)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "14px" }}>50 {ru ? "кредитов" : "credits"}</strong>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#2563eb" }}>490 ₽</span>
                  </div>
                  <small style={{ color: "var(--wd-ms, #64748b)", display: "block", marginBottom: "10px" }}>9.8 ₽ / {ru ? "кредит" : "credit"}</small>
                  <button
                    type="button"
                    disabled={loadingPack !== null}
                    onClick={() => handleDirectBuyPack("pack-50")}
                    className="wd-button wd-button-primary"
                    style={{ width: "100%", fontSize: "12px", padding: "6px 12px" }}
                  >
                    {loadingPack === "pack-50" ? (ru ? "Создание счёта..." : "Creating...") : (ru ? "Купить за 490 ₽" : "Buy 490 ₽")}
                  </button>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", border: "2px solid #6366f1", background: "rgba(99, 102, 241, 0.04)", position: "relative" }}>
                  <span style={{ position: "absolute", top: "-10px", right: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>
                    {ru ? "ХИТ" : "POPULAR"}
                  </span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "14px" }}>150 {ru ? "кредитов" : "credits"}</strong>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#6366f1" }}>1 190 ₽</span>
                  </div>
                  <small style={{ color: "var(--wd-ms, #64748b)", display: "block", marginBottom: "10px" }}>7.9 ₽ / {ru ? "кредит" : "credit"}</small>
                  <button
                    type="button"
                    disabled={loadingPack !== null}
                    onClick={() => handleDirectBuyPack("pack-150")}
                    className="wd-button wd-button-primary"
                    style={{ width: "100%", fontSize: "12px", padding: "6px 12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    {loadingPack === "pack-150" ? (ru ? "Создание счёта..." : "Creating...") : (ru ? "Купить за 1 190 ₽" : "Buy 1 190 ₽")}
                  </button>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--wd-l, #e2e8f0)", background: "var(--wd-s, #fff)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "14px" }}>500 {ru ? "кредитов" : "credits"}</strong>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#2563eb" }}>2 990 ₽</span>
                  </div>
                  <small style={{ color: "var(--wd-ms, #64748b)", display: "block", marginBottom: "10px" }}>5.9 ₽ / {ru ? "кредит" : "credit"}</small>
                  <button
                    type="button"
                    disabled={loadingPack !== null}
                    onClick={() => handleDirectBuyPack("pack-500")}
                    className="wd-button wd-button-primary"
                    style={{ width: "100%", fontSize: "12px", padding: "6px 12px" }}
                  >
                    {loadingPack === "pack-500" ? (ru ? "Создание счёта..." : "Creating...") : (ru ? "Купить за 2 990 ₽" : "Buy 2 990 ₽")}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
              <Link
                href={ru ? "/pricing" : "/en/pricing"}
                className="wd-button wd-button-secondary"
                style={{ fontSize: "13px" }}
              >
                {ru ? "Тарифы подписки (Pro / Team)" : "Subscription plans (Pro / Team)"}
              </Link>
            </div>
          </div>
        </section>

        <section className="wd-account-card" aria-labelledby="account-sessions-title">
          <span className="eyebrow">{ru ? "Сессии" : "Sessions"}</span>
          <h2 id="account-sessions-title">{ru ? "Активные входы" : "Active sign-ins"}</h2>
          {sessionCount === null && !sessionLoadError && <p aria-busy="true">{ru ? "Загружаем сессии…" : "Loading sessions…"}</p>}
          {sessionLoadError && <><p className="wd-account-error" role="alert">{sessionLoadError}</p><button className="wd-button wd-button-secondary" type="button" onClick={retrySessions}>{ru ? "Повторить" : "Retry"}</button></>}
          {sessionCount !== null && <p className="wd-account-session-count"><strong>{sessionCount}</strong><span>{ru ? "активных сессий" : "active sessions"}</span></p>}
          <p>{ru ? "Завершение других сессий не отключает этот браузер." : "Ending other sessions keeps this browser signed in."}</p>
          <button className="wd-button wd-button-secondary" type="button" onClick={revokeOthers} disabled={sessionsPending || sessionCount === null} aria-busy={sessionsPending}>{sessionsPending ? (ru ? "Завершаем…" : "Ending…") : (ru ? "Завершить другие сессии" : "End other sessions")}</button>
          {sessionsStatus && <p role="status">{sessionsStatus}</p>}
          {sessionsError && <p className="wd-account-error" role="alert">{sessionsError}</p>}
        </section>

        <section className="wd-account-card wd-account-password-card" aria-labelledby="account-password-title">
          <span className="eyebrow">{ru ? "Безопасность" : "Security"}</span>
          <h2 id="account-password-title">{ru ? "Изменить пароль" : "Change password"}</h2>
          <p>{ru ? "После изменения все остальные сессии будут завершены." : "Changing the password ends every other session."}</p>
          <form className="wd-account-form" onSubmit={submitPassword}>
            <label><span>{ru ? "Текущий пароль" : "Current password"}</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={1} maxLength={128} required disabled={passwordPending} aria-invalid={passwordErrorScope === "current" || passwordErrorScope === "all"} aria-describedby={passwordError && (passwordErrorScope === "current" || passwordErrorScope === "all") ? "account-password-error" : undefined} /></label>
            <label><span>{ru ? "Новый пароль" : "New password"}</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} maxLength={128} required disabled={passwordPending} aria-invalid={passwordErrorScope === "new" || passwordErrorScope === "all"} aria-describedby={`account-password-help${passwordError && (passwordErrorScope === "new" || passwordErrorScope === "all") ? " account-password-error" : ""}`} /></label>
            <label><span>{ru ? "Повторите новый пароль" : "Confirm new password"}</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} maxLength={128} required disabled={passwordPending} aria-invalid={passwordErrorScope === "new" || passwordErrorScope === "all"} aria-describedby={passwordError && (passwordErrorScope === "new" || passwordErrorScope === "all") ? "account-password-error" : undefined} /></label>
            <small id="account-password-help">{ru ? "От 6 символов; не используйте часть электронной почты." : "At least 6 characters without the email local part."}</small>
            {passwordError && <p id="account-password-error" className="wd-account-error" role="alert">{passwordError}</p>}
            {passwordStatus && <p role="status">{passwordStatus}</p>}
            <button className="wd-button wd-button-primary" type="submit" disabled={passwordPending} aria-busy={passwordPending}>{passwordPending ? (ru ? "Изменяем…" : "Changing…") : (ru ? "Изменить пароль" : "Change password")}</button>
          </form>
        </section>
      </div>
    </section>
  );
}
