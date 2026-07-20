# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A7.2 audit resource correctness. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1 backend safety and A7.2 resource-correctness changes.

A7.2 changes:

- implements robots.txt `Allow`/`Disallow` precedence with longest-match behavior;
- makes equally specific `Allow` override `Disallow`;
- supports grouped `User-agent` records, multiple user agents in one group, `*` fallback, wildcard `*`, and end-anchor `$` matching;
- preserves sitemap URLs declared in robots.txt and resolves relative `Sitemap:` values against the robots URL;
- fetches the first valid HTTP(S) sitemap declared in robots.txt before falling back to the default `/sitemap.xml`;
- normalizes sitemap target comparison for scheme/host case, default ports, trailing slash, and fragment removal;
- resolves relative canonical URLs against the final fetched URL before comparing canonical and final URL;
- normalizes canonical comparison for scheme/host case, default ports, trailing slash, query preservation, and fragment removal;
- adds regression tests for robots precedence, robots user-agent groups, wildcard/end-anchor rules, declared sitemap discovery, relative sitemap declarations, sitemap URL normalization, and relative canonical handling.

No frontend redesign, database, crawler, worker integration, persistence migration, registry refactor, per-check duration timing, Python lock refactor, commit, or push is included.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run test:workspace` | passed, 26/26 |
| `npm test` | passed, 78/78 JavaScript/TypeScript tests |
| `npm run verify:registry` | passed, 110 unique tools |
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
| `npm run verify:built-site` | passed, 34 public routes / 32 localized HTML routes |
| `npm run test:python` | passed, 79/79 |
| `npm run lint:python` | passed |
| `npm run test:browser` | not verified in this sandbox; local navigation is blocked by environment policy |

## Browser boundary

The production server and system Chromium both started. The browser was unable to navigate to the local Playwright server:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR
http://127.0.0.1:4173/
```

This is the same environment navigation restriction observed before A7.2. Browser behavior, accessibility, responsive reflow, hydration, and visual rendering are therefore not claimed as passed or failed by this verification.

## Security and correctness boundary after A7.2

A7.1 hardened audit execution safety: DNS targets are pinned to validated IPs, the connected peer is verified, environment proxies are disabled, redirects are re-checked, and HTTP response bodies are bounded during streaming and decoding.

A7.2 improves report correctness for origin resources and canonical comparison. A robots.txt `Allow` rule can now correctly override a broader `Disallow`, declared sitemap locations are used before the default sitemap endpoint, and relative canonical hrefs no longer create false final-URL mismatch issues when they resolve to the fetched final URL.

## Remaining known scope

The following findings remain outside A7.2 and require separate minimal patches:

- real per-check timing instead of placeholder `duration_ms=0`;
- Python dependency lock/install reproducibility;
- byte/semantic equality gate for the duplicated frontend/backend registry JSON;
- richer sitemap-index expansion and bounded multi-sitemap collection;
- production persistence, queueing, crawler limits, retry policy, and observability;
- frontend result UI extraction from the Hero into a dedicated compact result section.

## Repository boundary

The supplied context archive excludes `.git`. Git status and diff cannot be recomputed from the audit copy. Source changes were made only in the A7.2 files, and no GitHub write, commit, or push was performed by the assistant.
