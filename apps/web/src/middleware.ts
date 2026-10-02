import { NextResponse, type NextRequest } from "next/server";

const MAIN_DOMAIN = "webdiag.ru";
const APP_SUBDOMAIN = "app.webdiag.ru";

export function isAppSubdomainHost(hostname: string): boolean {
  const normalized = (hostname.split(":")[0] ?? "").toLowerCase().trim();
  if (normalized === APP_SUBDOMAIN) return true;
  if (normalized.startsWith("app.") && normalized.endsWith(MAIN_DOMAIN)) return true;
  return false;
}

export function isMainDomainHost(hostname: string): boolean {
  const normalized = (hostname.split(":")[0] ?? "").toLowerCase().trim();
  if (normalized === MAIN_DOMAIN || normalized === `www.${MAIN_DOMAIN}`) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const hostname = (host.split(":")[0] ?? "").toLowerCase().trim();
  const { pathname, search } = request.nextUrl;

  // Never intercept static assets, next internal files, or file extensions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:avif|webp|png|jpg|jpeg|svg|ico|css|js|map|txt|xml|json|woff2?|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // --- APP SUBDOMAIN (app.webdiag.ru) ---
  // Only the personal cabinet (/account), auth (/login, /register), and shared reports
  if (isAppSubdomainHost(hostname)) {
    // 1. Root of app subdomain immediately opens the account workspace
    if (pathname === "/" || pathname === "") {
      const target = request.nextUrl.clone();
      target.pathname = "/account";
      return NextResponse.redirect(target, 307);
    }
    if (pathname === "/en" || pathname === "/en/") {
      const target = request.nextUrl.clone();
      target.pathname = "/en/account";
      return NextResponse.redirect(target, 307);
    }

    // 2. Allowed app routes
    const isAppPath =
      pathname === "/account" ||
      pathname.startsWith("/account/") ||
      pathname === "/en/account" ||
      pathname.startsWith("/en/account/") ||
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      pathname === "/en/login" ||
      pathname.startsWith("/en/login/") ||
      pathname === "/register" ||
      pathname.startsWith("/register/") ||
      pathname === "/en/register" ||
      pathname.startsWith("/en/register/") ||
      pathname.startsWith("/reports/share");

    if (isAppPath) {
      return NextResponse.next();
    }

    // 3. Any public marketing page (about, audit, pricing, knowledge, contacts, tools, etc.)
    // is NOT part of the app workspace — redirect to the main domain
    const mainUrl = new URL(`https://${MAIN_DOMAIN}${pathname}${search}`);
    return NextResponse.redirect(mainUrl, 308);
  }

  // --- MAIN DOMAIN (webdiag.ru / www.webdiag.ru) ---
  // Public website only. Account workspace and auth pages redirect to app.webdiag.ru
  if (isMainDomainHost(hostname)) {
    const isAccountOrAuthPath =
      pathname === "/account" ||
      pathname.startsWith("/account/") ||
      pathname === "/en/account" ||
      pathname.startsWith("/en/account/") ||
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      pathname === "/en/login" ||
      pathname.startsWith("/en/login/") ||
      pathname === "/register" ||
      pathname.startsWith("/register/") ||
      pathname === "/en/register" ||
      pathname.startsWith("/en/register/");

    if (isAccountOrAuthPath) {
      const appUrl = new URL(`https://${APP_SUBDOMAIN}${pathname}${search}`);
      return NextResponse.redirect(appUrl, 307);
    }

    return NextResponse.next();
  }

  // In development, localhost, or preview environments without domain routing
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
