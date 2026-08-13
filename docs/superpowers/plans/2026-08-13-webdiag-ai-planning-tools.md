# WebDiag AI Planning Tools Implementation Plan

Date: 2026-08-13

## API patch

- Add RED tests for strict RU/EN inputs, URL redaction/private-host rejection, duplicate page
  rejection, source-index bounds, exact excerpt grounding, self-links, existing-link exclusion,
  and duplicate proposals.
- Add strict input/output models and semantic validators for both tool IDs.
- Run the new API test module once after implementation and commit.

## Worker patch

- Add RED tests proving both IDs route only to GPT-5.6 Luna with strict JSON schemas and explicit
  untrusted-input/no-live-metrics instructions.
- Add matching worker output models and policies without changing the shared OpenRouter transport.
- Run the new worker test module once after implementation and commit.

## Fixtures and final gate

- Add RU/EN grounded fixtures and update the internal-only changelog.
- Run the fixture module once.
- Run one full Python suite, Ruff, Python lock verification, and diff check for the complete
  package, then push and update the existing Draft PR.
