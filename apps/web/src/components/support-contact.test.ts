import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const supportEmail = "support@webdiag.ru";

function read(relativeUrl: string): string {
  return readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
}

describe("WebDiag support contact contract", () => {
  it("shows the support mailbox as a clickable footer link", () => {
    const footer = read("./site-footer.tsx");

    expect(footer).toContain(`mailto:${supportEmail}`);
    expect(footer).toContain(supportEmail);
    expect(footer).not.toContain("info@webdiag.ru");
  });

  it("publishes RU and EN contacts pages with the clickable support mailbox", () => {
    const ruUrl = new URL("../../app/(ru)/contacts/page.tsx", import.meta.url);
    const enUrl = new URL("../../app/(en)/en/contacts/page.tsx", import.meta.url);

    expect(existsSync(ruUrl)).toBe(true);
    expect(existsSync(enUrl)).toBe(true);

    const ru = readFileSync(ruUrl, "utf8");
    const en = readFileSync(enUrl, "utf8");
    for (const page of [ru, en]) {
      expect(page).toContain(`mailto:${supportEmail}`);
      expect(page).toContain(supportEmail);
      expect(page).not.toContain("info@webdiag.ru");
    }
  });

  it("includes both contacts routes in the public sitemap", () => {
    const sitemap = read("../../app/sitemap.ts");

    expect(sitemap).toContain('["/contacts", "/en/contacts"');
  });
});
