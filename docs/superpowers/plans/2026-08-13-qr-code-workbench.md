# WebDiag QR Code Workbench Implementation Plan

**Goal:** Publish one bounded browser-local QR generation and reading workflow
without exposing a duplicate decoder card.

## TDD and implementation

- [ ] Add RED helper and encode/decode round-trip tests.
- [ ] Add RED registry and browser tests for local, inert, mobile-safe output.
- [ ] Install the verified zero-runtime-dependency QR package and repeat audit.
- [ ] Implement PNG generation, local raster decoding, and safe output UI.
- [ ] Add RU/EN editorial content and promote WD-099 in both registry mirrors.

## Verification

- [ ] Run affected unit, registry, API parity, build, and browser tests.
- [ ] Inspect real RU/EN desktop, mobile, and dark results before baselines.
- [ ] Record exact evidence, commit, push, and inspect CI.
