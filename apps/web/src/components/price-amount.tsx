import type { Locale } from "@webdiag/tool-registry";

interface PriceAmountProps {
  readonly amount: number;
  readonly currency: "RUB" | "USD";
  readonly locale: Locale;
  readonly className?: string;
}

export function PriceAmount({ amount, currency, locale, className }: PriceAmountProps) {
  const parts = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).formatToParts(amount);

  return (
    <span className={className}>
      {parts.map((part, index) => part.type === "currency"
        ? <span className="wd-price-currency" key={index}>{part.value}</span>
        : part.value)}
    </span>
  );
}
