# WebDiag A12.1b Alt Text Studio design

Date: 2026-08-13

Status: approved continuation of A12.1

Parent: `2026-08-12-webdiag-ai-first-five-design.md`

## 1. Objective

Deliver a real internal Alt Text Studio contract through a private image upload
and artifact boundary. The browser never supplies a remote image URL to the
worker. Image bytes never enter SQLite, JSON run input, logs, or a public URL.

The tool remains `internal` until a real provider smoke/eval/cost gate and fixed
credit price are approved. Lava.top and public activation remain excluded.

## 2. Upload API

`POST /v1/account/ai/uploads/image` accepts the authenticated request body as
raw bytes. `Content-Type` is required but is only a hint; the decoded format is
authoritative. Multipart parsing and filenames are intentionally absent.

The request middleware gives only this route a 4 MiB hard body limit. Other
account routes retain the existing 16 KiB limit. Responses are `no-store` and
return only upload ID, detected media type, normalized byte size, dimensions,
SHA-256, creation time, and expiry. Object keys and storage configuration are
never public.

Unbound uploads expire after 24 hours. Each account may hold at most ten active
uploads. Expired/pending deletions are cleaned in bounded batches. An upload can
be bound to exactly one run.

## 3. Image validation and normalization

The API accepts only JPEG, PNG, and WebP detected by Pillow with an explicit
format allowlist. Inputs are limited to 4 MiB, one frame, at most 8192 pixels on
either side, and at most 8,000,000 decoded pixels.

Validation sequence:

1. Reject empty/oversized bytes before Pillow.
2. Open with the explicit format allowlist while converting Pillow
   decompression-bomb warnings to errors.
3. Check detected format, dimensions, frame count, and pixel budget.
4. Call `verify()`.
5. Reopen, apply EXIF orientation, fully `load()`, and recheck dimensions.
6. Re-encode to the detected JPEG/PNG/WebP format without EXIF, XMP, ICC,
   comments, or other metadata.
7. Reject a normalized result that exceeds 4 MiB; compute the stored SHA-256
   over normalized bytes.

This removes embedded GPS/identity metadata before object storage and provider
transmission. Filename extensions and client MIME values are never trusted.

## 4. Storage

`ArtifactStorage` receives opaque IDs and normalized bytes and returns an
opaque key plus exact media type, size, and SHA-256.

- Development/tests: bounded local filesystem storage under an explicit root,
  using random object names, atomic replace, path-confinement checks, and no
  served directory.
- Production: private S3-compatible bucket through Boto3 with HTTPS endpoint,
  explicit bucket/prefix, no public ACL or presigned URL, bounded reads, exact
  `ContentLength`, and optional allowlisted server-side encryption settings.

Production configuration cannot fall back to local storage. API and worker use
the same private bucket configuration. Compose development uses a shared private
volume; it is not mounted into the web container.

## 5. Persistence and ownership

`ai_uploads` stores ID, owner, opaque object key, media type, normalized byte
size, dimensions, SHA-256, timestamps, optional bound run ID, and deletion
state. It stores no image bytes, filename, EXIF, account email, or provider key.

Alt Text run input accepts `locale`, canonical upload UUID, bounded page
context, bounded surrounding text, and purpose (`informative`, `decorative`, or
`unknown`). Run creation resolves the owned unexpired upload and atomically
binds it while inserting the run and reserving credits. Missing, expired,
already-bound, and foreign uploads use ownership-safe errors.

The worker claim contains only media type, object key, size, SHA-256, dimensions,
locale/context, and the existing opaque safety identifier. The worker reads with
a hard bound and verifies size/digest before any provider call.

## 6. Provider contract

OpenRouter Chat Completions receives one `image_url` data URL with `detail="low"`
and a JSON text block containing only supplied context. The only allowlisted
model is `openai/gpt-5.6-luna`; the browser cannot select a model. The request
requires structured-output support, zero data retention, denied provider data
collection, and disabled provider fallbacks. The server-owned prompt forbids
identifying unknown people,
inferring protected traits, inventing context, SEO/ranking promises, or
describing hidden metadata.

Structured output contains:

- `alt_text`: 0–300 characters;
- `decorative`: boolean;
- `rationale`: 1–500 characters.

If `decorative` is true, `alt_text` must be empty. Otherwise it must be nonempty.
FastAPI validates the output again before credit capture.

## 7. Failure and retention behavior

Invalid upload, missing object, digest mismatch, expiry before submission, or
storage read failure known to occur before an OpenRouter request is a known-safe
failure and releases credits. Ambiguous OpenRouter outcomes remain
`provider_unknown` and are never automatically resubmitted.

Input deletion is idempotent. Terminal runs mark their bound upload for deletion;
bounded cleanup removes the object and finalizes the tombstone. A failed delete
does not restore user access and is retried later. Financial rows remain.

## 8. Verification

TDD coverage includes body-route limits, MIME spoofing, corrupt/truncated files,
decompression bombs, excessive dimensions/pixels, animation, metadata removal,
normalized-size overflow, traversal, local/S3 bounded reads, S3 private request
shape, upload ownership/expiry/quota/binding races, object digest mismatch,
vision request shape, RU/EN output, unknown-person constraints, and deletion
retry state.

Ordinary CI uses generated in-memory images, local storage, and HTTP fakes. It
makes no S3 or OpenRouter network request.

## 9. Verified references

- Pillow 12.1.0 documentation and source via Context7:
  https://pillow.readthedocs.io/en/stable/reference/Image.html
- Boto3 S3 documentation via Context7:
  https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html
- OpenRouter structured outputs and provider routing documentation:
  https://openrouter.ai/docs/guides/features/structured-outputs
- OpenRouter GPT-5.6 Luna model page:
  https://openrouter.ai/openai/gpt-5.6-luna-20260709
