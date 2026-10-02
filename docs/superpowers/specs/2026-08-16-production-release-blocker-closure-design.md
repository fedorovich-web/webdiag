# Production release blocker closure design

Date: 2026-08-16

## Context

WebDiag's non-AI registry and account workspace are functionally complete, but
three independently releasable boundaries remain before a production handoff:

1. persisted audits and reports contain canonical English evidence while the
   surrounding RU interface presents some of that evidence verbatim;
2. tool workbenches can display arbitrary `Error.message` values instead of a
   bounded localized user-error contract;
3. the production Compose profile requires the optional AI runtime even though
   no AI tool is publicly enabled.

The changes in this stage must not rewrite stored audit snapshots, weaken their
digests, expose provider or internal errors, or imply that AI has passed the
still-outstanding provider, price, artifact-storage, and manual image gates.

## Decision 1: immutable evidence, localized presentation

Saved audit payloads and report snapshots remain canonical immutable evidence.
Their stored JSON and digests are not migrated or rewritten. A server-side
presentation layer derives localized copies only after ownership and integrity
checks have succeeded.

Known check and issue identifiers map to explicit RU and EN presentation
records. Tests require the catalog to cover the complete current audit taxonomy.
Unknown identifiers fail open to the stored safe text so older evidence remains
readable. Status and category labels are presentation-only and retain their
existing machine values in API contracts.

Authenticated audit endpoints accept a bounded `locale=ru|en` query and Next.js
proxies forward it. Report presentation uses the locale already stored in the
report snapshot. A public share URL may carry a locale hint only for loading and
error shells; a valid snapshot remains authoritative. HTML, print, and public
renderers consume the same derived presentation and retain existing escaping,
token, ownership, and content-security boundaries.

## Decision 2: bounded tool error presentation

Tool workbenches receive one shared presentation boundary. It renders only:

- allowlisted stable error codes returned by existing typed API errors;
- local `ToolUserError` instances with bounded parameters;
- a generic localized fallback for every unknown value.

Arbitrary `Error.message`, response bodies, stack traces, provider messages, and
internal exception details are never shown. Local validators replace visible
English exception strings with stable codes. A source-level regression gate
prevents reintroducing raw caught-message rendering across tool components.

The migration is divided into API-backed, media/browser, and structured/text
tool groups so each group has one focused RED and one focused GREEN run.

## Decision 3: production core with opt-in AI overlay

The default production profile is the product currently available to users:
web, API, and the monitoring/crawler scheduler. It needs neither RabbitMQ,
OpenRouter, S3 artifact credentials, nor AI internal secrets.

`WEBDIAG_AI_RUNTIME_ENABLED=false` is the default. Production settings require
AI internal and safety secrets only when the flag is true. Public AI tools remain
unavailable independently of this runtime switch.

An additive AI Compose overlay introduces RabbitMQ, the AI worker, private S3
artifact configuration, OpenRouter configuration, and the internal AI token.
Both the core and combined profiles get separate fail-closed preflight scripts
and synthetic CI checks. Enabling the overlay is an operator action that remains
blocked until the documented external evaluation, cost, storage, and image
review evidence is approved.

## Verification and release boundary

Each subsystem follows test-first implementation and one targeted verification
per completed group. The final gate includes the affected frontend and backend
packages, production Compose preflights, lint/type/build checks, `git diff
--check`, and real RU/EN desktop/mobile/dark browser inspection.

Passing these checks means the existing Draft PR is ready for an operator
handoff. It does not authorize merge, release, deployment, DNS/TLS changes,
provider calls, payment activation, or AI activation.
