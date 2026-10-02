# WebDiag A12.1b Alt Text Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private validated image intake, owned artifact binding, and a grounded OpenRouter vision contract for Alt Text Studio.

**Architecture:** FastAPI normalizes raw uploads and stores bytes outside SQLite; run creation atomically binds an owned upload. The worker integrity-checks the private object and sends one bounded image input to the OpenRouter Chat Completions adapter. Production uses S3-compatible storage and cannot fall back to local disk.

**Tech Stack:** Python 3.13/3.14, FastAPI, SQLite, Pillow, Boto3, HTTPX, OpenRouter Chat Completions, Dramatiq, pytest, Ruff.

**Implementation status:** Completed on 2026-08-13. Exact verification is recorded
in the design document and `CHANGELOG.md`; public activation remains gated on a
real provider evaluation, measured cost, and production S3 configuration.

## Global Constraints

- 4 MiB encoded limit; one frame; maximum 8192 per side and 8,000,000 pixels.
- JPEG, PNG, and WebP only; decode and re-encode without metadata.
- No remote URL fetch, multipart filename, base64 in SQLite, public object URL, presigned URL, or web-container mount.
- Lava.top, public activation, visual redesign, release, tag, deployment, and merge are excluded.
- Ordinary tests use no real OpenRouter or S3 request.

---

### Task 1: Pin and audit image/storage dependencies

**Files:**
- Modify: `apps/api/pyproject.toml`
- Modify: `apps/worker/pyproject.toml`
- Modify: `requirements-dev.lock.txt`

**Interfaces:**
- Produces: pinned Pillow and Boto3 dependencies compatible with Python 3.14.

- [ ] Resolve exact stable versions from package metadata.
- [ ] Dry-run the dependency graph and query OSV for every new package/version.
- [ ] Pin dependencies, install through the existing constraint workflow, and verify the lock once.
- [ ] Commit `build(ai): pin private image dependencies`.

### Task 2: Normalize untrusted image bytes

**Files:**
- Create: `apps/api/src/webdiag_api/ai/images.py`
- Test: `apps/api/tests/test_ai_images.py`

**Interfaces:**
- Produces: `normalize_image(data: bytes) -> NormalizedImage` with media type, bytes, width, height, pixel count, and SHA-256.

- [ ] Write one failing group for valid JPEG/PNG/WebP, spoofed MIME independence, corruption, animation, dimensions/pixels, decompression warning, metadata removal, and normalized overflow.
- [ ] Observe the targeted RED.
- [ ] Implement allowlisted open, verify, reopen/load, EXIF transpose, metadata-free encoding, and exact bounds.
- [ ] Run the targeted GREEN and commit `feat(ai): normalize private image uploads`.

### Task 3: Implement bounded local and S3 storage

**Files:**
- Modify: `apps/api/src/webdiag_api/ai/artifacts.py`
- Create: `apps/api/src/webdiag_api/ai/artifact_storage.py`
- Create: `apps/worker/src/webdiag_worker/artifact_storage.py`
- Test: `apps/api/tests/test_ai_artifact_storage.py`
- Test: `apps/worker/tests/test_artifact_storage.py`

**Interfaces:**
- Produces: `LocalArtifactStorage`, `S3ArtifactStorage`, and environment factories in API/worker.
- Consumes: normalized bytes and opaque upload IDs.

- [ ] Write failing path-confinement, atomic local put, bounded read, hash, idempotent delete, S3 HTTPS/config, private put, ContentLength, bounded StreamingBody, and delete tests.
- [ ] Implement API storage and matching read/delete worker boundary.
- [ ] Run targeted tests and commit `feat(ai): add private artifact storage`.

### Task 4: Persist owned uploads and atomic binding

