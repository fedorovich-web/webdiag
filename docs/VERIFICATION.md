# Verification Notes

Patch scope: A10.28 JSON Schema / YAML-JSON / XML browser utilities. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, and A10.1–A10.28 public tool batches.

# A10.28 — JSON Schema / YAML-JSON / XML utilities

## Scope

- activated JSON Schema Validator as a browser-only bounded validator:
  - JSON input and schema are limited to 500,000 characters, 10,000 nodes, and depth 64;
  - supports documented core/object/array/string/number keywords, combinators, `$defs`/`definitions`, and local JSON Pointer `$ref`;
  - selected format checks are syntactic signals only;
  - remote `$ref`, dynamic references, unevaluated keywords, conditional keywords, and remote schema fetching are not supported;
- activated YAML ↔ JSON Converter for a safe configuration subset:
  - mappings, sequences, plain/quoted scalars, JSON-style inline collections, duplicate-key detection, and JSON-compatible output;
  - two-space indentation, 5,000-node cap, and depth 32;
  - anchors, aliases, custom tags, merge keys, complex keys, tabs, and block scalars are rejected;
  - comments are not preserved through conversion;
- activated XML Formatter and Validator:
  - one root element, matching start/end tags, self-closing tags, quoted and unique attributes, comments, CDATA, processing instructions, and predefined/numeric entities;
  - DTD and ENTITY declarations are rejected before parsing; no external entity resolution occurs;
  - mixed content is preserved compactly so formatting does not inject significant whitespace;
  - XSD, Relax NG, Schematron, namespace semantics, and canonical XML are outside scope;
- all three tools run locally in the browser and add no API routes or dependencies;
- activated exactly 3 existing internal tools: `json-schema-validator`, `yaml-json-converter`, and `xml-formatter-validator`;
- public tool count is now 82; registry entry count remains 125.

## Verified in the patch sandbox

```text
ad-hoc strict TypeScript compile for utility engine, UI, and tests
PASS — strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes; temporary declarations used for excluded React/Vitest packages

structured-data utility runtime assertions
PASS — JSON Schema, local $ref, unsupported keywords, IPv4/IPv6 format signals, safe YAML, duplicate/unsafe YAML, JSON↔YAML round trip, XML formatting, DTD/CDATA/attribute rejection, and mixed-content cases

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 125 unique tools, 82 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

python -m pytest apps/api/tests -q
PASS — 200/200

registry JSON sync and ready renderer/editorial parity
PASS — backend registry byte-identical; 82/82 ready slugs covered by workspace integrity gate
```

## Required local verification

- run full Vitest, ESLint, official TypeScript, build, built-site, Python, Ruff, and lock gates before commit;
- browser/Playwright remains a separate required gate when the environment supports it.

---

# A10.27 — DNS resolver comparison / domain RDAP / IP RDAP

## Scope

- activated DNS Resolver Comparison for one explicit A, AAAA, CNAME, MX, NS, or TXT type across four fixed public recursive resolvers;
- resolver queries run in a bounded four-worker pool with 3.5-second per-query timeout, answer-set comparison, partial-error reporting, and backend-to-resolver timing;
- resolver agreement is explicitly described as a backend snapshot, not global DNS propagation proof;
- activated Domain RDAP Lookup using IANA DNS bootstrap and the selected HTTPS registry RDAP service;
- domain output is bounded to registration statuses/events, nameservers, registrar, abuse contact, delegationSigned, and notice titles; registrant personal contacts are not displayed;
- RDAP 404 is returned as a warning and never presented as proof that a domain is available;
- activated IP RDAP Network Lookup using IANA IPv4/IPv6 bootstrap and most-specific prefix matching;
- IP output is bounded to registry allocation range, CIDR0, handle, type, statuses, country field, events, and abuse contact; country is explicitly marked as registration data, not device geolocation;
- private, loopback, link-local, reserved, and other non-global IP input is rejected;
- IANA bootstrap and registry RDAP HTTP requests use SafeHttpFetcher with pinned DNS targets, redirect revalidation, peer-IP verification, trust_env disabled, three redirects, seven-second timeout, and 1.5 MB decoded-body cap;
- added strict API DTOs, frontend runtime validators, allowlisted Next.js proxy payloads, RU/EN editorial pages, copyable reports, and registry/renderer coverage;
- activated exactly 3 existing internal tools: `dns-propagation-checker`, `whois-lookup`, and `ip-information`; production titles and copy describe resolver comparison and RDAP rather than fake propagation, legacy WHOIS scraping, geolocation, or reputation;
- public tool count is now 79; registry entry count remains 125.

