"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { readAuthMessage } from "./auth-api-response";
import styles from "./auth-form.module.css";
import type { AuthLocale } from "./auth-shell";

type AuthTokenMode = "verify-email" | "reset-password";

type AuthTokenFormProps = {
  locale: AuthLocale;
  mode: AuthTokenMode;
  token?: string;
};

type Copy = {
  submit: string;
  pending: string;
  newPassword: string;
  confirmPassword: string;
  passwordPlaceholder: string;
  missingToken: string;
  mismatch: string;
  genericError: string;
  successTitle: string;
  successBody: string;
  successLink: string;
};

const copies: Record<AuthLocale, Record<AuthTokenMode, Copy>> = {
  ru: {
    "verify-email": {
      submit: "Подтвердить email",
      pending: "Подтверждаем...",
      newPassword: "",
      confirmPassword: "",
      passwordPlaceholder: "",
      missingToken: "В ссылке нет токена подтверждения. Откройте полную ссылку из письма.",
      mismatch: "",
      genericError: "Не удалось подтвердить email. Ссылка могла устареть или уже использоваться.",
      successTitle: "Email подтверждён",
      successBody: "Адрес подтверждён, безопасная сессия создана. Можно продолжить работу в WebDiag.",
      successLink: "Перейти в WebDiag",
    },
    "reset-password": {
      submit: "Сохранить новый пароль",
      pending: "Сохраняем...",
      newPassword: "Новый пароль",
      confirmPassword: "Повторите пароль",
      passwordPlaceholder: "Минимум 10 символов",
      missingToken: "В ссылке нет токена сброса. Запросите новую ссылку восстановления.",
      mismatch: "Пароли не совпадают.",
      genericError: "Не удалось изменить пароль. Ссылка могла устареть или уже использоваться.",
      successTitle: "Пароль изменён",
      successBody: "Старые сессии отозваны. Войдите снова с новым паролем.",
      successLink: "Перейти ко входу",
    },
  },
  en: {
    "verify-email": {
      submit: "Verify email",
      pending: "Verifying...",
      newPassword: "",
      confirmPassword: "",
      passwordPlaceholder: "",
      missingToken: "The verification token is missing. Open the complete link from your email.",
      mismatch: "",
      genericError: "Could not verify the email. The link may be expired or already used.",
      successTitle: "Email verified",
      successBody: "Your email is verified and a secure session is active. You can continue to WebDiag.",
      successLink: "Continue to WebDiag",
    },
    "reset-password": {
      submit: "Save new password",
      pending: "Saving...",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      passwordPlaceholder: "At least 10 characters",
      missingToken: "The reset token is missing. Request a new password reset link.",
      mismatch: "Passwords do not match.",
      genericError: "Could not change the password. The link may be expired or already used.",
      successTitle: "Password changed",
      successBody: "Previous sessions were revoked. Sign in again with your new password.",
      successLink: "Go to sign in",
    },
  },
};

export function AuthTokenForm({ locale, mode, token }: AuthTokenFormProps) {
  const copy = copies[locale][mode];
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isReset = mode === "reset-password";
  const loginHref = locale === "ru" ? "/auth/login" : "/en/auth/login";
  const homeHref = locale === "ru" ? "/" : "/en";

  if (!token) {
    return (
      <div className={styles.state} role="alert">
        <strong>{locale === "ru" ? "Недействительная ссылка" : "Invalid link"}</strong>
        <p>{copy.missingToken}</p>
        <Link className={styles.primaryLink} href={loginHref}>
          {locale === "ru" ? "Вернуться ко входу" : "Back to sign in"}
        </Link>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isReset && password !== confirmation) {
      setError(copy.mismatch);
      return;
    }

    setPending(true);
    try {
      const endpoint = isReset ? "/api/auth/reset-password" : "/api/auth/verify-email";
      const body = isReset
        ? { token, new_password: password, locale }
        : { token, locale };
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readAuthMessage(payload) ?? copy.genericError);
        return;
      }

      setSuccess(true);
    } catch {
      setError(copy.genericError);
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className={styles.state} role="status">
        <strong>{copy.successTitle}</strong>
        <p>{copy.successBody}</p>
        <Link className={styles.primaryLink} href={isReset ? loginHref : homeHref}>
          {copy.successLink}
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {isReset ? (
        <>
          <label>
            <span>{copy.newPassword}</span>
            <input
              autoComplete="new-password"
              minLength={10}
              name="new-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.passwordPlaceholder}
              required
              type="password"
              value={password}
            />
          </label>
          <label>
            <span>{copy.confirmPassword}</span>
            <input
              autoComplete="new-password"
              minLength={10}
              name="confirm-password"
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={copy.passwordPlaceholder}
              required
              type="password"
              value={confirmation}
            />
          </label>
        </>
      ) : (
        <p className={styles.alternate}>
          {locale === "ru"
            ? "Подтверждение выполнится только после нажатия кнопки — открытие ссылки само по себе ничего не меняет."
            : "Verification happens only after you press the button; opening this page alone changes nothing."}
        </p>
      )}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <button className={styles.primaryButton} disabled={pending} type="submit">
        {pending ? copy.pending : copy.submit}
      </button>
    </form>
  );
}
