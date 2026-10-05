"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { loginAccount, registerAccount } from "./account-client";
import { accountErrorMessage } from "./account-messages";
import { accountPath, loginPath, registerPath } from "../../lib/routes";

interface AccountAuthFormProps {
  readonly locale: Locale;
  readonly mode: "login" | "register";
}

export function AccountAuthForm({ locale, mode }: AccountAuthFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ru = locale === "ru";
  const register = mode === "register";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      if (urlError === "yandex_not_configured") {
        setError(ru ? "Авторизация через Яндекс ID ещё не настроена (укажите Client ID и Client Secret)." : "Yandex ID authentication is not yet configured (missing Client ID / Secret).");
      } else if (urlError === "yandex_access_denied") {
        setError(ru ? "Вы отменили вход через Яндекс ID." : "Yandex ID login was cancelled.");
      } else {
        setError(ru ? `Ошибка входа через Яндекс ID (${urlError})` : `Yandex ID login error (${urlError})`);
      }
    }
  }, [ru]);
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
      window.location.assign(accountPath(locale));
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
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
        <Link
          href="/api/account/yandex/login"
          prefetch={false}
          className="wd-yandex-auth-btn"
          aria-label={ru ? "Войти с Яндекс ID" : "Sign in with Yandex ID"}
        >
          <svg className="wd-yandex-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D" />
            <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff" />
          </svg>
          <span>{ru ? "Войти с Яндекс ID" : "Sign in with Yandex ID"}</span>
        </Link>
      </div>

      <div className="wd-auth-divider" aria-hidden="true">
        <span>{ru ? "или через эл. почту" : "or with email"}</span>
      </div>

      <form
        className="wd-auth-form"
        method="post"
        action={register ? registerPath(locale) : loginPath(locale)}
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
        <Link href={register ? loginPath(locale) : registerPath(locale)}>{text.alternateAction}</Link>
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
