# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A10.4 fourth standalone tool — canonical checker. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, A10.1 HTTP status / redirect chain tool, A10.2 robots.txt tester, A10.3 sitemap validator, and this A10.4 standalone tool patch.

A10.4 changes:

- added backend endpoint `POST /v1/tools/canonical`;
- reused SSRF-safe `SafeHttpFetcher` and existing HTML metadata parser;
- extracts the first `link rel="canonical"` from the fetched HTML document;
- resolves relative canonical href values against the final URL after redirects;
- compares resolved canonical with the final URL using normalized scheme, host, default-port, trailing-slash and fragment handling;
- reports canonical presence, absolute/relative href, final URL match, host match, `noindex`, redirect count, status code, content type and recommendation;
- returns normalized tool errors for URL policy and fetch failures;
- exposes `canonical-checker` as a public server-backed tool in both TS and Python registries;
- added Next proxy endpoint `POST /api/tools/canonical` with runtime response validation;
- added working `/tools/canonical-checker` and `/en/tools/canonical-checker` renderer;
- added RU/EN editorial content for the canonical checker;
- added backend, proxy, renderer helper, registry, and content regression coverage;
- did not add crawler-wide canonical conflict discovery, persistence, user accounts, queueing, scheduled monitoring, or billing.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run test:workspace` | PASS — 32/32 |
| `npm test` | PASS — 128/128 total tests |
| `npm run verify:registry` | PASS — 110 unique tools, 18 ready public tools |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run verify:built-site` | PASS — 42 public routes / 40 localized HTML routes |
| `npm run test:python` | PASS — 95/95 |
| `npm run lint:python` | PASS |
| `npm run verify:python-lock` | PASS — 30 locked packages matched installed packages for linux |
| `npm run test:browser` | NOT VERIFIED in this sandbox |

## Browser gate note

The browser gate is not claimed as passed in this environment. Previous runs in this sandbox started Chromium and the local test server but blocked navigation to `http://127.0.0.1:4173/` with `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

## Known limitations after A10.4

- The canonical checker checks one page per run; it does not crawl the site to find duplicate canonical targets or conflicting canonical clusters.
- JavaScript-rendered canonical tags that appear only after client-side hydration are not executed in this MVP.
- Results are not persisted to a user project or history table.
- The backend still has no crawler queue, database, auth, dashboard, billing, or scheduled monitoring.
- Additional standalone tools should follow this pattern one by one: security headers checker, JSON-LD validator, meta tags checker.
