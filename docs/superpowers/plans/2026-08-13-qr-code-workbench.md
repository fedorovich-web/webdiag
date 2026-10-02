# WebDiag QR Code Workbench Implementation Plan

**Goal:** Publish one bounded browser-local QR generation and reading workflow
without exposing a duplicate decoder card.

## TDD and implementation

- [x] Add RED helper and encode/decode round-trip tests.
- [x] Add RED registry and browser tests for local, inert, mobile-safe output.
- [x] Install the verified zero-runtime-dependency QR package and repeat audit.
- [x] Implement PNG generation, local raster decoding, and safe output UI.
- [x] Add RU/EN editorial content and promote WD-099 in both registry mirrors.

## Verification

- [x] Run affected unit, registry, API parity, build, and browser tests.
- [x] Inspect real RU/EN desktop, mobile, and dark results before baselines.
- [x] Record exact evidence, commit, push, and inspect CI.
