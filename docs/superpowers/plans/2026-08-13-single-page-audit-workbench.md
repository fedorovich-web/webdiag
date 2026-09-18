# WebDiag Single-Page Audit Workbench Implementation Plan

**Goal:** Publish the existing bounded single-page audit as one complete,
honestly scoped tool without duplicating the backend engine or exposing raw
audit evidence.

## Contract and TDD

- [x] Add RED tests for recommendation and affected-URL projection.
- [x] Add RED tests for deterministic issue ordering and result states.
- [x] Add RED renderer, registry, editorial, and browser tests.
- [x] Expand the frontend-safe audit contract and keep raw evidence excluded.

## Product implementation

- [x] Build the RU/EN single-page audit workbench on the existing audit client.
- [x] Add dense responsive result styling using existing tokens.
- [x] Add honest editorial content and promote WD-001 in both registry mirrors.
- [x] Correct the tool-page processing label for composite server tools.

## Verification

- [x] Run affected web, registry, API, build, and browser tests once per patch.
- [x] Inspect real desktop/mobile and light/dark screenshots before baselines.
- [x] Run the fresh relevant full verification.
- [ ] Commit, push, and inspect CI.
- [x] Keep anonymous abuse-rate/concurrency control recorded as a release gate.
