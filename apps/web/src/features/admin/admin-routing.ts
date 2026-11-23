
export const ADMIN_HEADERS = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
} as const;

export function adminPath(locale: "ru" | "en") {
  return locale === "ru" ? "/admin" : "/en/admin";
}

export function adminLoginPath(locale: "ru" | "en") {
  return (locale === "ru" ? "/login" : "/en/login") + "?return_to=" + encodeURIComponent(adminPath(locale));
}
