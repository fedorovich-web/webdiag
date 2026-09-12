import type { Metadata } from "next";

import "../globals.css";
import { ThemeBootstrapScript } from "../../src/components/theme-bootstrap-script";

export const metadata: Metadata = {
  metadataBase: new URL("https://webdiag.ru"),
  title: { default: "WebDiag account", template: "%s — WebDiag" },
  robots: { index: false, follow: false },
};

export default function AuthEnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/manrope-ru-en-400-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body data-theme="light" data-theme-ready="false" suppressHydrationWarning>
        <ThemeBootstrapScript />
        {children}
      </body>
    </html>
  );
}
