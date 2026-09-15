# WebDiag GPT Image 2 Implementation Plan

**Goal:** Add real, private GPT Image generation and editing infrastructure
without enabling public billing, leaking object keys, or storing base64 in SQLite.

## Contracts and catalog

- [ ] Add failing catalog and tool-contract tests for both image tools.
- [ ] Add strict generation/edit input contracts and artifact output contracts.
- [ ] Move both catalog entries from disabled to internal with model policy
  openai/gpt-image-2.

## Provider and private storage

- [ ] Add failing worker tests for the exact OpenRouter Image API request,
  strict base64/media/size validation, input-reference integrity, and no retry.
- [ ] Extend worker artifact storage with bounded private writes.
- [ ] Implement the fixed GPT Image 2 policies and return only artifact metadata.

## Persistence and delivery

- [ ] Add failing API tests for atomic artifact completion, owner-only download,
  cross-account denial, tamper rejection, and object-key non-disclosure.
- [ ] Persist verified artifact metadata with run completion.
- [ ] Add authenticated no-store artifact download and deletion cleanup.

## Verification

- [ ] Run each new targeted suite once from red to green.
- [ ] Run one consolidated Python, Ruff, lock, and diff verification for the
  completed image batch.
- [ ] Commit and push explicit image-package files, then update the Draft PR.
