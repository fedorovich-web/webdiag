# Release Registry Supersession Implementation Plan

**Goal:** distinguish verified legacy aliases from actual implementation gaps without
weakening the public release gate.

- [x] Add RED release-gate and typed registry tests.
- [x] Add validated `supersededBy` semantics.
- [x] Mark only seven factually consolidated browser/safe-fetch definitions.
- [x] Synchronize frontend and backend registry copies.
- [x] Run one fresh relevant full verification, commit, push, and inspect CI.
