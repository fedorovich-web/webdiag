export const themes = ["light", "dark"] as const;
export type ThemePreference = (typeof themes)[number];
export const themeStorageKey = "webdiag-theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && themes.includes(value as ThemePreference);
}

export function normalizeTheme(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : "light";
}
