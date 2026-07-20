# Verification — WebDiag

Date: 2026-07-20
Package version: `0.5.11`
Patch scope: A0 gate hygiene + A1 backend audit-engine foundation. No commit or push performed in this handoff.

## Scope

- removed obsolete prototype-era `audit-v*` CSS layers from `apps/web/app/globals.css` without changing the current `home-v11.css` page architecture;
- replaced the rejected direct pricing label size with the existing `--wd-text-sm` token;
- normalized remaining high direct `font-weight` values in `globals.css` to the approved shipped Manrope range;
- added immutable audit-domain Pydantic models for targets, jobs, runs, checks, issues, affected URLs, evidence, recommendations and tool mappings;
- added deterministic URL intake that reuses the existing URL policy and SSRF resolved-address guard;
- added explicit issue-category to ready-tool binding state without exposing internal SEO-audit tools as public routes;
- added Python unit tests for audit models, URL intake and registry mappings;
- refreshed source `BUILD-MANIFEST.json` and root `SHA256SUMS.txt` for the patched source tree.

No crawler, external HTTP fetcher, persistence layer, frontend report UI, scheduler, DB integration, commit or push is included.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline` | passed, 401 packages installed |
| `npm run test:workspace` | passed, 26/26 |
| `npm test` | passed, 74/74 JavaScript/TypeScript tests |
| `npm run verify:registry` | passed, 110 unique tools |
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
| `npm run verify:built-site` | passed, 34 public routes / 32 HTML routes |
| `npm run python:where` | passed, project `.venv` interpreter used |
| `npm run python:install` | passed |
| `npm run test:python` | passed, 26/26 |
| `npm run lint:python` | passed |
| `npm run test:browser` | not passed in this sandbox; Playwright Chromium executable is missing |

## Browser boundary

`npm run test:browser` was executed but did not verify browser behavior in this sandbox because Playwright could not find Chromium at:

```text
/home/oai/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell
```

The resulting 37 browser failures are environment failures caused by the missing executable. They are not claimed as visual, responsive, accessibility or hydration regressions. Run locally after installing the Playwright browser or configuring `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Registry boundary

The registry remains 110 total definitions and 14 ready public tools. A1 adds backend-side mappings only where a ready helper tool already exists. SEO-audit categories whose dedicated tools are still internal are represented as explicit non-public bindings, so no public route is promised for unimplemented audit capabilities.

## Backend boundary

A1 establishes the domain contract and unit-tested intake/mapping layer. It does not perform network crawling or live site diagnostics yet. The next safe backend step is a separate fetcher/parser patch for timeouts, redirects, response-size limits, HTTP status, title, meta description, canonical, H1, robots meta, robots.txt and sitemap discovery.