## Verified in the patch sandbox

```text
python -m pytest apps/api/tests/test_network_intelligence_tools.py -q
PASS — 9/9

python -m py_compile changed Python files
PASS

registry JSON sync
PASS — backend and package registry byte-identical

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 125 unique tools, 79 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

python -m pytest apps/api/tests -q
PASS — 200/200

python -m pytest selected network intelligence / DNS / SafeHttpFetcher / URL-policy tests -q
PASS — 47/47

ad-hoc strict TypeScript compile for network intelligence contracts, proxy, UI, routes, and tests
PASS — strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes; temporary declarations used for excluded external packages

network-intelligence input runtime assertions
PASS — domain normalization, URL rejection, IPv4/IPv6 syntax, and malformed IPv4 rejection

TypeScript isolated syntax transpile
PASS — network intelligence production files, renderer, and security-network editorial content

registry JSON sync and ready-renderer/editorial parity
PASS — backend registry byte-identical; 79/79 ready slugs covered by workspace integrity gate
```

## Not counted as PASS in this sandbox

- `npm test` passes the 37 workspace checks but cannot run Vitest because `node_modules` is excluded;
- `npm run lint` cannot run because ESLint is absent;
- official `npm run typecheck` cannot resolve excluded Next.js, React, Vitest, Node, and workspace package declarations;
- `npm run build` cannot run because Next.js is absent, and `npm run verify:built-site` has no `.next` output to inspect;
- `npm run test:python`, `npm run lint:python`, and `npm run verify:python-lock` require the excluded project `.venv`;
- direct system-Python API+worker fallback reports 200 passed and 2 worker import failures because `webdiag_worker` is unavailable on that interpreter path;
- Ruff is not installed in the sandbox, so local `npm run lint:python` remains mandatory;
- browser/Playwright gate was not run.

---

# A10.26 — specialized structured-data generators

## Scope

- added Organization Schema JSON-LD Generator:
  - explicit Organization, Corporation, NGO, or LocalBusiness selection;
  - name, legalName, URL, @id, logo, description, email, telephone, sameAs, PostalAddress, and one bounded ContactPoint;
  - no placeholder entity facts, ownership checks, or automatic type inference;
- added BreadcrumbList Schema JSON-LD Generator:
  - 2–20 explicit Name | URL or TSV rows;
  - sequential positions and absolute HTTP(S) validation;
  - item may be omitted only for the final current-page crumb;
  - no crawler, navigation extraction, or canonical-intent claim;
- added Product Schema JSON-LD Generator:
  - explicit name, description, URL, @id, up to 10 images, SKU, Brand, GTIN, MPN, and one optional Offer;
  - validated price/currency pair, availability, itemCondition, seller, and priceValidUntil;
  - no fabricated aggregateRating, review, inventory, seller, price, or availability;
- all three tools run locally in the browser and send no input to the backend;
- JSON-LD serialization escapes less-than characters to prevent user input from closing the script element;
- empty optional properties are omitted and example placeholder data is never emitted;
- added RU/EN forms and editorial pages, copyable output, generator validation tests, and renderer mappings;
- activated exactly 3 public tools:
  - `organization-schema-generator`;
  - `breadcrumb-schema-generator`;
  - `product-schema-generator`;
- public tool count is now 76;
- registry entry count is now 125.

## Verified in the patch sandbox

