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
