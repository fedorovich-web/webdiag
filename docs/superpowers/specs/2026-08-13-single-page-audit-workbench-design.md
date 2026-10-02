# WebDiag Single-Page Audit Workbench Design

Date: 2026-08-13
Scope: publish WD-001 by exposing the existing bounded single-page audit as a
complete public tool workflow. This does not introduce a second audit engine.

## Factual capability boundary

The existing `POST /v1/audits` service accepts one public HTTP or HTTPS URL,
performs a bounded SSRF-protected fetch, and inspects the returned static HTML.
It also requests the target origin's `robots.txt` and one discovered or default
`sitemap.xml`. The current report contains 13 checks covering HTTP response,
redirects, HTML content type, title, description, H1, canonical, robots meta,
Open Graph, JSON-LD, security headers, robots.txt, and sitemap discovery.

It is not a crawler, browser renderer, Lighthouse run, accessibility audit, or
runtime JavaScript analysis. A successful result is a point-in-time observation
of the fetched responses. The computed score is the existing deterministic
issue-severity score; it is not traffic, ranking, Core Web Vitals, or uptime.

## Public data contract

Extend the existing frontend-safe audit projection with:

- affected public URLs reduced to normalized/final URL strings;
- recommendation summary, ordered steps, and expected impact;
- all existing checks and issues already returned by the audit run.

Do not expose raw evidence, response headers, backend metadata dictionaries,
tool mapping internals, storage digests, database identifiers beyond the
existing job/run IDs, or exception details. Unknown or malformed upstream
shapes remain a 502 contract error.

## UX

The tool page uses one URL form followed by a compact executive result:

- target, score, issue count, check count, highest severity, and completion time;
- issues ordered by P0-P3, then severity, with affected URLs and recommendations;
- a dense checks section grouped by status;
- an explicit scope note that distinguishes static single-page inspection from
  crawling and browser/runtime measurements.

Loading, error, and empty-success states are rendered in the same result region
with `aria-live`. Submitted and returned text stays inert React text. RU and EN
share the same result structure. Mobile uses full-width controls and no
horizontal overflow; existing project tokens are reused without adding tokens.

## Security and operational boundary

The browser calls the existing same-origin Next proxy. The proxy validates the
minimal request envelope, enforces its timeout, disables caching, validates the
complete upstream contract, and returns only the frontend-safe projection. The
backend remains authoritative for URL validation, DNS/IP/peer checks, redirect
limits, decompression/body limits, and report construction.

Anonymous request-rate and concurrency controls are a separate release gate.
WD-001 may be made visible in the catalog only with an explicit in-product
bounded-run warning; production release remains blocked until an app-layer
abuse budget is implemented and verified. This patch does not describe the
endpoint as abuse-resistant.

## Verification

TDD covers the expanded safe projection, rejection of incomplete nested data,
issue ordering, empty/error behavior, inert untrusted text, RU/EN, mobile
overflow, renderer/registry parity, and absence of raw evidence in the public
response. Real desktop and mobile screenshots are inspected before catalog
visual baselines are accepted.
