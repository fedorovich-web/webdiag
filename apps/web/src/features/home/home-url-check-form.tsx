"use client";

import { type FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@webdiag/tool-registry";
import { parseAuditUrlInput } from "./audit-client";

const copy = {
  ru: {
    label: "Адрес сайта или страницы", placeholder: "https://example.ru", button: "Проверить сайт",
    empty: "Введите адрес сайта или страницы.", invalid: "Введите публичный HTTP(S) URL с доменом.",
  },
  en: {
    label: "Website or page URL", placeholder: "https://example.com", button: "Check website",
    empty: "Enter a website or page URL.", invalid: "Enter a public HTTP(S) URL with a domain.",
  },
} as const;

export function HomeUrlCheckForm({ locale, instance = "hero" }: { locale: Locale; instance?: "hero" | "final" }) {
  const t = copy[locale];
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAuditUrlInput(value);
    if (!parsed) {
      setMessage(value.trim() ? t.invalid : t.empty);
      return;
    }
    const prefix = locale === "ru" ? "" : "/en";
    router.push(`${prefix}/tools/single-page-audit?url=${encodeURIComponent(parsed.href)}`);
  }

  return <form className={`wd-url-check wd-url-check-${instance}`} id={`check-url-${instance}`} onSubmit={submit} noValidate>
    <label htmlFor={inputId}>{t.label}</label>
    <div>
      <input id={inputId} type="url" inputMode="url" autoComplete="url" placeholder={t.placeholder}
        value={value} aria-invalid={message ? "true" : undefined} aria-describedby={`${inputId}-status`}
        onChange={(event) => { setValue(event.target.value); setMessage(""); }} />
      <button type="submit">{t.button}</button>
    </div>
    <p id={`${inputId}-status`} aria-live="polite" data-state={message ? "error" : "idle"}>{message}</p>
  </form>;
}
