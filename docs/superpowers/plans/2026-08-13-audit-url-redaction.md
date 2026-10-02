# Audit URL Redaction Implementation Plan

**Goal:** keep functional query URLs during execution while preventing audit snapshots
and persistence from retaining credential-like URL components.

- [x] Add RED typed redaction and API persistence tests.
- [x] Implement a typed audit snapshot URL projection.
- [x] Apply projection before first persistence and on snapshot reads.
- [x] Run targeted tests and security lint.
- [x] Run one fresh relevant full verification, commit, push, and inspect CI.
