# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A10.8 markup/schema tools. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, A10.1 HTTP status / redirect chain tool, A10.2 robots.txt tester, A10.3 sitemap validator, A10.4 canonical checker, A10.5 security headers checker, A10.6 catalog strategy and product quality gate, A10.7 metadata/social preview tools, and this A10.8 markup/schema batch.

A10.8 changes:

- added backend markup tool endpoints:
  - `POST /v1/tools/structured-data`;
  - `POST /v1/tools/html-validator`;
- added `apps/api/src/webdiag_api/tools/markup.py` using existing `SafeHttpFetcher`, JSON-LD extraction and deterministic HTML parsing;
- added Structured Data Validator as a real URL-based tool:
  - JSON-LD block count;
  - valid/invalid JSON-LD count;
  - detected Schema.org `@type` summary;
  - per-block parse errors and recommendations;
- added HTML Markup Validator as practical WebDiag markup inspection, not a fake full W3C clone:
  - doctype;
  - html/head/body structure;
  - html `lang`;
  - title;
  - mobile viewport;
  - duplicate IDs;
  - unexpected closing tags;
  - unclosed non-void tags;
- added browser-only Schema.org JSON-LD Generator with deterministic supported templates:
  - `Organization`;
  - `LocalBusiness`;
  - `FAQPage`;
  - `BreadcrumbList`;
- added Next.js proxy routes:
  - `POST /api/tools/structured-data`;
  - `POST /api/tools/html-validator`;
- added frontend tool components, validators, proxy tests, copyable outputs and editorial pages for:
  - `/tools/structured-data-validator` and `/en/tools/structured-data-validator`;
  - `/tools/schema-markup-generator` and `/en/tools/schema-markup-generator`;
  - `/tools/html-validator` and `/en/tools/html-validator`;
- promoted exactly 3 public tools to `ready`:
  - `structured-data-validator`;
  - `schema-markup-generator`;
  - `html-validator`;
- updated registry counts from 22 to 25 ready tools;
- did not add weak microtools such as H1 checker, title-length checker, description-length checker, or one-field schema checkers.

## Confirmed gates in this environment

| Gate | Result |
|---|---:|
| `npm run test:workspace` | PASS — 37/37 |
| `npm test` | PASS — 159/159 JavaScript/TypeScript tests |
| `npm run verify:registry` | PASS — 110 unique tools, 25 ready tools, no weak ready microtools |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run verify:built-site` | PASS — 56 public routes / 54 localized HTML routes |
| `npm run test:python` | PASS — 106/106 |
| `npm run lint:python` | PASS |
| `npm run verify:python-lock` | PASS — 30 locked packages matched installed packages for linux |
| `npm run test:browser` | NOT VERIFIED in this sandbox |

## Browser gate note

The browser gate is not claimed as passed in this environment. Previous runs in this sandbox started Chromium and the local test server but blocked navigation to `http://127.0.0.1:4173/` with `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

## Known limitations after A10.8

- Structured Data Validator checks JSON-LD syntax and discovered `@type` values; it does not guarantee Google rich result eligibility.
- HTML Markup Validator is a deterministic WebDiag markup inspection, not full W3C conformance validation.
- These tools parse server-returned HTML and do not execute JavaScript-rendered markup in the MVP.
- Schema.org JSON-LD Generator is a deterministic browser template generator, not an AI tool and not a fact-generation system.
- Core Web Vitals/PageSpeed remains planned; no Google PageSpeed API key, client, normalization DTO, cache, quota handling, or UI has been implemented yet.
- AI tools remain planned; no AI provider integration, billing/limits, moderation, or usage accounting has been implemented yet.
- Monitoring remains planned; no auth, database, scheduled jobs, notification channels, or history has been implemented yet.

## Next implementation order

1. Performance batch: Core Web Vitals/PageSpeed Checker foundation, HTTP Cache Policy Checker, Page Weight/Resource Summary.
2. Image utilities batch: Resize Image, Compress Image, Convert Image.
3. Image utilities batch 2: Crop Image, SVG Optimizer, Favicon Generator/Add Watermark depending on patch size.
4. Content structure batch: Heading Structure Checker, Keyword/Phrase Frequency Analyzer, Readability Analyzer.
