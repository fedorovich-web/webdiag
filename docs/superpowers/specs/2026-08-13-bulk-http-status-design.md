# Bulk HTTP Status Checker Design

## Scope

Promote bulk-http-status-checker from the internal registry only after a real
backend contract, Next.js proxy, bilingual tool page, and regression tests exist.
This batch does not activate crawler, Chromium, or browser-only internal tools.

## API contract

POST /v1/tools/http-status/bulk accepts one to fifty public HTTP(S) URLs. The
response preserves input order and returns one bounded result per input. A
rejected or unreachable URL is an item-level failure so one bad target does not
erase successful checks. The response reports exact total, succeeded, and failed
counts; it does not infer uptime or availability.

Each successful item reuses the existing webdiag.tool.http_status.v1 result.
Each failed item exposes only a stable public error code and message. Fetching
uses SafeHttpFetcher, including DNS/IP validation, pinned peer verification,
redirect revalidation, body-free final inspection, timeouts, and redirect bounds.
The bulk policy uses a three-second network-operation timeout, at most two
redirects, and a fifteen-second batch deadline. Work that has not completed by
that deadline is returned explicitly as tool_batch_deadline_exceeded.

Execution uses a maximum of five worker threads and never creates work beyond the
fifty validated inputs. Duplicate inputs remain separate rows so order and counts
match the submitted batch.

## Web integration

The Next.js private route validates the batch shape, forwards only the URL array,
uses no-store, enforces bounded request and response buffers plus a bounded
timeout, and validates the complete upstream contract. The tool page uses the
existing visual system and only adds the form and result list required for
backend integration.

## Verification

Backend tests cover stable ordering, partial failure isolation, SSRF rejection,
validation bounds, and no response-body read. Web tests cover proxy validation,
upstream contract validation, and error normalization. Registry/content/renderer
parity gates must pass before the tool becomes public.
