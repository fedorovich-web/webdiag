import type { Metadata } from "next";
import "../globals.css";
import { SiteFooter } from "../../src/components/site-footer";
import { SiteHeader } from "../../src/components/site-header";
import { ThemeBootstrapScript } from "../../src/components/theme-bootstrap-script";
import { publicReleaseEnabled } from "../../src/lib/release";

export const metadata: Metadata = {
  metadataBase: new URL("https://webdiag.ru"),
  title: { default: "WebDiag — технический аудит сайта", template: "%s — WebDiag" },
  description: "Технический аудит сайта: индексация, мета-теги, редиректы, скорость, безопасность, доступность и приоритеты исправлений.",
  robots: publicReleaseEnabled ? { index: true, follow: true } : { index: false, follow: false },
  applicationName: "WebDiag",
  category: "technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" data-scroll-behavior="smooth"><head><link rel="preload" href="/fonts/manrope-ru-en-400-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head><body data-theme="light" data-theme-ready="false" suppressHydrationWarning><ThemeBootstrapScript /><a className="skip-link" href="#main-content">Перейти к содержимому</a><SiteHeader locale="ru" /><div id="main-content">{children}</div><SiteFooter locale="ru" /></body></html>;
}
