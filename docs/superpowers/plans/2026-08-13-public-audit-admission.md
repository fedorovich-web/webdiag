# WebDiag Public Audit Admission Implementation Plan

**Goal:** add an abuse-resistant backend execution budget for anonymous audits
without trusting unverified proxy headers or limiting authenticated workflows.

- [x] Add RED controller tests for rate, concurrency, persistence, and expiry.
- [x] Add RED API tests for 429/503 and release-on-error behavior.
- [x] Implement atomic SQLite admission and stable errors.
- [x] Add bounded configuration and wire only public audit creation.
- [x] Run targeted security tests, then fresh relevant full verification.
- [ ] Commit, push, and inspect Draft PR CI.