```text
npm run test:workspace
PASS — 37/37

node scripts/verify-registry.mjs
PASS — 125 unique tools

node scripts/verify-tool-catalog-quality.mjs
PASS — 125 tools, 76 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

python -m pytest apps/api/tests -q
PASS — 191/191

ad-hoc strict TypeScript compile for structured-schema generator logic, UI, and tests
PASS — strict, noUncheckedIndexedAccess, isolatedModules; temporary declarations used for excluded external packages

structured-schema generator runtime assertions
PASS — Organization, BreadcrumbList, Product/Offer, GTIN, calendar date, explicit-field, and script-closing escape cases

TypeScript isolated syntax transpile
PASS — generator logic, tests, UI, renderer, and SEO content

registry JSON sync and ready-renderer/editorial parity
PASS — backend registry byte-identical; 76/76 ready slugs have renderers and editorial pages
```

## Not counted as PASS in this sandbox

- `npm test` reaches workspace checks but cannot run Vitest because `node_modules` is excluded;
- `npm run lint` cannot run because ESLint is absent;
- official `npm run typecheck` cannot resolve excluded Next.js, React, Vitest, Node, and workspace package declarations;
- `npm run build` cannot run because Next.js is absent, and `npm run verify:built-site` has no `.next` output to inspect;
- `npm run test:python`, `npm run lint:python`, and `npm run verify:python-lock` require the excluded project `.venv`;
- direct system-Python API+worker fallback reports 191 passed and 2 worker import failures because `webdiag_worker` is unavailable on that interpreter path;
- browser/Playwright gate was not run.

---

# A10.25 — landmark structure / form accessibility / accessible names

## Scope

- added Landmark Structure Analyzer:
  - bounded static inventory for semantic and explicit ARIA landmark candidates;
  - main, navigation, banner, contentinfo, complementary, search, form, and region counts;
  - accessible names from aria-label, aria-labelledby, and title fallback signals;
  - missing/multiple/nested main, duplicate role/name, unnamed repeated landmarks, hidden signals, duplicate IDs, and broken aria-labelledby findings;
- added Form Accessibility Analyzer:
  - bounded inventory of non-hidden input, select, textarea, and button controls;
  - explicit and implicit label relationships, aria-label, aria-labelledby, button text, image alt, input value/default-value, and title signals;
  - placeholder-only controls, broken label/description references, duplicate control IDs, fieldset/legend, and repeated radio/checkbox grouping review;
  - no form submission, validation execution, focus-order test, or dynamic-state claim;
- added Link and Button Accessible Name Analyzer:
  - native links/buttons and explicit role=link/role=button candidates;
  - accessible names from text, descendant image alt, ARIA, input value/default-value, and title signals;
  - unnamed/generic names, nested interactive elements, custom roles without tabindex=0, duplicate IDs, javascript: links, empty targets, and same-name/different-target review;
  - explicit role semantics override conflicting native tag semantics in the inventory;
- all tools use one bounded SafeHttpFetcher document request with a 1 MB decoded-body cap, five redirects, existing URL-policy/DNS/peer-IP protections, 5,000 parsed-node cap, 150-item output cap, and 100-finding cap;
- browser accessibility tree, JavaScript, CSS visibility, event listeners, focus order, keyboard activation, screen-reader behavior, and WCAG conformance are not claimed;
- added strict API DTOs, frontend runtime validators, allowlisted Next.js proxy input, RU/EN editorial pages, copyable summaries, and renderer mappings;
- activated exactly 3 public tools:
  - `landmark-structure-analyzer`;
  - `form-accessibility-analyzer`;
  - `interactive-accessible-name-analyzer`;
- public tool count is now 73;
- registry entry count is now 122;
- no standalone label, alt, ARIA-role, or accessible-name microtools were added.

## Verified in the patch sandbox

```text
python -m py_compile changed Python files
PASS

python -m pytest apps/api/tests/test_accessibility_static_tools.py -q
PASS — 11/11

python -m pytest selected accessibility / SafeHttpFetcher / URL-policy / A10.22 / A10.23 / protocol-security tests -q
PASS — 69/69

python -m pytest apps/api/tests -q
PASS — 191/191

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 122 unique tools, 73 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

ad-hoc strict TypeScript compile for the new A10.25 contracts, proxies, UI, routes, and tests
PASS — strict, noUncheckedIndexedAccess, isolatedModules; temporary declarations used for excluded external packages

TypeScript isolated syntax transpile
PASS — 11 changed TS/TSX files

registry JSON sync and ready-renderer parity
PASS — backend registry byte-identical; 73/73 ready slugs have renderers

Python changed-file import/line-length static checks
PASS — no unused imports found by AST scan; no lines above configured 100 characters
```

