# Public OpenAPI boundary

## Problem

The shared `/openapi.json` described eight bearer-protected operational routes
used by WebDiag workers. Authentication was enforced at runtime, but public API
consumers did not need worker claim, lease, completion, cleanup, crawl, or
monitoring scheduler contracts.

## Decision

Keep every internal route, URL, request model, response model, and bearer check
unchanged. Mark the dedicated AI and crawl routers as excluded from OpenAPI and
exclude the one monitoring route that shares an account router.

The public schema must still include ordinary public and authenticated account
contracts. A regression test loads the real application schema and rejects every
path below `/v1/internal/`.

This is documentation-surface reduction, not an authorization mechanism. The
existing internal tokens remain mandatory and continue to be tested directly.
