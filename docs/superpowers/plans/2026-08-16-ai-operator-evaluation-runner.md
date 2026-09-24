# AI operator evaluation runner implementation plan

1. Add failing script-level tests for strict case validation, RU/EN coverage,
   default no-network behavior, paid-execution opt-in, and output containment.
2. Implement a small import-safe operator module under `scripts/` that uses the
   installed API and worker packages without adding a runtime package dependency.
3. Add failing execution tests with the existing OpenRouter MockTransport for
   successful redacted evidence, semantic output rejection, known-safe failure,
   and unknown outcome without retry.
4. Add image reservation/manual-review coverage without making S3 or provider
   calls in ordinary tests.
5. Document exact validation and explicit execution commands, private evidence
   handling, and the separate integration/price/activation gates.
6. Run targeted script/API/worker tests once, Ruff and `git diff --check`, then
   request independent review and run one fresh relevant full verification.
