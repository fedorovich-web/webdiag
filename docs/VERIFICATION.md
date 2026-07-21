# Verification Notes

Patch scope: A10.20 HTTP headers / protocol / CORS tools. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, A10.1–A10.19 tool batches, and this A10.20 header/protocol batch.

A10.20 changes:

- extended `SafeHttpFetcher` with bounded safe extra request headers for controlled CORS `Origin` checks:
  - blocks `Host`, `Connection`, `Content-Length`, `Proxy-Authorization`, `Transfer-Encoding`, and `Upgrade`;
  - rejects CRLF in header names or values;
  - caps header name/value length;
- added backend protocol/security endpoints:
  - `POST /v1/tools/http-headers`;
  - `POST /v1/tools/http-protocol`;
  - `POST /v1/tools/cors`;
- added HTTP Headers Analyzer:
  - status code, final URL and redirect count;
  - header inventory;
  - `Server` and `X-Powered-By` disclosure signals;
  - `Cache-Control`, `Content-Type`, `Content-Length`, `Content-Encoding`, and `Vary` signals;
  - no duplicate Security Headers Checker logic;
- added HTTP/2 / HTTP/3 Checker:
  - HTTP/2 support from TLS ALPN `h2` negotiation;
  - HTTP/3 advertised signal from `Alt-Svc` `h3` values;
  - TLS version context;
  - no fake QUIC negotiation claim;
- added CORS Checker:
  - sends a controlled safe `Origin` request header;
  - checks `Access-Control-Allow-Origin`, credentials, methods, headers, exposed headers, and `Max-Age`;
  - detects wildcard ACAO plus credentials;
  - checks `Vary: Origin`;
  - no full browser/preflight matrix claim;
- added Next.js proxy routes:
  - `POST /api/tools/http-headers`;
  - `POST /api/tools/http-protocol`;
  - `POST /api/tools/cors`;
- added frontend contracts, validators, proxy tests, presenters, UI components, and editorial pages;
- promoted exactly 3 public tools to `ready`:
  - `http-headers-analyzer`;
  - `http-protocol-checker`;
  - `cors-checker`;
- public tool count is now 58;
- registry entry count remains 112;
- no weak microtools were added.

## Tests run

Before the sandbox build EOF/reset, these gates passed:

```text
npm --workspace @webdiag/web run test -- protocol-security
PASS — 10 protocol-security frontend/proxy/contract tests

npm test
PASS — 224 total workspace/Node/Vitest tests

npm run verify:registry
PASS — 112 unique tools, 58 ready tools, no weak ready microtools

npm run lint
PASS

npm run typecheck
PASS

npm run test:python
PASS — 152/152

npm run lint:python
PASS

npm run verify:python-lock
PASS — 30 locked packages matched installed packages for linux
```

After the sandbox EOF/reset, the reconstructed patch ZIP was additionally checked with:

```text
python -m py_compile apps/api/src/webdiag_api/audit/fetcher.py apps/api/src/webdiag_api/tools/protocol_security.py apps/api/tests/test_protocol_security_tools.py
PASS

registry JSON count/sync
PASS — 112 entries / 58 ready tools / duplicated backend registry byte-identical
```

`npm run build` was not counted as passed. The sandbox aborted build execution with a container EOF before completion. Run the full build locally before commit/push.

Browser navigation gate was not counted because the sandbox does not provide reliable Chromium navigation to local `127.0.0.1` builds.

## Local pre-push gate

Run locally before committing:

```powershell
npm run test:workspace
npm test
npm run verify:registry
npm run lint
npm run typecheck
npm run build
npm run verify:built-site
npm run test:python
npm run lint:python
npm run verify:python-lock
```

# A10.22 — CSP / third-party scripts / resource hints

## Scope

- added CSP Analyzer:
  - parses enforced `Content-Security-Policy`, `Content-Security-Policy-Report-Only`, and bounded static meta policies;
  - inventories directives and values;
  - reports duplicate directives, `unsafe-inline`, `unsafe-eval`, wildcard sources, and missing `default-src`, `object-src`, `base-uri`, or `frame-ancestors` review signals;
  - does not execute the page, observe browser violations, calculate a fake security score, or claim complete XSS protection;
