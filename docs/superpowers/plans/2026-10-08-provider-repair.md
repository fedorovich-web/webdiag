# WebDiag provider repair

Goal: repair Yandex login, paid purchases, six public AI tools and existing tool regressions without redesign.

User constraint: retain all existing plan names, content and prices, including annual billing. Annual Pro/Team are charged at the existing displayed monthly-equivalent price times twelve. Keep the existing RUB and USD price lists; preserve the selected period and locale through registration, OAuth and checkout.

Baseline: Git main b00dba0f0b28217e335e7f9ac62b1e53c15cf96a, also deployed in Dokploy. Work from an extracted source copy; preserve all existing dirty checkouts. No push or deployment is included until the tested change is reviewable.

1. Yandex: use one backend code exchange; PKCE, bounded provider calls, trusted callback origins, opaque state and return destination. Store provider subject identity; require email ownership before the first binding to an existing account; invalidate all prior sessions and unverified password credentials during email recovery. Remove claimed-email login. Preserve existing auth layout and isolate the original circular icon from global SVG strokes.
2. Billing: persist invoice ownership/product/amount; eliminate fake checkout and browser-authorized grants. Verify provider status or authenticated webhook, then atomically settle credits and plan once. Unknown invoices, mismatched amounts, wrong owners and provider failure cannot grant credits. Preserve checkout styling; payment details are entered only at Lava.
3. AI: wire runtime and provider settings into API and scheduler; use the existing Vercel provider without heuristic success/fallback. Keep durable reservations, ownership, bounded work and validation. Expose only runnable tools and show complete results.
4. Tools: run registry/core/web/API/worker suites and fix reproduced regressions. Check the current main against unmerged fixes rather than merging old branches wholesale.
5. Verify: final unit/integration suites, lint, types, production build, browser regressions and Compose checks. Record local results separately from deployed/provider certification. Prepare a patch against the exact baseline and operational instructions.

Review inputs: existing email / changed provider email; parallel/replayed invoice callbacks; failed/ambiguous provider response; delayed worker and lost lease; return URL and cross-origin writes. Add focused failing regressions before each behavioral repair.
