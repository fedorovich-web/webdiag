# WebDiag AI Final Text Tools Implementation Plan

Date: 2026-08-13

## API patch

- Add RED tests for redirect inventory uniqueness, exact one-decision-per-old-page mapping,
  valid target indexes/evidence, glossary completeness, verbatim preservation, locale bounds,
  regex case-plan completeness, and fixed unverified status.
- Add strict API models and semantic validators for the three catalog IDs.
- Run the new API module once after implementation and commit.

## Worker patch

- Add RED tests for the three strict output schemas and explicit no-crawl/no-certified-quality/
  no-regex-execution policies.
- Add matching models and policies without changing the shared OpenRouter transport.
- Run the new worker module once after implementation and commit.

## Fixtures and final gate

- Add RU/EN fixtures and update generic AI infrastructure tests to use an explicit test-only
  definition rather than a newly contracted production catalog ID.
- Run the fixture module once and commit.
- Run one full Python suite, Ruff, Python lock verification, and diff check; push and update the
  existing Draft PR without merge, release, deployment, payment, or public activation.
