import type { Locale } from "@webdiag/tool-registry";

export interface BillingPackage {
  title: string;
  credits: number;
  amount: number;
  currency: "RUB" | "USD";
  desc: string;
}

export function billingSku(id: string, locale: Locale): string {
  const canonical = id.replace(/^credit-/, "");
  return locale === "en" && !canonical.endsWith("-usd") ? `${canonical}-usd` : canonical;
}

export function planSku(plan: string, annual: boolean, locale: Locale): string {
  return billingSku(`plan-${plan}${annual ? "-annual" : ""}`, locale);
}

const prices: Record<string, readonly [number, number, number]> = {
  "pack-50": [390, 5, 50],
  "pack-150": [890, 12, 150],
  "pack-500": [1990, 28, 500],
  "plan-pro": [990, 14, 150],
  "plan-team": [2990, 42, 500],
  "plan-pro-annual": [790 * 12, 11 * 12, 150 * 12],
  "plan-team-annual": [2390 * 12, 34 * 12, 500 * 12],
};

export function checkoutPackage(id: string, locale: Locale): BillingPackage | undefined {
  const canonical = id.replace(/^credit-/, "").replace(/-usd$/, "");
  const product = prices[canonical];
  if (!product) return undefined;
  const ru = locale === "ru";
  const usd = id.endsWith("-usd");
  const plan = canonical.startsWith("plan-");
  const annual = canonical.endsWith("-annual");
  const name = canonical.includes("team") ? "Team" : "Pro";
  return {
    title: plan ? `${ru ? "Тариф" : "Plan"} ${name}${annual ? (ru ? " — год" : " — annual") : ""}` : `${product[2]} AI-${ru ? "кредитов" : "credits"} WebDiag`,
    credits: product[2],
    amount: product[usd ? 1 : 0],
    currency: usd ? "USD" : "RUB",
    desc: plan
      ? ru ? `Оплата за ${annual ? "год" : "30 дней"}. Без автоматического продления.` : `Payment for ${annual ? "one year" : "30 days"}. No automatic renewal.`
      : ru ? "Бессрочный баланс AI-кредитов." : "AI credits never expire.",
  };
}

export function packagePrice(pack: BillingPackage, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency", currency: pack.currency, maximumFractionDigits: 0,
  }).format(pack.amount);
}
