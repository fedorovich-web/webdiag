# WebDiag Generated Artifact Staging Design

## Problem

The image worker currently writes a generated object before the API commits the
corresponding `ai_artifacts` row. If the object write succeeds and the internal
completion request fails before the database transaction commits, cleanup has
no durable object key to reconcile. Deleting the object immediately after an
ambiguous completion failure is also unsafe because the completion transaction
may have committed and only its response may have been lost.

## Decision

Reserve one opaque artifact ID and one private object key in SQLite before an
image provider request can write an object. The reservation is created after a
run is claimed and before the claim is returned to the worker. Text tools do not
receive a reservation.

The worker must write the normalized image to that exact reserved key. It may
not generate a replacement ID or key. Completion accepts an image artifact only
when its ID, object key, run, and owner match the active reservation. The final
artifact insert, run success, credit capture, and reservation transition to
`committed` occur in one SQLite transaction.

## Persistence

Add `ai_artifact_reservations` with one row per run. A row contains the artifact
ID, run ID, owner ID, exact object key, creation time, and one of four states:
`reserved`, `pending`, `committed`, or `deleted`.

- `reserved` means a worker may write or may already have written the object.
- `pending` means the run ended without committing the artifact and cleanup may
  delete the exact key.
- `committed` means the matching `ai_artifacts` row owns the object.
- `deleted` records successful idempotent cleanup.

Reclaimed unsubmitted runs reuse their existing reservation and exact key.
Failed, provider-unknown, or deleted runs move an uncommitted reservation to
`pending`. Cleanup processes pending reservations and pending final artifacts
under the existing bounded internal cleanup contract.

## Storage contract

The worker storage adapter gains an exact-key write operation. Local storage
retains atomic temporary-file replacement and private file permissions. S3
retains private ACL, bounded content length, the configured prefix allowlist,
and proxy-isolated Botocore configuration. Arbitrary worker-supplied keys remain
rejected by the existing prefix and 64-hex-token pattern.

The API setting `WEBDIAG_AI_ARTIFACT_PREFIX` becomes the source for reservation
keys. API and worker deployments must therefore use the same configured prefix,
which is already required for reads and cleanup.

## Failure rules

- Provider or storage failure before completion moves the reservation to
  `pending` through the existing fail endpoint.
- Invalid provider output may delete the exact object as compensation before
  marking the run failed; bounded cleanup remains the retry path.
- A completion request failure is treated as ambiguous. The worker attempts the
  existing provider-unknown transition. If completion already committed, that
  transition cannot replace the succeeded run or delete its committed object.
- No submitted provider request is automatically retried.

## Security boundaries

Reservation keys cross only the bearer-protected internal worker API. Public
run output continues to expose only artifact ID, media type, byte size, and
digest. The browser cannot choose an object key, artifact ID, provider, or
storage backend. Completion revalidates object bytes, normalized media type,
size, digest, run ownership, and the exact reservation before persistence.

