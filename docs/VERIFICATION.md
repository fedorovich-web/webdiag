# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A8.1 UI correction + Python lock verifier compatibility hotfix. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1 backend safety, A7.2 resource correctness, A7.3 timing-contract changes, A7.4 Python lock reproducibility, A7.5 frontend audit API contract hardening, A8 compact live audit result UI extraction, and this A8.1 correction.

A8.1 UI changes:

- tool category cards now use the requested vertical composition: icon at the top-left, then left-aligned title, description, and CTA link;
- the report sidebar site card now aligns labels and values in a stable two-column row instead of visually broken stacked text;
- the report tabs are no longer nearly empty outside Summary;
- every non-summary tab now contains useful demo report information for clients, SEO, marketing, and implementation planning: signals, actions, example URLs, and usage notes;
- tab content is explicitly tied to the demo report and existing product positioning, not to unimplemented crawler/persistence claims;
- no Header, Footer, pricing, backend API, crawler, database, queue, registry, or production monitoring scope is changed.

Python lock verifier compatibility hotfix:

- `verify:python-lock` now accounts for Windows-only dependency resolution where `uvloop` is not installable and `colorama` may be installed by transitive dependencies;
- `pika==1.4.1` is allowed as an installed optional project dependency when a developer environment already contains the worker RabbitMQ extra;
- arbitrary unlocked packages still fail verification;
- regression tests cover the Windows-specific case reported by the user and still reject unrelated extra packages.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run test:workspace` | passed, 32/32 |
| `npm test` | passed, 93/93 JavaScript/TypeScript tests |
| `npm run verify:registry` | passed, 110 unique tools |
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
| `npm run verify:built-site` | passed, 34 public routes / 32 localized HTML routes |
| `npm run test:python` | passed, 79/79 |
| `npm run lint:python` | passed |
| `npm run verify:python-lock` | passed, 30 locked packages matched installed packages for linux |
| `npm run test:browser` | not verified in this sandbox; local navigation is blocked by environment policy |

## Browser boundary

The production server and system Chromium can start in this sandbox, but Chromium cannot navigate to the local Playwright server:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR
http://127.0.0.1:4173/
```

This is the same environment navigation restriction observed before A8. Browser behavior, accessibility, responsive reflow, hydration, and visual rendering are therefore not claimed as passed or failed by this verification.

## Remaining known scope

The following findings remain outside this patch and require separate minimal patches:

- byte/semantic equality gate for the duplicated frontend/backend registry JSON;
- richer sitemap-index expansion and bounded multi-sitemap collection;
- production persistence, queueing, crawler limits, retry policy, and observability;
- browser/e2e confirmation in a local environment where Chromium can navigate to the Playwright server.

## Repository boundary

The supplied working copy used by the assistant excludes `.git`. Git status and diff cannot be recomputed from this audit copy. Source changes were made only in the files listed for this patch, and no GitHub write, commit, or push was performed by the assistant.
