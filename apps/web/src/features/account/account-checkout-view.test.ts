import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountCheckoutView } from "./account-checkout-view";

it("does not offer fake payments or collect card credentials", () => {
  const html = renderToStaticMarkup(createElement(AccountCheckoutView, { locale: "ru" }));
  expect(html).not.toContain("Тестовый платёж");
  expect(html).not.toContain("4276 3800");
  expect(html).not.toContain("CVC");
  expect(html).not.toContain("Dokploy");
});
