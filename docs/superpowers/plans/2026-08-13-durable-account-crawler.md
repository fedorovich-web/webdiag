# Durable Account Crawler Implementation Plan

- [x] Add RED config, storage lifecycle, ownership, lease, and digest tests.
- [x] Add strict versioned API models and durable SQLite crawl job storage.
- [x] Add account create/list/detail routes and an internal atomic run-one route.
- [x] Add the no-proxy, no-redirect scheduler bridge without exposing its token to the general worker.
- [x] Update Docker production wiring with a distinct crawler internal token.
- [x] Implement and verify the bounded crawl executor before any registry promotion.
- [x] Add the RU/EN account result UI, polling states, browser coverage, and visual QA.
- [x] Run the fresh full verification and commit the completed crawler foundation.
- [ ] Promote crawler registry entries only with truthful account-owned capability boundaries.
