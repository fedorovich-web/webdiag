const DEFAULT_DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = "webdiag_session";

export class AccountProxyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountProxyConfigurationError";
  }
}

type AccountProxyEnvironment = Readonly<Record<string, string | undefined>>;

export function resolveAccountApiBaseUrl(
  environment: AccountProxyEnvironment = process.env,
): string {
  const production = environment.NODE_ENV === "production";
  const configured = environment.WEBDIAG_API_INTERNAL_URL?.trim();
  if (!configured && production) {
    throw new AccountProxyConfigurationError("WEBDIAG_API_INTERNAL_URL is required in production.");
  }
  const raw = configured || DEFAULT_DEVELOPMENT_API_BASE_URL;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new AccountProxyConfigurationError("WEBDIAG_API_INTERNAL_URL must be an absolute URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AccountProxyConfigurationError("WEBDIAG_API_INTERNAL_URL must use HTTP or HTTPS.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new AccountProxyConfigurationError("WEBDIAG_API_INTERNAL_URL must contain only an origin.");
  }
  return parsed.origin;
}

export function selectAccountSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const rawPart of cookieHeader.split(";")) {
    const part = rawPart.trim();
    const separator = part.indexOf("=");
    if (separator < 1 || part.slice(0, separator) !== SESSION_COOKIE_NAME) continue;
    const value = part.slice(separator + 1);
    if (!value || value.length > 512 || /[\u0000-\u001F\u007F]/u.test(value)) return null;
    return `${SESSION_COOKIE_NAME}=${value}`;
  }
  return null;
}

export function resolveRequestSessionCookie(request: {
  readonly cookies?: { get(name: string): { value: string } | undefined };
  readonly headers: { get(name: string): string | null };
}): string | null {
  const fromCookieStore = request.cookies?.get?.(SESSION_COOKIE_NAME)?.value;
  if (fromCookieStore && fromCookieStore.length <= 512 && !/[\u0000-\u001F\u007F]/u.test(fromCookieStore)) {
    return `${SESSION_COOKIE_NAME}=${fromCookieStore}`;
  }
  return selectAccountSessionCookie(request.headers.get("cookie"));
}

export function selectAccountSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  return setCookie.startsWith(`${SESSION_COOKIE_NAME}=`) ? setCookie : null;
}

export function formatAccountSetCookie(setCookie: string | null, isHttps: boolean): string | null {
  const sessionCookie = selectAccountSetCookie(setCookie);
  if (!sessionCookie) return null;
  if (!isHttps) {
    return sessionCookie.replace(/;\s*Secure\b/gi, "");
  }
  if (!/;\s*Secure\b/i.test(sessionCookie)) {
    return `${sessionCookie}; Secure`;
  }
  return sessionCookie;
}

export function selectAccountRetryAfter(status: number, retryAfter: string | null): string | null {
  if (status !== 429 || !retryAfter || !/^\d{1,10}$/u.test(retryAfter)) return null;
  return retryAfter;
}
