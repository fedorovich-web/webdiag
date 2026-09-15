"use client";

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
            <label><span>{ru ? "Новый пароль" : "New password"}</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={128} required disabled={passwordPending} aria-invalid={passwordErrorScope === "new" || passwordErrorScope === "all"} aria-describedby={`account-password-help${passwordError && (passwordErrorScope === "new" || passwordErrorScope === "all") ? " account-password-error" : ""}`} /></label>
            <label><span>{ru ? "Повторите новый пароль" : "Confirm new password"}</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} required disabled={passwordPending} aria-invalid={passwordErrorScope === "new" || passwordErrorScope === "all"} aria-describedby={passwordError && (passwordErrorScope === "new" || passwordErrorScope === "all") ? "account-password-error" : undefined} /></label>
            <small id="account-password-help">{ru ? "От 12 до 128 символов; не используйте часть электронной почты." : "Use 12 to 128 characters without the email local part."}</small>
            {passwordError && <p id="account-password-error" className="wd-account-error" role="alert">{passwordError}</p>}
            {passwordStatus && <p role="status">{passwordStatus}</p>}
            <button className="wd-button wd-button-primary" type="submit" disabled={passwordPending} aria-busy={passwordPending}>{passwordPending ? (ru ? "Изменяем…" : "Changing…") : (ru ? "Изменить пароль" : "Change password")}</button>
          </form>
        </section>
      </div>
    </section>
  );
}
