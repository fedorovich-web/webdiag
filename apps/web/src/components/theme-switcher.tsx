"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { normalizeTheme, themeStorageKey, type ThemePreference } from "../lib/theme";

const themeEvent = "webdiag-theme-change";

function applyTheme(theme: ThemePreference) {
  document.body.dataset.theme = theme;
}

function migrateStoredTheme(value: string | null): ThemePreference {
  const theme = normalizeTheme(value);
  if (value !== null && value !== theme) {
    try { window.localStorage.setItem(themeStorageKey, theme); } catch { /* The DOM theme still applies. */ }
  }
  return theme;
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== themeStorageKey) return;
    applyTheme(migrateStoredTheme(event.newValue));
    callback();
  };
  const onThemeChange = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(themeEvent, onThemeChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(themeEvent, onThemeChange);
  };
}

function getSnapshot(): ThemePreference {
  return normalizeTheme(document.body.dataset.theme);
}

function getServerSnapshot(): ThemePreference {
  return "light";
}

export function ThemeSwitcher({ locale }: { locale: Locale }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => { document.body.dataset.themeReady = "true"; }, []);
  const isDark = theme === "dark";
  const labels = locale === "ru"
    ? { title: "Тёмная тема", next: isDark ? "Включить светлую тему" : "Включить тёмную тему" }
    : { title: "Dark theme", next: isDark ? "Switch to light theme" : "Switch to dark theme" };

  function update(next: ThemePreference) {
    applyTheme(next);
    try { window.localStorage.setItem(themeStorageKey, next); } catch { /* The theme still applies for this page. */ }
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      className="theme-switch"
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={labels.title}
      title={labels.next}
      onClick={() => update(isDark ? "light" : "dark")}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <svg className="theme-switch-sun" viewBox="0 0 24 24"><path d="M12 2.75v2.5m0 13.5v2.5M21.25 12h-2.5M5.25 12h-2.5m15.79-6.54-1.77 1.77M7.23 16.77l-1.77 1.77m13.08 0-1.77-1.77M7.23 7.23 5.46 5.46"/><circle cx="12" cy="12" r="4.25"/></svg>
        <svg className="theme-switch-moon" viewBox="0 0 24 24"><path d="M20.25 15.2A8.75 8.75 0 0 1 8.8 3.75 8.75 8.75 0 1 0 20.25 15.2Z"/></svg>
        <span className="theme-switch-thumb" />
      </span>
      <span className="sr-only">{labels.next}</span>
    </button>
  );
}
