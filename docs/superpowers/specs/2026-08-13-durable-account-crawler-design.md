# Durable Account Crawler Design

## Goal

Add the durable, account-owned execution boundary required by the remaining whole-site,
duplicate-metadata, and orphan-page capabilities. The crawler is account-owned rather than
an anonymous public endpoint, and registry promotion remains separate from this foundation.

## Ownership and transport

- A signed-in user creates a crawl job only for an active project they own.
- The account API stores the project origin and crawl job in the existing account SQLite
  database. Browser responses never expose `user_id`, lease tokens, or internal errors.
- The dedicated scheduler polls a bearer-protected internal `run-one` endpoint. Public session cookies,
  project origins, page URLs, results, and lease tokens are never forwarded to the scheduler or
  broker. The general Dramatiq worker does not receive the crawler credential.
- The API atomically claims one job, executes it through the existing audited SSRF-safe
  fetcher, and persists a bounded result or stable failure code. This deliberately keeps the
  network security gateway and all durable state API-owned instead of duplicating the fetcher
  inside the scheduler image.
- Internal HTTP clients disable ambient proxies, reject redirects, validate a clean API
  origin, cap response bodies, and never log bearer values.

## Job lifecycle

`queued -> running -> succeeded | failed`

- one active crawl job per project;
- lease-based claim with atomic compare-and-update;
- expired running leases can be reclaimed;
- completion/failure requires the exact active lease token;
- client list/detail queries always filter by both `user_id` and `project_id`;
- persisted result JSON is bounded, schema-validated, and protected by SHA-256 digest.

## Initial bounds

The contract carries server-owned limits only. Client input cannot choose them.

- maximum 25 HTML pages per job;
- maximum 500 KiB decoded HTML per page;
- maximum 60 seconds of crawl execution;
- same-origin HTTP(S) URLs only;
- queries, fragments, and userinfo are excluded from stored URLs;
- no JavaScript execution, authentication, form submission, port scan, or arbitrary file
  download.

These limits are configuration with validated production defaults, not marketing claims.

## Release boundary

This foundation leaves all three crawler registry entries internal. Its executor and account
UI prove crawl-budget enforcement, SSRF/redirect boundaries, robots handling, duplicate
grouping, orphan reconciliation, RU/EN states, and browser behavior. A separate registry
patch must preserve these capability boundaries and cannot describe the bounded result as a
complete crawl of every page.