## Not counted as PASS in this sandbox

- `npm test` cannot run because `vitest` and `node_modules` are excluded from the handoff archive;
- `npm run lint` cannot run because `eslint` is absent;
- official `npm run typecheck` cannot resolve excluded Next.js, React, Vitest, Node, and workspace package declarations;
- `npm run build` cannot run because `next` is absent, and `npm run verify:built-site` has no `.next` output to inspect;
- `npm run test:python`, `npm run lint:python`, and `npm run verify:python-lock` require the excluded project `.venv`;
- Ruff itself is absent from the sandbox, so the AST/line-length checks above do not replace `npm run lint:python`;
- browser/Playwright gate was not run.

Run the complete local pre-push gate before commit/push.

---

# A10.24 — URL normalization / query parameters / redirect map

## Scope

- added URL Normalization Analyzer as a local browser tool:
  - deterministic HTTP/HTTPS scheme/host casing, default-port, IDNA, dot-segment, and percent-encoding normalization;
  - separate normalized display URL and fragment-free HTTP request URL;
  - duplicate-slash and trailing-slash behavior is preserved and reported as an application-routing review signal;
  - no network request and no claim about SEO canonical intent;
- promoted the former internal pagination/URL-parameter entry as Query Parameter Analyzer:
  - bounded local parsing of up to 200 query pairs while preserving pair order;
  - repeated names, blank names/values, case variants, and sensitive-looking names;
  - transparent name-based tracking, pagination, sorting, filtering, search, and session categories;
  - optional candidate with known tracking-name patterns removed, without changing the source URL or declaring a canonical;
- added Redirect Map Validator:
  - accepts 1–25 explicit CSV/TSV source-to-target rows with optional 301/302/303/307/308 status;
  - compares the observed first redirect hop, optional status, and final URL;
  - detects duplicate/conflicting sources, self redirects, map chains, and cycles;
  - uses at most five concurrent SafeHttpFetcher checks with a five-second per-request timeout, five-hop redirect cap, no body read, and existing SSRF/DNS/peer-IP protections;
  - does not crawl the site, invent missing rules, or generate a redirect map;
- added strict backend DTOs, frontend runtime validation, allowlisted Next.js proxy input, local parsers, RU/EN editorial pages, copyable summaries, and renderer mappings;
- activated exactly 3 public tools:
  - `url-normalization-analyzer`;
  - `query-parameter-analyzer`;
  - `redirect-map-validator`;
- public tool count is now 70;
- registry entry count is now 119;
- no URL-component, tracking-parameter, or status-code microtools were added.

## Verified in the patch sandbox

```text
python -m py_compile changed Python files
PASS

python -m pytest apps/api/tests/test_url_management_tools.py -q
PASS — 7/7

python -m pytest selected URL-management / fetcher / URL-policy / HTTP-status / protocol-security / A10.22 / A10.23 tests -q
PASS — 73/73

python -m pytest apps/api/tests -q
PASS — 180/180

direct system-Python API + worker fallback
180 passed, 2 failed — both worker imports failed because dramatiq is absent from the sandbox; this is not counted as a full Python gate PASS

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 119 unique tools, 70 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

local URL normalization and query-parameter runtime assertions
PASS

redirect map CSV/TSV parser runtime assertions
PASS

ad-hoc strict TypeScript compile for the new A10.24 production and test scope
PASS — temporary sandbox declarations used for excluded external packages; not a replacement for workspace typecheck

TypeScript isolated syntax transpile for changed TS/TSX files
PASS — 12 files

registry JSON sync and ready-renderer parity
PASS — backend registry byte-identical; 70/70 ready slugs have renderers
```

