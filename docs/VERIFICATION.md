# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A9 frontend-safe audit result contract. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1 backend safety, A7.2 resource correctness, A7.3 timing-contract changes, A7.4 Python lock reproducibility, A7.5 frontend audit API contract hardening, A8 compact live audit result UI extraction, A8.1 UI correction / Python lock compatibility hotfix, A8.2 report tab design differentiation, A8.3 report tab icon semantics polish, and this A9 frontend-safe audit result contract patch.

A9 changes:

- introduced a dedicated `webdiag.web.audit_result.v1` frontend result contract;
- kept the backend source contract as `webdiag.audit.snapshot.v1`;
- added a shared frontend contract module for:
  - backend snapshot validation;
  - backend error payload validation;
  - defensive JSON parsing;
  - backend-to-frontend projection;
  - frontend result validation;
- changed the Next `/api/audits` proxy to return the stable frontend DTO instead of forwarding the raw backend snapshot shape;
- changed the browser audit client to accept only the frontend DTO;
- changed the compact result section view model to read camelCase frontend-safe fields;
- added contract regression tests for projection, validation, client handling, proxy handling, and result view-model consumption;
- did not change backend API, audit engine behavior, registry data, crawler scope, persistence, queueing, or visual report tab content.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run test:workspace` | passed, 32/32 |
| `npm test` | passed, 96/96 JavaScript/TypeScript tests |
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
