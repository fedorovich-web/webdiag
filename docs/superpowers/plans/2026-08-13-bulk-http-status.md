# Bulk HTTP Status Checker Implementation Plan

**Goal:** Ship one production-grade non-AI bulk diagnostic without weakening the
shared SSRF boundary or changing the site design.

## Backend

- [x] Add failing API tests for bounded batches, stable ordering, partial
  failures, and private-address rejection.
- [x] Add the bulk request/result models and endpoint by reusing the single-URL
  HTTP status contract and SafeHttpFetcher.
- [x] Run the targeted HTTP status tests once after the implementation.
- [x] Commit the backend contract as one logical patch.

## Web and registry

- [x] Add failing proxy/registry parity tests for the new public tool.
- [x] Add the private Next.js proxy, bilingual tool component/content, and
  registry descriptions.
- [x] Confirm the API reads the shared registry source through registry parity gates.
- [x] Run only the affected web/registry tests during development.
- [ ] Commit the public integration as a second logical patch.

## Completion gate

- [ ] Run one fresh affected backend and frontend verification set, lint,
  typecheck, registry verification, build, and diff check.
- [ ] Push the feature branch and update the existing Draft PR without merging,
  releasing, tagging, deploying, or enabling payments.
