import type { Metadata } from "next";
import "../globals.css";
import "../account.css";
import { SiteFooter } from "../../src/components/site-footer";
import { SiteHeader } from "../../src/components/site-header";
import { ThemeBootstrapScript } from "../../src/components/theme-bootstrap-script";
import { publicReleaseEnabled } from "../../src/lib/release";

export const metadata: Metadata = {
  metadataBase: new URL("https://webdiag.ru"),
  title: { default: "WebDiag — technical website audit", template: "%s — WebDiag" },
  description: "Technical website audit: indexing, metadata, redirects, speed, security, accessibility, and prioritized fixes.",
  robots: publicReleaseEnabled ? { index: true, follow: true } : { index: false, follow: false },
  applicationName: "WebDiag",
  category: "technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preload" href="/fonts/manrope-ru-en-400-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="WebDiag" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body data-theme="light" data-theme-ready="false" suppressHydrationWarning>
        <ThemeBootstrapScript />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader locale="en" />
        <div id="main-content">{children}</div>
        <SiteFooter locale="en" />
      </body>
    </html>
  );
}
