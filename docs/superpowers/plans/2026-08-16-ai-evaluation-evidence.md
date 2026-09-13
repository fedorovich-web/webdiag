# AI evaluation evidence implementation plan

1. Add failing API tests for an operator-only evaluation report built from a
   verified immutable recovery bundle. Prove RU/EN coverage, semantic contract
   revalidation, digest integrity, measured provider cost, and redacted output.
2. Add a bounded read-only storage query for successful tool runs and their
   final completed provider attempts. It must not initialize or migrate the
   snapshot and must expose no account data through the CLI.
3. Add an evaluation service that validates the catalog contract/model snapshot,
   stored input/output digests, JSON objects, provider usage/cost, and existing
   tool-specific grounding rules.
4. Add `provider-eval-report` to the existing AI operator CLI. The report must
   contain only aggregate locale coverage, counts, unit/cost bounds, and a
   deterministic evidence digest; it must fail closed on incomplete or invalid
   evidence and must not change catalog state or price.
5. Document this stage as report-only. State that the current `internal`
   catalog cannot create live evaluation runs, that a separate operator-only
   execution path remains required, and that the report is not activation
   approval.
6. Run the new tests red then green, the affected API test group once, Ruff and
   `git diff --check`, followed by one fresh relevant full verification before
   committing and pushing the stage.