- added Third-party Script Analyzer:
  - parses bounded static HTML `script` elements;
  - inventories inline/external, same-host/cross-host candidates, async/defer/module/nomodule, parser-blocking candidates, SRI, crossorigin, duplicate src values, and bounded host groups;
  - defines third-party only as a hostname-based cross-host candidate and does not claim ownership, tracking behavior, or runtime coverage;
- added Resource Hints Analyzer:
  - parses `preconnect`, `dns-prefetch`, `preload`, `prefetch`, `modulepreload`, and literal `preinit` relations;
  - reports duplicate hints, preload without `as`, cross-host crossorigin signals, malformed URLs, and a review threshold for many preconnects;
  - does not build a runtime waterfall or produce a performance score;
- all analyzers use one bounded SafeHttpFetcher page request with existing SSRF, redirect, peer-IP, encoding, and body-size gates;
- added strict API DTOs, frontend runtime validators, allowlisted Next.js proxy payloads, copyable result summaries, RU/EN editorial content, and renderer mappings;
- promoted exactly 3 public tools to `ready`:
  - `csp-analyzer`;
  - `third-party-script-analyzer`;
  - `resource-hints-analyzer`;
- public tool count is now 64;
- registry entry count is now 115;
- no weak CSP-header, analytics-host, preload, or single-signal microtools were added.

## Verified in the patch sandbox

```text
python -m py_compile changed Python files
PASS

python -m pytest apps/api/tests/test_client_delivery_tools.py -q
PASS — 10/10

python -m pytest apps/api/tests -q
PASS — 163/163

python -m pytest selected fetcher / URL policy / protocol-security / A10.22 tests -q
PASS — 52/52

ad-hoc strict TypeScript compile for changed A10.22 production and test files
PASS — external package declarations replaced with temporary sandbox stubs; not a replacement for workspace typecheck

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 115 unique tools, 64 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

registry JSON sync
PASS — 115 entries / 64 ready / backend copy byte-identical
```

## Not counted as PASS in this sandbox

- `npm test`, frontend Vitest suites, lint, typecheck, build, and built-site verification require the excluded `node_modules` dependency tree;
- browser/Playwright gate was not run;
- `npm run test:python`, `npm run lint:python`, and `npm run verify:python-lock` require the project `.venv`, which is intentionally absent from the handoff archive;
- direct system-Python fallback across API and worker tests returned `163 passed, 2 failed`: both worker failures are import failures because `dramatiq` is not installed in the sandbox, so the complete Python gate is not reported as PASS.

Run the complete local pre-push gate before commit/push.

---

# A10.21 — Server timing / cookie / mixed content tools

## Scope

- added Server Timing Analyzer:
  - parses the `Server-Timing` response header;
  - extracts metric name, `dur`, and `desc` values;
  - does not claim synthetic performance measurement or RUM coverage;
- added Cookie Policy Checker:
  - checks `Set-Cookie` attributes for one response;
  - reports Secure, HttpOnly, SameSite, persistent-cookie signals, and issues;
  - does not evaluate legal consent banners or browser session flows;
- added Mixed Content Checker:
  - parses bounded static HTML;
  - detects HTTP subresource candidates on HTTPS pages;
  - separates active and passive mixed content;
  - does not execute JavaScript, parse runtime DOM, or crawl CSS background images;
- added Next.js proxy routes:
  - `POST /api/tools/server-timing`;
  - `POST /api/tools/cookie-policy`;
  - `POST /api/tools/mixed-content`;
- promoted exactly 3 public tools to `ready`:
  - `server-timing-analyzer`;
  - `cookie-policy-checker`;
  - `mixed-content-checker`;
- public tool count is now 61;
- registry entry count is now 113;
- no weak one-header or one-cookie microtools were added.

## Local verification notes

The current sandbox reconstruction did not include `node_modules` or `.venv`, so full Vitest/build/npm-python-wrapper gates could not be executed here. The patch was checked with direct Python/API and Node workspace/registry gates:

```text
python -m py_compile apps/api/src/webdiag_api/tools/protocol_security.py apps/api/tests/test_protocol_security_tools.py
PASS

python -m pytest apps/api/tests -q
PASS — 153/153

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 113 unique tools, 61 ready tools, no weak ready microtools

registry JSON count/sync
PASS — 113 entries / 61 ready tools / duplicated backend registry byte-identical
```

Run the full local pre-push gate before commit/push.
