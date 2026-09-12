"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { readAuthMessage } from "./auth-api-response";
import styles from "./auth-form.module.css";
import type { AuthLocale } from "./auth-shell";

type AuthMode = "login" | "register" | "forgot-password" | "resend-verification";

type AuthFormProps = {
  locale: AuthLocale;
  mode: AuthMode;
};

type Copy = {
  email: string;
  password: string;
  submit: string;
  pending: string;
  forgot: string;
  alternatePrefix: string;
  alternateLabel: string;
  alternateHref: string;
  yandex: string;
  yandexSoon: string;
  genericError: string;
};

const copies: Record<AuthLocale, Record<AuthMode, Copy>> = {
  ru: {
    login: {
      email: "Email",
      password: "Пароль",
      submit: "Войти",
      pending: "Входим...",
      forgot: "Забыли пароль?",
      alternatePrefix: "Нет аккаунта?",
      alternateLabel: "Создать аккаунт",
      alternateHref: "/auth/register",
      yandex: "Продолжить с Яндекс ID",
      yandexSoon: "Скоро",
      genericError: "Не удалось войти. Проверьте данные и попробуйте ещё раз.",
    },
    register: {
      email: "Email",
      password: "Пароль",
      submit: "Создать аккаунт",
      pending: "Создаём аккаунт...",
      forgot: "",
      alternatePrefix: "Уже есть аккаунт?",
      alternateLabel: "Войти",
      alternateHref: "/auth/login",
      yandex: "Продолжить с Яндекс ID",
      yandexSoon: "Скоро",
      genericError: "Не удалось создать аккаунт. Проверьте данные и попробуйте ещё раз.",
    },
    "forgot-password": {
      email: "Email",
      password: "",
      submit: "Отправить ссылку",
      pending: "Отправляем...",
      forgot: "",
      alternatePrefix: "Вспомнили пароль?",
      alternateLabel: "Вернуться ко входу",
      alternateHref: "/auth/login",
      yandex: "Продолжить с Яндекс ID",
      yandexSoon: "Скоро",
      genericError: "Не удалось обработать запрос. Попробуйте ещё раз позже.",
    },
    "resend-verification": {
      email: "Email",
      password: "",
      submit: "Отправить письмо повторно",
      pending: "Отправляем...",
      forgot: "",
      alternatePrefix: "Уже подтвердили email?",
      alternateLabel: "Перейти ко входу",
      alternateHref: "/auth/login",
      yandex: "Продолжить с Яндекс ID",
      yandexSoon: "Скоро",
      genericError: "Не удалось отправить письмо. Попробуйте ещё раз позже.",
    },
  },
  en: {
    login: {
      email: "Email",
      password: "Password",
      submit: "Sign in",
      pending: "Signing in...",
      forgot: "Forgot password?",
      alternatePrefix: "No account yet?",
      alternateLabel: "Create account",
      alternateHref: "/en/auth/register",
      yandex: "Continue with Yandex ID",
      yandexSoon: "Soon",
      genericError: "Could not sign in. Check your details and try again.",
    },
    register: {
      email: "Email",
      password: "Password",
      submit: "Create account",
      pending: "Creating account...",
      forgot: "",
      alternatePrefix: "Already have an account?",
      alternateLabel: "Sign in",
      alternateHref: "/en/auth/login",
      yandex: "Continue with Yandex ID",
      yandexSoon: "Soon",
      genericError: "Could not create the account. Check your details and try again.",
    },
    "forgot-password": {
      email: "Email",
      password: "",
      submit: "Send reset link",
      pending: "Sending...",
      forgot: "",
      alternatePrefix: "Remembered your password?",
      alternateLabel: "Back to sign in",
      alternateHref: "/en/auth/login",
      yandex: "Continue with Yandex ID",
      yandexSoon: "Soon",
      genericError: "Could not process the request. Try again later.",
    },
    "resend-verification": {
      email: "Email",
      password: "",
      submit: "Resend verification email",
      pending: "Sending...",
      forgot: "",
      alternatePrefix: "Already verified your email?",
      alternateLabel: "Go to sign in",
      alternateHref: "/en/auth/login",
      yandex: "Continue with Yandex ID",
      yandexSoon: "Soon",
      genericError: "Could not send the email. Try again later.",
    },
  },
};

