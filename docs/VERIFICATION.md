# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A10.3 third standalone tool — sitemap.xml validator. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, A10.1 HTTP status / redirect chain tool, A10.2 robots.txt tester, and this A10.3 standalone tool patch.

A10.3 changes:

- added backend endpoint `POST /v1/tools/sitemap`;
- reused the existing sitemap parser and SSRF-safe `SafeHttpFetcher`;
- accepts either a direct sitemap XML URL or a site/page URL and falls back to `/sitemap.xml` for that origin;
- optionally checks whether a target URL is listed in the sitemap `loc` entries;
- reports sitemap availability, HTTP status, XML validity, sitemap kind (`urlset`, `sitemapindex`, `unknown`), URL count, child sitemap count, sample loc entries, and recommendation;
- returns normalized tool errors for URL policy failures;
- exposes `sitemap-validator` as a public server-backed tool in both TS and Python registries;
- added Next proxy endpoint `POST /api/tools/sitemap` with runtime response validation;
- added working `/tools/sitemap-validator` and `/en/tools/sitemap-validator` renderer;
- added RU/EN editorial content for the sitemap validator;
- added backend, proxy, renderer helper, registry, and content regression coverage;
- did not add recursive sitemap-index crawling, persistence, user accounts, queueing, scheduled monitoring, or billing.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run test:workspace` | PASS — 32/32 |
| `npm test` | PASS — 120/120 total tests |
| `npm run verify:registry` | PASS — 110 unique tools, 17 ready public tools |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run verify:built-site` | PASS — 40 public routes / 38 localized HTML routes |
| `npm run test:python` | PASS — 91/91 |
| `npm run lint:python` | PASS |
| `npm run verify:python-lock` | PASS — 30 locked packages matched installed packages for linux |
| `npm run test:browser` | NOT VERIFIED in this sandbox |

## Browser gate note

The browser gate is not claimed as passed in this environment. Previous runs in this sandbox started Chromium and the local test server but blocked navigation to `http://127.0.0.1:4173/` with `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

## Known limitations after A10.3

- The sitemap validator checks one sitemap per run; it does not recursively expand all child sitemaps from a sitemap index.
- The tool does not crawl the site to prove that every canonical URL is included.
- Sitemap results are not persisted to a user project or history table.
- The backend still has no crawler queue, database, auth, dashboard, billing, or scheduled monitoring.
- Additional standalone tools should follow this pattern one by one: canonical checker, security headers checker, JSON-LD validator.
