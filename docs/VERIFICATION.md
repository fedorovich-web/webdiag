# Verification — WebDiag

Date: 2026-07-20
Package version: `0.5.11`
Patch scope: A7.1 audit execution safety hardening. No commit or push was performed.

## Scope

This verification record covers the clean A0–A7 baseline plus the A7.1 backend safety patch.

A7.1 changes:

- resolves and validates every candidate address before a request;
- pins each connection to a validated IP instead of allowing the HTTP client to resolve the hostname again;
- preserves the original hostname in the HTTP `Host` header and TLS SNI;
- disables environment proxy inheritance with `trust_env=False`;
- disables keep-alive reuse between pinned targets and verifies the connected peer address;
- re-runs URL and resolved-address policy checks for every redirect target;
- streams response bodies instead of reading `response.content`;
- rejects oversized declared bodies before reading the stream;
- enforces hard limits for unknown-length/chunked bodies, compressed wire data, and decoded gzip/deflate data;
- normalizes HTTP timeout, transport, body-limit, decoding, peer, and URL-policy execution failures;
- persists a failed job and failed run for expected execution failures;
- persists failed state before re-raising unexpected execution exceptions;
- treats an unsafe robots/sitemap redirect as an audit execution failure instead of reporting the resource as merely missing;
- adds regression tests for IP pinning, Host/SNI preservation, peer verification, redirect SSRF blocking, streaming limits, gzip decoding, decompression limits, and failed-state persistence.

No frontend redesign, database, crawler, worker integration, persistence migration, robots semantics rewrite, canonical normalization, registry refactor, commit, or push is included.

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
| `npm run test:python` | passed, 70/70 |
| `npm run lint:python` | passed |
| `npm run test:browser` | not verified in this sandbox; local navigation is blocked by environment policy |

## Browser boundary

The production server and system Chromium both started. The browser was then unable to navigate to the local Playwright server:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR
http://127.0.0.1:4173/
```

A bounded diagnostic run stopped after the first failure:

```text
1 failed
36 did not run
```

This is an environment navigation restriction. Browser behavior, accessibility, responsive reflow, hydration, and visual rendering are therefore not claimed as passed or failed by this verification.

## Security boundary after A7.1

The fetch path no longer has the previous DNS validation/request-resolution TOCTOU design: the selected public IP is used as the actual connection target, while hostname identity is preserved for HTTP and TLS. The response peer is checked against the pinned address, and environment proxies are disabled.

The body limit is now a transport-processing gate rather than a post-download slice. Declared oversized responses are rejected before iteration; unknown-length and compressed responses are bounded while streaming and decoding.

## Remaining known scope

The following findings remain outside A7.1 and require separate minimal patches:

- robots.txt `Allow`/`Disallow` precedence, wildcard, end-anchor, and user-agent group semantics;
- relative canonical URL resolution before final-URL comparison;
- fetching sitemap URLs declared through `Sitemap:` directives;
- real per-check timing instead of placeholder `duration_ms=0`;
- Python dependency lock/install reproducibility;
- byte/semantic equality gate for the duplicated frontend/backend registry JSON;
- production persistence, queueing, crawler limits, retry policy, and observability.

## Repository boundary

The supplied context archive excludes `.git`. Git status and diff cannot be recomputed from the audit copy. Source changes were made only in the agreed files, and no GitHub write, commit, or push was performed.
