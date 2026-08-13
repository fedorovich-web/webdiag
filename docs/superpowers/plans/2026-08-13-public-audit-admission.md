# WebDiag Public Audit Admission Implementation Plan

**Goal:** add an abuse-resistant backend execution budget for anonymous audits
without trusting unverified proxy headers or limiting authenticated workflows.

- [ ] Add RED controller tests for rate, concurrency, persistence, and expiry.
- [ ] Add RED API tests for 429/503 and release-on-error behavior.
- [ ] Implement atomic SQLite admission and stable errors.
- [ ] Add bounded configuration and wire only public audit creation.
- [ ] Run targeted security tests, then fresh relevant full verification.
- [ ] Commit, push, and inspect Draft PR CI.