function authEndpoint(mode: AuthMode): string {
  if (mode === "forgot-password") return "/api/auth/forgot-password";
  if (mode === "resend-verification") return "/api/auth/resend-verification";
  return `/api/auth/${mode}`;
}

export function AuthForm({ locale, mode }: AuthFormProps) {
  const copy = copies[locale][mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const needsPassword = mode === "login" || mode === "register";
  const loginHref = locale === "ru" ? "/auth/login" : "/en/auth/login";
  const forgotHref = locale === "ru" ? "/auth/forgot-password" : "/en/auth/forgot-password";
  const resendHref = locale === "ru" ? "/auth/resend-verification" : "/en/auth/resend-verification";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setVerificationRequired(false);
    setPending(true);

    try {
      const response = await fetch(authEndpoint(mode), {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          needsPassword
            ? { email: email.trim(), password, locale }
            : { email: email.trim(), locale },
        ),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readAuthMessage(payload) ?? copy.genericError);
        setVerificationRequired(mode === "login" && response.status === 403);
        return;
      }

      if (mode === "login") {
        window.location.assign(locale === "ru" ? "/" : "/en");
        return;
      }

      const apiMessage = readAuthMessage(payload);
      if (apiMessage) {
        setMessage(apiMessage);
      } else if (mode === "register") {
        setMessage(
          locale === "ru"
            ? "Проверьте почту и подтвердите email."
            : "Check your inbox and verify your email.",
        );
      } else {
        setMessage(
          locale === "ru"
            ? "Если аккаунт существует, ссылка отправлена на указанный email."
            : "If the account exists, a reset link has been sent.",
        );
      }
    } catch {
      setError(copy.genericError);
    } finally {
      setPending(false);
    }
  }

  if (message) {
    const stateTitle =
      mode === "register"
        ? locale === "ru"
          ? "Проверьте почту"
          : "Check your inbox"
        : locale === "ru"
          ? "Запрос принят"
          : "Request received";

    return (
      <div className={styles.state} role="status">
        <strong>{stateTitle}</strong>
        <p>{message}</p>
        <div className={styles.stateActions}>
          {mode === "register" ? (
            <Link className={styles.primaryLink} href={resendHref}>
              {locale === "ru" ? "Отправить письмо повторно" : "Resend verification email"}
            </Link>
          ) : null}
          <Link className={mode === "register" ? styles.secondaryLink : styles.primaryLink} href={loginHref}>
            {locale === "ru" ? "Перейти ко входу" : "Go to sign in"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <form className={styles.form} onSubmit={submit}>
        <label>
          <span>{copy.email}</span>
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        {needsPassword ? (
          <label>
            <span>{copy.password}</span>
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 10 : 1}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                mode === "register"
                  ? locale === "ru"
                    ? "Минимум 10 символов"
                    : "At least 10 characters"
                  : "••••••••••"
              }
              required
              type="password"
              value={password}
            />
          </label>
        ) : null}

        {mode === "login" ? (
          <Link className={styles.forgot} href={forgotHref}>
            {copy.forgot}
          </Link>
        ) : null}
        {error ? (
          <div className={styles.error} role="alert">
            <p>{error}</p>
            {verificationRequired ? (
              <Link href={resendHref}>
                {locale === "ru" ? "Отправить письмо ещё раз" : "Resend verification email"}
              </Link>
            ) : null}
          </div>
        ) : null}

        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      {mode === "login" || mode === "register" ? (
        <div className={styles.socialBlock}>
          <div className={styles.divider}>
            <span>{locale === "ru" ? "или" : "or"}</span>
          </div>
          <button
            aria-label={
              locale === "ru"
                ? "Продолжить с Яндекс ID — скоро"
                : "Continue with Yandex ID — soon"
            }
            className={styles.yandexButton}
            disabled
            title={
              locale === "ru"
                ? "Яндекс ID будет доступен после подключения OAuth"
                : "Yandex ID will be available after OAuth is connected"
            }
            type="button"
          >
            <span className={styles.yandexMark} aria-hidden="true">
              Я
            </span>
            <span>{copy.yandex}</span>
            <small>{copy.yandexSoon}</small>
          </button>
        </div>
      ) : null}

      <p className={styles.alternate}>
        {copy.alternatePrefix}{" "}
        <Link href={copy.alternateHref}>{copy.alternateLabel}</Link>
      </p>
    </div>
  );
}