## Not counted as PASS in this sandbox

- `npm test` reached the workspace tests, then stopped because `vitest` is absent from the handoff archive;
- `npm run lint` cannot run because `eslint` is absent;
- official `npm run typecheck` cannot resolve excluded Next.js, React, Vitest, Node, and workspace package declarations;
- `npm run build` cannot run because `next` is absent, and `npm run verify:built-site` has no `.next` output to inspect;
- `npm run test:python`, `npm run lint:python`, and `npm run verify:python-lock` require the excluded project `.venv`;
- browser/Playwright gate was not run.

Run the complete local pre-push gate before commit/push.

---

# A10.23 — JavaScript bundle / CSS delivery / font loading

## Scope

- added JavaScript Bundle Surface Analyzer:
  - parses bounded static HTML external-script references and honours the first valid document `<base href>` when resolving relative assets;
  - separates document references from unique asset checks;
  - reports same-host/cross-host, module/classic, async/defer, parser-blocking candidates, duplicates, status, MIME, redirects, declared bytes, compression, and cache signals;
  - does not execute JavaScript, inspect runtime-injected bundles, calculate coverage, or claim unused code;
- added CSS Delivery Analyzer:
  - inventories stylesheet links and inline style blocks;
  - fetches a bounded set of unique stylesheets through the safe fetcher;
  - reports media, alternate/disabled, duplicate href, MIME, compression, cache, `@import`, `@font-face`, and source-map reference signals;
  - does not calculate unused CSS or build a browser render waterfall;
- added Font Loading Analyzer:
  - correlates bounded static `@font-face` declarations, local/URL sources, formats, font preloads, `font-display`, cache, MIME, and declared-size signals;
  - does not confirm rendered fonts, text visibility timing, or Core Web Vitals impact;
- every nested JavaScript, stylesheet, and font target is independently revalidated through `SafeHttpFetcher`; rejected private/local targets are reported without being requested;
- added strict API DTOs, frontend runtime validators, allowlisted Next.js proxy payloads, copyable result summaries, RU/EN editorial content, and renderer mappings;
- promoted exactly 3 public tools to `ready`:
  - `javascript-bundle-surface-analyzer`;
  - `css-delivery-analyzer`;
  - `font-performance-checker` as the Font Loading Analyzer;
- public tool count is now 67;
- registry entry count is now 117;
- no one-file, one-header, unused-code, or fake performance-score microtools were added.

## Verified in the patch sandbox

```text
python -m py_compile changed Python files
PASS

python -m pytest apps/api/tests/test_asset_delivery_tools.py -q
PASS — 10/10

python -m pytest selected asset-delivery / client-delivery / fetcher / URL-policy / protocol-security tests -q
PASS — 58/58

python -m pytest apps/api/tests -q
PASS — 173/173

npm run test:workspace
PASS — 37/37

npm run verify:registry
PASS — 117 unique tools, 67 ready tools, no weak ready microtools

node --test scripts/tests-tool-catalog-quality.test.mjs
PASS — 5/5

ad-hoc strict TypeScript compile for the new A10.23 contracts, proxy, UI, routes, and tests
PASS — temporary sandbox declarations used for excluded external packages; not a replacement for workspace typecheck

registry JSON sync and ready-renderer parity
PASS — backend registry byte-identical; 67/67 ready slugs have renderers
```

## Not counted as PASS in this sandbox

- `npm test` reached the workspace tests, then stopped because `vitest` is absent from the handoff archive;
- `npm run lint` could not run because `eslint` is absent;
- official `npm run typecheck` could not resolve excluded Next.js, React, Vitest, Node, and workspace package declarations;
- `npm run build` could not run because `next` is absent, and `npm run verify:built-site` has no `.next` output to inspect;
- `npm run test:python`, `npm run lint:python`, and `npm run verify:python-lock` require the excluded project `.venv`;
- direct system-Python fallback across API and worker tests returned `173 passed, 2 failed`; both worker failures are import failures because `dramatiq` is absent;
- browser/Playwright gate was not run.

Run the complete local pre-push gate before commit/push.

---

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
