# PostgreSQL Multiline String Continuation Spec

## Goal

Preserve PostgreSQL-significant line breaks between adjacent single-quoted string literal segments when formatting SQL in the default `standard` dialect.

## Source semantics

PostgreSQL 18 treats two string constants separated only by whitespace containing at least one newline as one continued string constant. A same-line whitespace gap does not have that meaning. Escape string constants use `E` only on the first segment, and bit/hex string constants can be continued across lines in the same way as regular string constants.

## Required behavior

- `formatSql("select 'foo'\n'bar';")` must retain a line break between the two literal segments.
- `\r\n` and surrounding horizontal whitespace may be normalized to one output `\n`, but the semantic line-break boundary must remain.
- Preserve the boundary for ordinary strings and PostgreSQL `E`, `B`, and `X` prefixed literals.
- Same-line adjacent strings remain formatted on one line; the formatter must not silently turn them into a multiline continuation.
- Unrelated source line breaks remain disposable formatting whitespace.
- `sqlDialect: "mysql"` must keep its existing behavior and must not receive PostgreSQL-specific continuation preservation.

## Architecture

Keep the formatter conservative. Record only a boolean `lineBreakBefore` lexical fact on SQL tokens, derived from discarded whitespace. During formatting, use it only when both the previous and current tokens are continuation-compatible PostgreSQL single-quoted literal forms. Do not preserve arbitrary source whitespace.

## Non-goals

- No SQL parser/AST rewrite.
- No literal-value folding such as replacing two segments with `'foobar'`.
- No global whitespace preservation.
- No dollar-quoted continuation behavior.
- No `U&''` continuation change.
- No comment-mediated continuation change.
- No MySQL behavior change.
- No dependencies or UI changes.
