import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HEADERS } from "./features/admin/admin-routing";

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
  if (request.headers.has("next-action")) {
    return new NextResponse("Server action not found.", {
      status: 404,
      headers: {
        "x-action-not-found": "1",
        "content-type": "text/plain",
      },
    });
  }

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const hostname = (host.split(":")[0] ?? "").toLowerCase().trim();
  const { pathname, search } = request.nextUrl;

  const ownerPage = /^\/(?:en\/)?admin(?:\/|$)/u.test(pathname);
  const ownerApi = /^\/api\/admin(?:\/|$)/u.test(pathname);
  if (ownerPage || ownerApi) {
    const local = /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/iu.test(host) || /^\[::1\](?::\d+)?$/u.test(host);
    if (hostname === APP_SUBDOMAIN || local) {
      const response = NextResponse.next();
      for (const [name, value] of Object.entries(ADMIN_HEADERS)) response.headers.set(name, value);
      return response;
    }
    if (ownerPage && isMainDomainHost(hostname)) {
      return NextResponse.redirect(`https://${APP_SUBDOMAIN}${pathname}${search}`, {
        status: 307, headers: ADMIN_HEADERS,
      });
    }
    return new NextResponse(null, { status: 404, headers: ADMIN_HEADERS });
  }

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

  if (isAppSubdomainHost(hostname)) {
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
      pathname === "/tools" ||
      pathname.startsWith("/tools/") ||
      pathname === "/en/tools" ||
      pathname.startsWith("/en/tools/") ||
      pathname.startsWith("/reports/share");

    if (isAppPath) {
      return NextResponse.next();
    }

    const mainUrl = new URL(`https://${MAIN_DOMAIN}${pathname}${search}`);
    return NextResponse.redirect(mainUrl, 308);
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
