# AI artifact ownership-before-storage boundary

## Problem

Artifact download authenticated the account but initialized artifact storage
before proving that the requested run and artifact belonged to that account. A
missing or foreign UUID could therefore expose storage availability instead of
the established ownership-hiding `ai_artifact_not_found` response.

## Decision

Resolve session identity, then verify the exact `(user_id, run_id, artifact_id)`
relationship before FastAPI initializes artifact storage. Only an authorized
artifact request can reach storage configuration and object reads.

The service repeats the same indexed ownership lookup in `read_artifact` before
reading bytes. This keeps ownership enforcement inside the domain boundary for
non-HTTP callers and retains all digest, byte-size, media-type, and normalized
image integrity checks.

Missing and foreign artifacts return the same non-cacheable 404. Authorized
artifacts with unavailable or corrupted storage retain the existing private 500
contract.
