# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A7.4 Python lock reproducibility gate. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1 backend safety, A7.2 resource correctness, A7.3 timing-contract changes, and A7.4 Python lock reproducibility.

A7.4 changes:

- updates `requirements-dev.lock.txt` to match the actual Python dependency resolution observed after installing `apps/api[dev]` and `apps/worker[dev]`;
- changes `npm run python:install` to install editable Python packages under `requirements-dev.lock.txt` constraints;
- adds `npm run verify:python-lock` as an explicit drift gate comparing `pip freeze --exclude-editable` with the lockfile;
- adds unit tests for Python lock parsing, name normalization, missing-package detection, extra-package detection, and version-drift detection;
- includes the Python lock test file in `npm run test:workspace`;
- extends `npm run verify:local` so local full verification includes `verify:python-lock` after Python tests and linting.

No frontend redesign, database, crawler, worker integration, persistence migration, registry refactor, commit, or push is included.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run python:install` | passed with lock constraints |
| `npm run test:workspace` | passed, 30/30 |
| `npm test` | passed, 82/82 JavaScript/TypeScript tests |
| `npm run verify:registry` | passed, 110 unique tools |
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
| `npm run verify:built-site` | passed, 34 public routes / 32 localized HTML routes |
| `npm run test:python` | passed, 79/79 |
| `npm run lint:python` | passed |
| `npm run verify:python-lock` | passed, 30 locked packages matched installed packages |
| `npm run test:browser` | not verified in this sandbox; local navigation is blocked by environment policy |

## Browser boundary

The production server and system Chromium can start in this sandbox, but Chromium cannot navigate to the local Playwright server:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR
http://127.0.0.1:4173/
```

This is the same environment navigation restriction observed before A7.4. Browser behavior, accessibility, responsive reflow, hydration, and visual rendering are therefore not claimed as passed or failed by this verification.

## Security and correctness boundary after A7.4

A7.1 hardened audit execution safety: DNS targets are pinned to validated IPs, the connected peer is verified, environment proxies are disabled, redirects are re-checked, and HTTP response bodies are bounded during streaming and decoding.

A7.2 improved report correctness for origin resources and canonical comparison. A robots.txt `Allow` rule can correctly override a broader `Disallow`, declared sitemap locations are used before the default sitemap endpoint, and relative canonical hrefs no longer create false final-URL mismatch issues when they resolve to the fetched final URL.

A7.3 makes the existing check timing fields non-placeholder values. These timings measure the report check assembly step in the synchronous single-page report builder. They are not yet full distributed observability spans and should not be interpreted as network, browser, crawler, queue, or persistence timings.

A7.4 makes Python dependency drift visible and fail-fast after local installation. The lockfile is now used as a constraints file by `python:install`, and `verify:python-lock` fails if installed non-editable packages are missing from the lock, contain extra packages, or differ by version.

## Remaining known scope

The following findings remain outside A7.4 and require separate minimal patches:

- byte/semantic equality gate for the duplicated frontend/backend registry JSON;
- richer sitemap-index expansion and bounded multi-sitemap collection;
- production persistence, queueing, crawler limits, retry policy, and observability;
- frontend result UI extraction from the Hero into a dedicated compact result section.

## Repository boundary

The supplied context archive excludes `.git`. Git status and diff cannot be recomputed from the audit copy. Source changes were made only in the A7.4 files, and no GitHub write, commit, or push was performed by the assistant.
