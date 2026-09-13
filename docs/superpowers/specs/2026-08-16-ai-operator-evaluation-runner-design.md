# WebDiag operator AI evaluation runner design

Date: 2026-08-16

Status: approved within the existing A12.5 operator-evaluation boundary

## Problem

All 15 AI tools correctly remain `internal` and have no approved credit price.
The account run API therefore cannot create a real evaluation run, while price
approval itself requires real RU/EN provider quality and cost evidence. Changing
the public catalog or inserting a provisional price would weaken that gate.

## Decision

Add a repository operator script that runs controlled synthetic evaluation cases
directly through the existing worker `OpenRouterProvider`. The script imports the
authoritative API provider-input/output validators from the same checkout. It
does not call account APIs, mutate SQLite, reserve credits, expose a public
endpoint, or change catalog state.

The script has two modes:

- validation is the default and performs no provider request;
- execution requires the literal `--execute-paid-provider` flag and an
  environment-supplied OpenRouter key accepted by the existing adapter.

## Case and evidence contracts

One input file covers one catalog tool and contains a bounded list of unique
cases. Every case has a stable ASCII case ID and a strict provider-input object.
The set must include at least one `ru` and one `en` case. Inputs are validated
and required to be canonical before any network call.

Execution creates an ephemeral random run ID and derives the provider safety ID
from the case content. Image tools receive a private artifact reservation under
the separate `WEBDIAG_AI_EVALUATION_ARTIFACT_PREFIX`. Image-edit input is read
through the normal `WEBDIAG_AI_ARTIFACT_PREFIX`; evaluation output is written
through a separate storage view over the same configured private backend.
Alt-text and image-edit inputs use the existing private artifact descriptor and
existing provider `prepare` path.

Each result is validated by the current API output contract before evidence is
accepted. Evidence records the exact case/input digest, model/contract snapshot,
provider result, generation ID when available, usage, measured nano-USD cost,
and artifact metadata. Raw inputs and outputs are private evidence, not normal
logs.

## File and logging boundary

Raw evidence may be written only as a direct file in the ignored repository
directory `.webdiag/ai-evals`. Existing path components are rejected if they
are symlinks or reparse points. The final file is opened once with exclusive
and no-follow flags where the platform exposes them; its file and parent
identity are rechecked before success or cleanup. The script never overwrites
evidence. Standard output contains only a redacted aggregate with counts, cost,
and an evidence SHA-256. Provider keys, inputs, outputs, URLs, provider bodies,
artifact keys, run IDs, and generation IDs are not printed.

Known-safe provider failure and unknown provider outcome both fail the command
without retry. The evidence status remains incomplete and cannot be used as a
passing activation gate.

The external provider/S3 transaction and local evidence fsync cannot be made
atomic. An abrupt process or host failure after an image upload but before the
evidence flush can leave an object without a local reservation record. Before
any activation decision, the operator must inventory the dedicated evaluation
prefix and reconcile or delete objects that are absent from completed evidence.

## Boundaries

- No new provider API or dependency is introduced; the current adapter is the
  only transport implementation.
- The runner collects provider contract and measured-cost evidence for later
  automated and manual quality assessment. It does not itself certify text or
  image quality, account queue, credit, ownership, or recovery integration.
  Those remain separate gates.
- Image outputs always require manual visual review and production S3 evidence.
- Evaluation-prefix inventory after any interrupted image run is a separate
  operator gate; the runner does not claim crash-atomic S3 cleanup.
- Normal CI never uses a real provider key and never makes a paid request.
- This stage does not activate tools, approve prices, merge, release, or deploy.

## Verification

Tests inject the existing HTTPX MockTransport/provider boundary and cover
default no-network validation, explicit execution opt-in, RU/EN coverage,
strict/canonical inputs, output grounding rejection, unknown outcomes, output
path containment/no-overwrite, redacted stdout, and image manual-review status.
