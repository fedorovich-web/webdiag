"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { loginAccount, registerAccount } from "./account-client";
import { accountErrorMessage } from "./account-messages";
import { loginPath, registerPath } from "../../lib/routes";
import { accountReturnPath } from "./account-navigation";

interface AccountAuthFormProps {
  readonly locale: Locale;
  readonly mode: "login" | "register";
  readonly returnTo?: string;
  readonly oauthError?: string;
}

export function AccountAuthForm({ locale, mode, returnTo, oauthError }: AccountAuthFormProps) {
  const [pending, setPending] = useState(false);
  const ru = locale === "ru";
  const register = mode === "register";
  const needsYandexProof = oauthError === "yandex_account_link_required";
  const destination = accountReturnPath(returnTo, locale);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState(() => {
    if (!oauthError) return "";
    if (needsYandexProof) return ru ? "Подтвердите владение email аккаунта кодом из письма." : "Confirm ownership of the account email with an email code.";
    if (oauthError === "yandex_access_denied") return ru ? "Вы отменили вход через Яндекс ID." : "Yandex ID sign-in was cancelled.";
    return ru ? "Не удалось войти через Яндекс ID. Начните вход ещё раз или используйте email и пароль." : "Could not sign in with Yandex ID. Try again or use your email and password.";
  });
  const text = ru
    ? {
        eyebrow: "Личный кабинет",
        title: register ? "Создать аккаунт" : "Войти в WebDiag",
        lead: register
          ? "Создайте аккаунт, чтобы сохранять проекты, отчёты и следить за изменениями сайта."
          : "Войдите, чтобы продолжить работу с проектами, аудитами и мониторингом.",
        name: "Имя",
        email: "Электронная почта",
        password: "Пароль",
        namePlaceholder: "Как к вам обращаться",
        emailPlaceholder: "you@example.ru",
        passwordPlaceholder: register ? "От 6 символов" : "Введите пароль",
        passwordHint: "От 6 символов. Не используйте часть адреса электронной почты.",
        submit: register ? "Создать аккаунт" : "Войти",
        pending: register ? "Создаём аккаунт…" : "Входим…",
        alternate: register ? "Уже есть аккаунт?" : "Нет аккаунта?",
        alternateAction: register ? "Войти" : "Зарегистрироваться",
        privacy: "Создавая аккаунт, вы соглашаетесь с обработкой данных согласно политике конфиденциальности.",
        privacyLink: "Политика конфиденциальности",
        bonusPill: "🎁 10 бесплатных AI-кредитов в подарок при регистрации",
      }
    : {
        eyebrow: "Account",
        title: register ? "Create an account" : "Sign in to WebDiag",
        lead: register
          ? "Create an account to save projects and reports and monitor website changes."
          : "Sign in to continue working with projects, audits, and monitoring.",
        name: "Name",
        email: "Email address",
        password: "Password",
        namePlaceholder: "How should we address you?",
        emailPlaceholder: "you@example.com",
        passwordPlaceholder: register ? "At least 6 characters" : "Enter password",
        passwordHint: "At least 6 characters. Do not include the email local part.",
        submit: register ? "Create account" : "Sign in",
        pending: register ? "Creating account…" : "Signing in…",
        alternate: register ? "Already have an account?" : "Need an account?",
        alternateAction: register ? "Sign in" : "Register",
        privacy: "By creating an account, you agree to data processing under the privacy policy.",
        privacyLink: "Privacy policy",
        bonusPill: "🎁 10 free AI starter credits included upon signup",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (register) {
        await registerAccount({
          email: String(data.get("email") ?? ""),
          displayName: String(data.get("display_name") ?? ""),
          password: String(data.get("password") ?? ""),
        });
      } else {
        await loginAccount({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        });
      }
      window.location.assign(accountReturnPath(new URLSearchParams(window.location.search).get("return_to"), locale));
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  async function confirmByEmail() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/account/yandex/recovery", {
        method: "POST", headers: { "content-type": "application/json" }, credentials: "include",
        body: JSON.stringify({ locale, ...(recoverySent ? { code: recoveryCode } : {}) }),
      });
      if (!response.ok) throw new Error(ru ? "Не удалось подтвердить вход. Проверьте код или начните вход через Яндекс ещё раз." : "Could not confirm sign-in. Check the code or restart Yandex sign-in.");
      if (recoverySent) window.location.assign(accountReturnPath(new URLSearchParams(window.location.search).get("return_to"), locale));
      else setRecoverySent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (ru ? "Ошибка подтверждения." : "Confirmation failed."));
    } finally { setPending(false); }
  }

  return (
    <section className="wd-auth-card" data-mode={mode} aria-labelledby="account-auth-title">
      <header className="wd-auth-card-head">
        <span className="wd-eyebrow">{text.eyebrow}</span>
        <h1 id="account-auth-title">{text.title}</h1>
        <p>{text.lead}</p>
        {register && (
          <div className="wd-auth-bonus-pill" role="status">
            <span>{text.bonusPill}</span>
          </div>
        )}
      </header>

      <div className="wd-auth-oauth-section">
        <a
          href={`/api/account/yandex/login?locale=${locale}&return_to=${encodeURIComponent(destination)}`}
          className="wd-yandex-auth-btn"
          aria-label={ru ? "Войти с Яндекс ID" : "Sign in with Yandex ID"}
        >
          <Image className="wd-yandex-icon" src="/icons/yandex-id.svg" width={24} height={24} alt="" aria-hidden="true" unoptimized />
          <span>{ru ? "Войти с Яндекс ID" : "Sign in with Yandex ID"}</span>
        </a>
      </div>

      <div className="wd-auth-divider" aria-hidden="true">
        <span>{ru ? "или через эл. почту" : "or with email"}</span>
      </div>

      {needsYandexProof && <div className="wd-auth-form">
        <p>{ru ? "Первое подключение Яндекс ID к существующему аккаунту требует кода из письма. Восстановление отключит прежний пароль и завершит другие сессии; дальше можно входить через Яндекс ID." : "Linking Yandex ID to an existing account requires an email code. Recovery disables the previous password and ends other sessions; continue signing in with Yandex ID."}</p>
        {recoverySent && <label><span>{ru ? "Код отправлен на email аккаунта" : "Code sent to your account email"}</span>
          <input value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" disabled={pending} />
        </label>}
        <button className="wd-button wd-button-secondary" type="button" onClick={confirmByEmail} disabled={pending || (recoverySent && !/^\d{6}$/u.test(recoveryCode))}>
          {recoverySent ? (ru ? "Подтвердить код" : "Confirm code") : (ru ? "Получить код на email" : "Email me a code")}
        </button>
      </div>}

      <form
        method="post"
        action={`/api/account/${register ? "register" : "login"}`}
        className="wd-auth-form"
        onSubmit={onSubmit}
        aria-busy={pending}
      >
        {register && (
          <label>
            <span>{text.name}</span>
            <input
              name="display_name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              placeholder={text.namePlaceholder}
              disabled={pending}
              required
            />
          </label>
        )}
        <label>
          <span>{text.email}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder={text.emailPlaceholder}
            disabled={pending}
            required
          />
        </label>
        <label>
          <span>{text.password}</span>
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 6 : 1}
            maxLength={128}
            placeholder={text.passwordPlaceholder}
            aria-describedby={register ? "account-password-hint" : undefined}
            disabled={pending}
            required
          />
          {register && <small id="account-password-hint">{text.passwordHint}</small>}
        </label>

        {error && <p className="wd-auth-error" role="alert">{error}</p>}

        <button className="wd-auth-submit" type="submit" disabled={pending}>
          {pending ? text.pending : text.submit}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="wd-auth-alternate">
        {text.alternate}{" "}
        <Link href={`${register ? loginPath(locale) : registerPath(locale)}?return_to=${encodeURIComponent(destination)}`}>{text.alternateAction}</Link>
      </p>

      {register && (
        <p className="wd-auth-privacy">
          {text.privacy}{" "}
          <Link href={ru ? "/privacy" : "/en/privacy"}>{text.privacyLink}</Link>
        </p>
      )}
    </section>
  );
}
