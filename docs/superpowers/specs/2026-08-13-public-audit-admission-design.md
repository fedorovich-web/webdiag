# WebDiag Public Audit Admission Design

Date: 2026-08-13
Scope: protect anonymous `POST /v1/audits` execution with a persistent request
budget and cross-process concurrency leases.

## Boundary

Admission applies only to the public audit creation endpoint. Reading an
existing snapshot, authenticated project audits, and internal monitoring do not
consume this anonymous budget. URL validation, SSRF policy, body limits, and
audit execution remain unchanged and authoritative after admission.

The limiter does not use `X-Forwarded-For` or other forwarding headers because
the repository has no verified trusted-proxy configuration. A global budget is
less granular than an identity-based limit, but it cannot be bypassed by forged
client headers and it protects the finite audit execution pool.

## Persistence and atomicity

SQLite stores one rolling-window counter and expiring execution leases in the
existing audit database. `BEGIN IMMEDIATE` serializes admission across API
workers:

1. delete expired leases;
2. reject when active leases reach the configured concurrency limit;
3. reset an expired request window or reject an exhausted one;
4. increment the window count and insert a unique lease in one transaction.

Every admitted endpoint execution releases its lease in `finally`. Lease expiry
recovers capacity after worker termination. Failed admission does not create an
audit job and does not consume a request slot when capacity is already full.

## API contract

- exhausted request window: HTTP 429, `audit_rate_limited`;
- exhausted concurrent capacity: HTTP 503, `audit_capacity_unavailable`;
- both include `Cache-Control: no-store` and integer `Retry-After`;
- responses expose no database paths, counters, lease IDs, or internal errors.

Defaults are configurable environment settings, not product usage claims:
60 admitted public audits per 60-second window, four concurrent executions, and
a 45-second stale-lease TTL. Release configuration may lower these values.

## Verification

Tests cover atomic capacity, persistent counters across controller instances,
window reset, stale-lease recovery, exact 429/503 contracts, and lease release
after both successful and failed audit execution.
