"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
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
        passwordPlaceholder: register ? "Не менее 12 символов" : "Введите пароль",
        passwordHint: "От 12 до 128 символов. Не используйте часть адреса электронной почты.",
        submit: register ? "Создать аккаунт" : "Войти",
        pending: register ? "Создаём аккаунт…" : "Входим…",
        alternate: register ? "Уже есть аккаунт?" : "Нет аккаунта?",
        alternateAction: register ? "Войти" : "Зарегистрироваться",
        privacy: "Создавая аккаунт, вы соглашаетесь с обработкой данных согласно политике конфиденциальности.",
        privacyLink: "Политика конфиденциальности",
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
        passwordPlaceholder: register ? "At least 12 characters" : "Enter password",
        passwordHint: "12 to 128 characters. Do not include the email local part.",
        submit: register ? "Create account" : "Sign in",
        pending: register ? "Creating account…" : "Signing in…",
        alternate: register ? "Already have an account?" : "Need an account?",
        alternateAction: register ? "Sign in" : "Register",
        privacy: "By creating an account, you agree to data processing under the privacy policy.",
        privacyLink: "Privacy policy",
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
      </header>

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
            minLength={register ? 12 : 1}
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

      {!register && <div className="wd-auth-divider" aria-hidden="true"><span>{ru ? "или" : "or"}</span></div>}

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
