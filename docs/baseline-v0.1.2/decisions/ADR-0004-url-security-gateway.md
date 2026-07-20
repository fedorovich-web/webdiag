# ADR-0004: Mandatory URL Security Gateway

Status: accepted, P0

## Decision

All server-side URL/DNS/TLS/browser actions must resolve policy through one gateway/service layer.

## Rejected

- direct `httpx.get(user_url)`;
- tool-specific SSRF checks;
- validation only before first redirect;
- relying only on hostname denylist.

## Consequence

No server-side URL tool is publishable before gateway negative tests pass.
