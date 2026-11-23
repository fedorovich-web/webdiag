export function accountReturnPath(value: string | null | undefined, locale: "ru" | "en" = "ru"): string {
  const fallback = locale === "en" ? "/en/account" : "/account";
  if (!value || value.length > 1024 || /[\\\u0000-\u0020\u007f]/u.test(value) || !value.startsWith("/") || value.startsWith("//")) return fallback;
  const url = new URL(value, "https://app.webdiag.ru");
  if (url.pathname === "/admin" || url.pathname === "/en/admin") return url.pathname;
  if (!/^\/(?:en\/)?account(?:\/|$)/u.test(url.pathname)) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
