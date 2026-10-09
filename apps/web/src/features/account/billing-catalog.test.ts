import { expect, it } from "vitest";
import { billingSku, checkoutPackage, planSku } from "./billing-catalog";

it("keeps existing monthly, annual and pack prices in the selected currency", () => {
  expect(checkoutPackage(planSku("pro", true, "ru"), "ru")).toMatchObject({ amount: 9480, currency: "RUB", credits: 1800 });
  expect(checkoutPackage(planSku("team", true, "ru"), "ru")).toMatchObject({ amount: 28680, currency: "RUB" });
  expect(checkoutPackage(planSku("pro", false, "ru"), "ru")).toMatchObject({ amount: 990, currency: "RUB" });
  expect(checkoutPackage(planSku("team", true, "en"), "en")).toMatchObject({ amount: 408, currency: "USD" });
  expect(checkoutPackage(billingSku("credit-pack-150", "en"), "en")).toMatchObject({ amount: 12, credits: 150 });
  expect(billingSku("plan-pro-annual-usd", "en")).toBe("plan-pro-annual-usd");
  expect(checkoutPackage("unknown", "ru")).toBeUndefined();
});
