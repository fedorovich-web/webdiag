# Verification Notes

Patch scope: A10.18 DKIM / DMARC / DNSSEC tools. No commit or push was performed by the assistant.

## Scope

This verification record covers the clean A0–A7 baseline plus A7.1–A7.5 hardening, A8/A8.1/A8.2/A8.3 UI work, A9 frontend-safe audit result contract, A10.1–A10.17 tool batches, and this A10.18 mail authentication / DNSSEC batch.

A10.18 changes:

- added backend DNS/mail endpoints:
  - `POST /v1/tools/dkim`;
  - `POST /v1/tools/dmarc`;
  - `POST /v1/tools/dnssec`;
- extended `apps/api/src/webdiag_api/tools/network_dns.py`:
  - DKIM selector validation;
  - DKIM TXT lookup at `selector._domainkey.domain`;
  - DMARC TXT lookup at `_dmarc.domain`;
  - DS/DNSKEY query support for DNSSEC publication checks;
  - DS and DNSKEY RDATA parsing for useful display values;
- added DKIM Checker:
  - `v=DKIM1` record count;
  - tag extraction;
  - `k=` key type;
  - `p=` public key presence and length signal;
  - no claim of validating real email signatures;
- added DMARC Checker:
  - `v=DMARC1` record count;
  - `p=` and `sp=` policy extraction;
  - `pct=` parsing;
  - `rua`/`ruf` detection;
  - `adkim`/`aspf` alignment tags;
  - no inbox-placement or deliverability claims;
- added DNSSEC Checker:
  - DS record count;
  - DNSKEY record count;
  - delegation-signed signal;
  - zone DNSKEY publication signal;
  - algorithm extraction;
  - explicitly scoped as publication check, not full cryptographic chain validation;
- added Next.js proxy routes:
  - `POST /api/tools/dkim`;
  - `POST /api/tools/dmarc`;
  - `POST /api/tools/dnssec`;
- added frontend contracts, validators, proxy tests, presenters, UI components, and editorial pages;
- promoted exactly 3 public tools to `ready`:
  - `dkim-checker`;
  - `dmarc-checker`;
  - `dnssec-checker`;
- public tool count is now 52;
- registry entry count remains 112;
- no weak microtools were added.

## Tests run

```text
npm test                     PASS — 214 total Node/Vitest tests
npm run verify:registry      PASS — 112 unique tools, 52 ready tools, no weak ready microtools
npm run lint                 PASS
npm run typecheck            PASS
npm run test:python          PASS — 142/142
npm run lint:python          PASS
npm run verify:python-lock   PASS — 30 locked packages matched installed packages for linux
```

`npm run build` was not counted as fully passed in the sandbox. The build compiled and TypeScript passed, but the process was interrupted by the sandbox timeout during static page generation at `Generating static pages (0/125)`. Run the full build locally before commit/push.

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
