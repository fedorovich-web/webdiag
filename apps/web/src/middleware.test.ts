import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, isAppSubdomainHost, isMainDomainHost } from "./middleware";

function createReq(urlStr: string, host: string) {
  const url = new URL(urlStr);
  return new NextRequest(url, {
    headers: {
      host,
      "x-forwarded-host": host,
    },
  });
}

describe("Domain Routing Middleware", () => {
  describe("Host matchers", () => {
    it("identifies app.webdiag.ru as app subdomain", () => {
      expect(isAppSubdomainHost("app.webdiag.ru")).toBe(true);
      expect(isAppSubdomainHost("app.webdiag.ru:3000")).toBe(true);
      expect(isAppSubdomainHost("webdiag.ru")).toBe(false);
      expect(isAppSubdomainHost("localhost:3000")).toBe(false);
    });

    it("identifies webdiag.ru and www.webdiag.ru as main domain", () => {
      expect(isMainDomainHost("webdiag.ru")).toBe(true);
      expect(isMainDomainHost("www.webdiag.ru")).toBe(true);
      expect(isMainDomainHost("webdiag.ru:3000")).toBe(true);
      expect(isMainDomainHost("app.webdiag.ru")).toBe(false);
      expect(isMainDomainHost("localhost:3000")).toBe(false);
    });
  });

  describe("On app.webdiag.ru (App Subdomain)", () => {
    const host = "app.webdiag.ru";

    it("redirects root '/' to '/account'", () => {
      const req = createReq("https://app.webdiag.ru/", host);
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("https://app.webdiag.ru/account");
    });

    it("redirects root '/en' to '/en/account'", () => {
      const req = createReq("https://app.webdiag.ru/en", host);
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("https://app.webdiag.ru/en/account");
    });

    it("allows '/account' and subpaths", () => {
      const req = createReq("https://app.webdiag.ru/account/projects", host);
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows '/login' and '/register'", () => {
      const reqLogin = createReq("https://app.webdiag.ru/login", host);
      expect(middleware(reqLogin).status).toBe(200);

      const reqRegister = createReq("https://app.webdiag.ru/register", host);
      expect(middleware(reqRegister).status).toBe(200);
    });

    it("allows '/api' requests", () => {
      const req = createReq("https://app.webdiag.ru/api/account/me", host);
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("redirects public marketing pages to webdiag.ru", () => {
      const pages = ["/about", "/pricing", "/audit", "/knowledge", "/contacts", "/tools", "/en/pricing"];
      for (const path of pages) {
        const req = createReq(`https://app.webdiag.ru${path}`, host);
        const res = middleware(req);
        expect(res.status).toBe(308);
        expect(res.headers.get("location")).toBe(`https://webdiag.ru${path}`);
      }
    });
  });

  describe("On webdiag.ru (Main Domain)", () => {
    const host = "webdiag.ru";

    it("allows public marketing pages directly", () => {
      const pages = ["/", "/en", "/about", "/pricing", "/audit", "/knowledge", "/contacts", "/tools"];
      for (const path of pages) {
        const req = createReq(`https://webdiag.ru${path}`, host);
        const res = middleware(req);
        expect(res.status).toBe(200);
      }
    });

    it("redirects '/account' and subpaths to app.webdiag.ru", () => {
      const req = createReq("https://webdiag.ru/account", host);
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("https://app.webdiag.ru/account");
    });

    it("redirects '/login' and '/register' to app.webdiag.ru", () => {
      const reqLogin = createReq("https://webdiag.ru/login", host);
      const resLogin = middleware(reqLogin);
      expect(resLogin.status).toBe(307);
      expect(resLogin.headers.get("location")).toBe("https://app.webdiag.ru/login");

      const reqRegister = createReq("https://webdiag.ru/register", host);
      const resRegister = middleware(reqRegister);
      expect(resRegister.status).toBe(307);
      expect(resRegister.headers.get("location")).toBe("https://app.webdiag.ru/register");
    });
  });

  describe("In Local Development / Other Hosts", () => {
    it("allows all paths without redirection on localhost", () => {
      const reqHome = createReq("http://localhost:3000/", "localhost:3000");
      expect(middleware(reqHome).status).toBe(200);

      const reqAccount = createReq("http://localhost:3000/account", "localhost:3000");
      expect(middleware(reqAccount).status).toBe(200);

      const reqLogin = createReq("http://localhost:3000/login", "localhost:3000");
      expect(middleware(reqLogin).status).toBe(200);
    });
  });
});
