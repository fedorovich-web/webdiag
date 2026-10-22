import "../globals.css";
import "../account.css";

export default function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