**Files:**
- Modify: `apps/api/src/webdiag_api/ai/storage.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Test: `apps/api/tests/test_ai_upload_storage.py`

**Interfaces:**
- Produces: upload create/get/bind/delete-state methods and `StoredAIUpload`.
- Extends: run creation with optional `source_upload_id` bound in the same `BEGIN IMMEDIATE` transaction.

- [ ] Write failing tests for owner scope, 24-hour expiry, ten-upload quota, foreign/missing parity, one-run binding, idempotent replay, concurrent binding, and deletion states.
- [ ] Add additive `ai_uploads` migration, indexes, constraints, and atomic binding.
- [ ] Run targeted storage/service tests and commit `feat(ai): persist owned image uploads`.

### Task 5: Add raw upload route and route-specific body limit

**Files:**
- Modify: `apps/api/src/webdiag_api/config.py`
- Modify: `apps/api/src/webdiag_api/security/request_limits.py`
- Modify: `apps/api/src/webdiag_api/ai/models.py`
- Modify: `apps/api/src/webdiag_api/ai/api.py`
- Test: `apps/api/tests/test_api.py`
- Test: `apps/api/tests/test_account_ai_upload_api.py`

**Interfaces:**
- Produces: `POST /v1/account/ai/uploads/image` raw-body endpoint and `webdiag.ai.upload.v1` response.

- [ ] Write failing exact/over-limit streamed body tests proving other account routes remain 16 KiB.
- [ ] Write failing authentication, content-type hint, normalization, no-store, quota, IDOR, storage compensation, and no-object-key response tests.
- [ ] Implement the dedicated 4 MiB middleware branch and upload service route.
- [ ] Run targeted middleware/upload tests and commit `feat(api): add private AI image intake`.

### Task 6: Add Alt Text input/output and object resolver

**Files:**
- Modify: `apps/api/src/webdiag_api/ai/tool_contracts.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Modify: `apps/api/src/webdiag_api/ai/storage.py`
- Test: `apps/api/tests/test_ai_alt_text_contract.py`

**Interfaces:**
- Extends: input/output validation and run creation snapshot/binding for `ai_alt_text_studio`.

- [ ] Write failing strict RU/EN, UUID, context, purpose, owner/expiry/binding, descriptor redaction, and decorative-output tests.
- [ ] Implement validated object descriptor snapshot and atomic binding.
- [ ] Run targeted tests and commit `feat(ai): bind uploads to alt text runs`.

### Task 7: Add vision execution and cleanup states

**Files:**
- Modify: `apps/worker/src/webdiag_worker/openai_provider.py`
- Modify: `apps/worker/src/webdiag_worker/tool_contracts.py`
- Modify: `apps/worker/src/webdiag_worker/ai.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Modify: `apps/api/src/webdiag_api/ai/storage.py`
- Test: `apps/worker/tests/test_openai_provider.py`
- Test: `apps/api/tests/test_ai_upload_cleanup.py`

**Interfaces:**
- Produces: one digest-checked `image_url` data URL with `detail="low"` and typed Alt Text output.
- Produces: terminal deletion-pending and bounded idempotent cleanup.

- [ ] Write failing object missing/oversize/hash, vision request, unknown-person instruction, RU/EN, decorative invariant, and cleanup retry tests.
- [ ] Implement storage read before mark-submitted, vision request, typed output, and terminal cleanup state transitions.
- [ ] Run targeted tests and commit `feat(worker): execute private alt text runs`.

### Task 8: Compose, fixtures, and package verification

**Files:**
- Modify: `docker-compose.yml`
- Modify: `apps/api/Dockerfile`
- Modify: `apps/worker/Dockerfile`
- Modify: `apps/api/tests/fixtures/ai/a12_1a_contract_cases.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/specs/2026-08-13-webdiag-ai-alt-text-design.md`

**Interfaces:**
- Produces: private shared development volume and RU/EN alt-text fixture evidence.

- [ ] Add the private API/worker-only volume and environment configuration.
- [ ] Add RU/EN invariant fixtures without exact-prose assertions.
- [ ] Run the A12.1b targeted aggregate once.
- [ ] Run one affected Python suite, Ruff, lock, Docker Compose config, and diff check.
- [ ] Record exact results and blockers; keep the catalog internal.
- [ ] Commit `docs(ai): record A12.1b verification`, push, and update Draft PR without merge/release/deploy.
