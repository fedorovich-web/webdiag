# WebDiag AI Content Workbench Implementation Plan

Date: 2026-08-13

## Patch 1: API contracts

- Add RED tests covering RU/EN input, strict field and enum bounds, public URL enforcement,
  exact evidence grounding, fact-index integrity, and unsupported output shapes.
- Add strict input/output models and tool-specific semantic validators in
  `apps/api/src/webdiag_api/ai/tool_contracts.py`.
- Run only the new API contract test module after implementation.
- Commit the API contract and tests together.

## Patch 2: Worker execution

- Add RED worker tests for all three tool IDs, exact model policy, strict JSON schema, safe
  provider routing, and prohibitions on fabricated search evidence.
- Add matching provider output models and `_TOOL_POLICIES` entries.
- Keep the existing OpenRouter request, privacy, no-fallback, and error-classification code.
- Run only the affected worker provider tests after implementation.
- Commit worker code and tests together.

## Patch 3: Shared fixtures and records

- Add stable RU/EN input/output fixture cases for the three contracts.
- Extend fixture coverage assertions so every implemented text contract is represented.
- Record the internal-only state and exact verification results in project documentation.
- Run the fixture test once after the fixture change.

## Final gate

Run the affected aggregate tests once, followed by one full Python suite, Ruff, Python lock
verification, and `git diff --check`. Push the branch and update the existing Draft PR without
marking it ready or merging it.
