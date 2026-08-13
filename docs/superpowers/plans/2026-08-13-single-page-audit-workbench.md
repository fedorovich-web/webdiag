# WebDiag Single-Page Audit Workbench Implementation Plan

**Goal:** Publish the existing bounded single-page audit as one complete,
honestly scoped tool without duplicating the backend engine or exposing raw
audit evidence.

## Contract and TDD

- [ ] Add RED tests for recommendation and affected-URL projection.
- [ ] Add RED tests for deterministic issue ordering and result states.
- [ ] Add RED renderer, registry, editorial, and browser tests.
- [ ] Expand the frontend-safe audit contract and keep raw evidence excluded.

## Product implementation

- [ ] Build the RU/EN single-page audit workbench on the existing audit client.
- [ ] Add dense responsive result styling using existing tokens.
- [ ] Add honest editorial content and promote WD-001 in both registry mirrors.
- [ ] Correct the tool-page processing label for composite server tools.

## Verification

- [ ] Run affected web, registry, API, build, and browser tests once per patch.
- [ ] Inspect real desktop/mobile and light/dark screenshots before baselines.
- [ ] Run the fresh relevant full verification, commit, push, and inspect CI.
- [ ] Keep anonymous abuse-rate/concurrency control recorded as a release gate.
