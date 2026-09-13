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
        title: register ? "Создать аккаунт" : "Войти в WebDiag",
        name: "Имя",
        email: "Электронная почта",
        password: "Пароль",
        passwordHint: "От 12 до 128 символов; не используйте часть адреса электронной почты",
        submit: register ? "Создать аккаунт" : "Войти",
        pending: register ? "Создаём аккаунт…" : "Входим…",
        alternate: register ? "Уже есть аккаунт?" : "Нет аккаунта?",
        alternateAction: register ? "Войти" : "Зарегистрироваться",
        privacy: "Создавая аккаунт, вы соглашаетесь с обработкой данных согласно политике конфиденциальности.",
        privacyLink: "Политика конфиденциальности",
      }
    : {
        title: register ? "Create an account" : "Sign in to WebDiag",
        name: "Name",
        email: "Email address",
        password: "Password",
        passwordHint: "12 to 128 characters; do not include the email local part",
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
    <section className="wd-account-card" aria-labelledby="account-auth-title">
      <h1 id="account-auth-title">{text.title}</h1>
      <form
        className="wd-account-form"
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
            aria-describedby={register ? "account-password-hint" : undefined}
            disabled={pending}
            required
          />
          {register && <small id="account-password-hint">{text.passwordHint}</small>}
        </label>
        {error && <p className="wd-account-error" role="alert">{error}</p>}
        <button className="wd-button wd-button-primary" type="submit" disabled={pending}>
          {pending ? text.pending : text.submit}
        </button>
      </form>
      <p className="wd-account-alternate">
        {text.alternate} {" "}
        <Link href={register ? loginPath(locale) : registerPath(locale)}>{text.alternateAction}</Link>
      </p>
      {register && (
        <p className="wd-account-privacy">
          {text.privacy} {" "}
          <Link href={ru ? "/privacy" : "/en/privacy"}>{text.privacyLink}</Link>
        </p>
      )}
    </section>
  );
}
