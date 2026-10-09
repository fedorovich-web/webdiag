from dataclasses import dataclass


@dataclass(frozen=True)
class BillingProduct:
    amount_minor: int
    currency: str
    credits: int
    plan_id: str | None = None
    duration_days: int = 0


# The existing RU/EN pricing page is the commercial source for these prices.
PRODUCTS = {
    "pack-50": BillingProduct(39000, "RUB", 50),
    "pack-150": BillingProduct(89000, "RUB", 150),
    "pack-500": BillingProduct(199000, "RUB", 500),
    "plan-pro": BillingProduct(99000, "RUB", 150, "pro", 30),
    "plan-team": BillingProduct(299000, "RUB", 500, "team", 30),
    "plan-pro-annual": BillingProduct(790 * 12 * 100, "RUB", 150 * 12, "pro", 365),
    "plan-team-annual": BillingProduct(2390 * 12 * 100, "RUB", 500 * 12, "team", 365),
    "pack-50-usd": BillingProduct(500, "USD", 50),
    "pack-150-usd": BillingProduct(1200, "USD", 150),
    "pack-500-usd": BillingProduct(2800, "USD", 500),
    "plan-pro-usd": BillingProduct(1400, "USD", 150, "pro", 30),
    "plan-team-usd": BillingProduct(4200, "USD", 500, "team", 30),
    "plan-pro-annual-usd": BillingProduct(11 * 12 * 100, "USD", 150 * 12, "pro", 365),
    "plan-team-annual-usd": BillingProduct(34 * 12 * 100, "USD", 500 * 12, "team", 365),
}


def billing_product(pack_id: str) -> BillingProduct | None:
    return PRODUCTS.get(pack_id.removeprefix("credit-"))
