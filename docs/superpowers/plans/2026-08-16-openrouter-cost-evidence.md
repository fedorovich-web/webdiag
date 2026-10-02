# OpenRouter provider cost evidence implementation plan

1. Add failing worker tests for exact USD-to-nano-USD conversion and fail-closed
   handling of missing, negative, boolean, non-finite, and over-limit cost.
2. Add failing API/storage tests proving completion requires a bounded integer,
   persists it on the leased attempt, preserves it on idempotent replay, and
   leaves migrated historical attempts unmeasured.
3. Extend the worker provider result and completion envelope, using Decimal and
   conservative rounding without changing public responses.
4. Add the nullable SQLite attempt column and transactional persistence while
   preserving additive migration and ownership/lease checks.
5. Add a bounded operator-only per-tool JSON report for measured/unmeasured
   successful attempts and nearest-rank p95 provider cost, without private run
   data.
6. Run the targeted worker/API tests once, Ruff on affected files, and
   `git diff --check`; then run the relevant complete Python verification before
   committing the stage.
