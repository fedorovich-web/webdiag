# Verification — WebDiag

Date: 2026-07-21
Package version: `0.5.11`
Patch scope: A10.17 DNS / mail / network tools. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, A10.1–A10.16 tool batches, and this A10.17 network DNS batch.

A10.17 changes:

- added backend DNS/mail endpoints:
  - `POST /v1/tools/dns-lookup`;
  - `POST /v1/tools/mx-records`;
  - `POST /v1/tools/spf`;
- added `apps/api/src/webdiag_api/tools/network_dns.py`;
- added stdlib-only bounded DNS resolver foundation for A/AAAA/CNAME/MX/NS/TXT;
- added strict domain input validation:
  - rejects URLs;
  - rejects IP literals;
  - validates IDNA/ascii domain labels;
- added DNS Lookup:
  - selected record-type lookup;
  - per-record errors without failing the whole batch;
  - TTL and priority output where applicable;
- added MX Record Checker:
  - MX count;
  - priority handling;
  - null MX detection;
  - A/AAAA coverage checks for MX hosts;
  - DNS-only scope without SMTP/TLS claims;
- added SPF Checker:
  - `v=spf1` TXT detection;
  - duplicate SPF detection;
  - mechanism extraction;
  - include/redirect flags;
  - final `all` policy check;
  - estimated visible DNS lookup mechanism count;
- added Next.js proxy routes:
  - `POST /api/tools/dns-lookup`;
  - `POST /api/tools/mx-records`;
  - `POST /api/tools/spf`;
- added frontend contracts, validators, proxy tests, presenters, UI components, and editorial pages;
- promoted exactly 3 public tools to `ready`:
  - `dns-lookup`;
  - `mx-record-checker`;
  - `spf-checker`;
- public tool count is now 49;
- registry entry count remains 112;
- no weak microtools were added.

## Tests run

```text
npm test                     PASS — 211 total Node/Vitest tests
npm run verify:registry      PASS — 112 unique tools, 49 ready tools, no weak ready microtools
npm run lint                 PASS
npm run typecheck            PASS
npm run test:python          PASS — 136/136
npm run lint:python          PASS
npm run verify:python-lock   PASS — 30 locked packages matched installed packages for linux
```

`npm run build` was not counted as fully passed in the sandbox. The build compiled and TypeScript passed, but the process was interrupted by the sandbox timeout during static page generation at `Generating static pages (0/119)`. Run the full build locally before commit/push.

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
