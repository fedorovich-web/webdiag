# WebDiag Generated Artifact Staging Implementation Plan

**Goal:** Make generated-image persistence reconcilable when storage succeeds
but internal completion is lost or fails.

## Contracts and persistence

- [ ] Add failing API tests for image-only claim reservations, reuse, exact
  completion matching, failure cleanup, and committed-object preservation.
- [ ] Add the additive reservation table and store transitions.
- [ ] Include the private reservation only in the internal image claim.

## Worker and storage

- [ ] Add failing worker tests that reject missing/malformed reservations and
  require the provider to write the exact reserved key.
- [ ] Add bounded exact-key writes to local and S3 worker storage.
- [ ] Remove worker-generated image IDs and keys.
- [ ] Reconcile ambiguous completion through the provider-unknown transition
  without retrying the provider request.

## Verification

- [ ] Run the targeted API/worker artifact suites once from red to green.
- [ ] Run one consolidated affected Python suite, Ruff, lock verification, and
  `git diff --check`.
- [ ] Record exact verification evidence, commit the bounded batch, and push
  the existing feature branch to Draft PR #3.

