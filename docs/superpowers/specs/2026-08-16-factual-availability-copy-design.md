# Factual availability copy design

Date: 2026-08-16

## Problem

The public RU/EN home and pricing pages publish unapproved ruble amounts and
say that audits, monitoring, and AI helpers are paid per run. WebDiag has no
payment integration, no approved tariff, and no ready AI catalog entry. Calling
the amounts preliminary does not make them factual.

This contradicts the product rules: public copy may describe only observable
behavior, payment remains deferred, and internal AI state must not become a
public capability claim.

## Product truth

- Public deterministic tools currently have no payment gate.
- Account registration, projects, saved audits, monitoring, and reports have no
  payment gate.
- The authenticated AI catalog has fifteen internal definitions and exposes no
  available tool.
- Checkout, invoices, subscriptions, Lava.top, and approved prices do not
  exist.
- No activation date or future price is known.

## Approaches considered

1. Remove pricing routes and navigation. This removes the false claims but
   breaks established routes, sitemap entries, and external links.
2. Keep the routes and replace pricing with current availability. This
   preserves navigation while explaining what can and cannot be used now.
3. Keep preliminary numbers with a stronger disclaimer. Rejected: unapproved
   numbers remain invented claims.

Approach 2 is selected.

## Home surface

Keep the existing section position, responsive grid, tokens, icons, and action
hierarchy. Replace price-specific data with four availability cards:

1. public tools — available without payment, action opens the tool catalog;
2. account workspace — available after sign-in, action opens registration;
3. AI functions — unavailable until quality, cost, security, and storage gates
   pass; no action that implies activation;
4. payments and plans — not connected; no charge can occur and no price is
   published.

The section heading becomes “Что доступно сейчас” / “What is available now”.
Cards use a short status label, factual description, bounded bullet list, and
only actions that lead to a working route. No currency amount, paid-run claim,
subscription, checkout, provider name, or activation date appears.

## Pricing routes

Keep `/pricing` and `/en/pricing` for compatibility, but title and metadata
describe feature availability rather than prices. Use the same four factual
states as the home section. The primary action opens tools; the secondary
action opens registration. The note states that WebDiag does not currently
publish prices or charge through the product.

Navigation labels remain “Цены” / “Pricing” because the stable route answers
the pricing question directly: no plans are published and no payment is
connected. Renaming global navigation would expand this patch without
improving factual accuracy.

## Release regression

A workspace test reads both pricing pages and the home source. It rejects the
known fabricated amounts, ruble price markup, paid-run/subscription claims, and
the previous preliminary-price disclaimer. It requires the RU/EN availability
headings and explicit no-payment/no-price statements. This is a source-level
release guard in addition to browser rendering tests.

## Verification

Run the focused workspace test, affected web tests, TypeScript, production
build, and the home/pricing browser paths at desktop and 390-pixel mobile. Run
the Impeccable detector once over changed UI targets. Do not update visual
snapshots to hide a regression.
