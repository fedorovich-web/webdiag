# WebDiag backend production-readiness design

## Factual baseline

- Source baseline: `origin/recovery/a11.5-github-baseline` at `3bb8b36e1e3330adf95355b68ad94aaffb6297bd`.
- GitHub Draft PR #2 targets `main`; both current `WebDiag CI` runs for the baseline SHA pass. The latest prior failure was Python Ruff/import-order debt and is fixed in the baseline.
- FastAPI exposes account/session, project/saved-audit/issues, monitoring, reports/sharing, public audit, and tool routes. The account domains persist to one SQLite file; public audit job/run lookup remains process-local.
- Account passwords use bounded scrypt parameters with random salts. Session tokens are random, stored as SHA-256 hashes, expire, are evicted per user, and are delivered through HttpOnly/Lax cookies; production configuration requires Secure cookies.
- Projects, audits, monitors, runs, reports, and report shares are ownership-scoped in service queries. Saved audit and monitoring payloads exclude raw evidence and are size/history bounded.
- Monitoring uses an atomic SQLite due claim and a 15-minute lease, but run completion does not prove ownership of that lease. A stale worker can therefore persist a result after its lease was cleared or reassigned.
- Reports store immutable JSON snapshots and hash-only share tokens. HTML escaping and response security headers are present. The artifact SHA-256 is calculated in tests but is not persisted or verified against stored content.
- Registry verification reports 125 unique tools. The public release script and current policy docs still hardcode 110.
- Fresh local backend baseline: 225 Python tests pass; Ruff and Python lock verification pass. Fresh `npm audit` reports 6 known vulnerabilities (1 moderate, 5 high), including direct Next.js advisories.

## Architecture changes

1. Make release readiness derive its count from the registry itself while retaining uniqueness and all-ready gates. Historical changelog entries remain unchanged.
2. Canonicalize public URL authorities once in the shared URL policy: IDNA ASCII hostnames, bracketed IPv6 literals, and omission of scheme-default ports. Project duplicate protection then operates on the canonical origin.
3. Make every monitor execution lease-owned. Both scheduled and manual runs acquire a lease; completion atomically verifies the token. Pause/update invalidates an in-flight lease, and stale workers cannot persist a run or reschedule a paused monitor.
4. Persist the exact report artifact SHA-256, migrate existing report rows by deterministic backfill, and verify it whenever a snapshot is materialized for detail/public/export use.
5. Upgrade vulnerable existing JavaScript dependencies only to versions identified by the package advisory resolver, then rerun the complete frontend/build/browser gates.

## Data and API compatibility

- Existing account API response versions remain unchanged. Artifact hashes and lease tokens remain internal and are never added to public responses.
- SQLite changes are additive and must migrate an existing A11.5 database in place. No destructive table rebuild is permitted.
- Invalid account request envelopes and ownership-hiding 404 behavior remain stable.

## Verification design

- Each behavioral defect gets a regression test observed failing before implementation.
- Targeted Python and Node tests run after each batch.
- Final evidence is `npm run verify:local`, plus dependency audit and Docker configuration validation where the environment supports them.

## Explicit remaining architecture decision

The public `/v1/audits` job store is process-local and synchronous. Replacing it with durable queued execution changes the public execution model and requires a separate API/job-state migration design. This branch will not pretend that process-local lookup is durable; if it cannot be migrated without changing the recovered contracts, it remains a documented release blocker rather than a fabricated production capability.
