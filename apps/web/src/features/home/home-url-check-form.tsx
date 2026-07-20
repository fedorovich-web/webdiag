"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";

const copy = {
  ru: {
    label: "Адрес сайта или страницы",
    placeholder: "https://example.ru",
    button: "Проверить сайт",
    empty: "Введите адрес сайта или страницы.",
    invalid: "Введите полный URL, например https://example.ru.",
    successPrefix: "URL принят:",
    successSuffix: "Ниже открыт пример отчёта, как будет выглядеть результат проверки.",
  },
  en: {
    label: "Website or page URL",
    placeholder: "https://example.com",
    button: "Check website",
    empty: "Enter a website or page URL.",
    invalid: "Enter a full URL, for example https://example.com.",
    successPrefix: "URL accepted:",
    successSuffix: "The sample report below shows how the check result will look.",
  },
} as const;

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function HomeUrlCheckForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const inputId = useMemo(() => `wd-url-check-${locale}`, [locale]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUrl(value);
    if (!normalized) {
      setValid(false);
      setMessage(t.empty);
      return;
    }

    try {
      const parsed = new URL(normalized);
      if (!parsed.hostname.includes(".")) throw new Error("Missing hostname suffix");
      setValue(parsed.href);
      setValid(true);
      setMessage(`${t.successPrefix} ${parsed.hostname}. ${t.successSuffix}`);
      window.setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch {
      setValid(false);
      setMessage(t.invalid);
    }
  }

  return (
    <form className="wd-url-check" id="check-url" onSubmit={submit} noValidate>
      <label htmlFor={inputId}>{t.label}</label>
      <div>
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={t.placeholder}
          value={value}
          aria-invalid={valid === false ? "true" : undefined}
          aria-describedby={`${inputId}-status`}
          onChange={(event) => {
            setValue(event.target.value);
            if (message) {
              setMessage("");
              setValid(null);
            }
          }}
        />
        <button type="submit">{t.button}</button>
      </div>
      <p id={`${inputId}-status`} aria-live="polite" data-state={valid === null ? "idle" : valid ? "success" : "error"}>
        {message}
      </p>
    </form>
  );
}
