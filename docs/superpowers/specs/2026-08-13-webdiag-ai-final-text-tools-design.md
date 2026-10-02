# WebDiag AI Final Text Tools Design

Date: 2026-08-13
Status: approved for internal implementation

## Scope

This batch adds internal executable contracts for `ai_redirect_migration_mapper`,
`ai_localization_workbench`, and `ai_regex_workbench` on the fixed
`openai/gpt-5.6-luna` OpenRouter runtime. It completes the 13 text/vision-analysis entries in
the 15-tool catalog. The two image-generation entries remain disabled because the selected
model has text output.

## Redirect Migration Mapper

The caller supplies bounded old-page and new-page snapshots. Each contains a canonical public
URL, optional title/H1, and content; WebDiag does not crawl either inventory. Every old page
must receive exactly one `redirect` or `no_match` decision. A redirect references a valid new
page index and exact evidence excerpts from both snapshots. A no-match decision has no target
and cites exact old-page evidence. URLs are unique after query/fragment redaction.

The output is a reviewable mapping proposal. It does not apply redirects, inspect HTTP status,
or claim deployment, ranking, traffic, or measured impact.

## Localization Workbench

The caller supplies RU or EN source content, a distinct RU or EN target locale, optional
source/target glossary pairs, and exact verbatim constraints. The output contains localized
content, one indexed usage for every glossary entry, preserved-constraint indexes, and
warnings. Source excerpts must exist in the source; target excerpts and glossary target terms
must exist in the output; every verbatim constraint must remain exact.

The tool does not claim certified, legal, or native-speaker translation quality. It remains
internal until RU/EN semantic evaluation.

## Regex Workbench

The caller supplies a dialect label (`python`, `javascript`, or `re2`), a task, and bounded test
cases with explicit expected-match booleans. The model returns a draft pattern, an exact
one-to-one case plan referencing every supplied case, an explanation, warnings, and the fixed
status `unverified`.

WebDiag does not execute model-produced regular expressions in this batch. This avoids
cross-engine semantic invention and server-side catastrophic-backtracking risk. The result must
never be presented as compiled, safe, passed, or validated. A future engine-specific sandbox
is required before public activation.

## Shared safety

- Pydantic v2 strict models reject coercion and extra fields; all inputs/outputs are bounded.
- User content and examples are untrusted data and cannot override system instructions.
- Page URLs use the public-network policy and remove query strings/fragments.
- Provider output uses strict JSON Schema, fixed GPT-5.6 Luna, disabled fallback, denied data
  collection, required ZDR routing, and no automatic retry.
- All three entries remain internal. Tests use mock transport only.
