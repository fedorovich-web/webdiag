# WebDiag Image Data URI Workbench Implementation Plan

**Goal:** Promote WD-107 as a bounded browser-local image delivery workbench and
avoid publishing WD-108 as a duplicate microtool.

## TDD and implementation

- [x] Add failing unit tests for media inference, byte-to-Data-URI conversion,
  placeholder geometry, and the 1 MiB bound.
- [x] Add failing registry and browser tests for exact/local outputs and mobile
  overflow.
- [x] Implement the bounded source Data URI and 24-pixel PNG placeholder UI.
- [x] Add RU/EN editorial content and promote both registry mirrors atomically.

## Verification

- [x] Run affected unit, registry, API parity, build, and browser tests.
- [x] Inspect real desktop/mobile results before catalog snapshot changes.
- [x] Record exact evidence, commit, and push the current feature branch.
