# PostgreSQL Unicode String Continuation Spec

## Problem

The SQL formatter preserves PostgreSQL newline-based continuation for ordinary strings and `E`, `B`, and `X` prefixed strings, but `U&'...'` Unicode escape strings are excluded from the continuation predicate. PostgreSQL's scanner treats Unicode escape strings through the same quote-continuation mechanism, so collapsing the newline can change lexical semantics.

Example input:

```sql
SELECT U&'d\0061'
'ta';
```

must retain the significant line break between the adjacent string fragments.

## Required behavior

- In the standard/PostgreSQL-like dialect, preserve a source line break before an adjacent string token when the preceding token is `U&'...'` or `u&'...'`.
- Preserve CRLF/horizontal-whitespace continuation the same way as existing ordinary/E/B/X continuation.
- Preserve `UESCAPE` syntax after the continued Unicode escape string without changing its tokenization.
- Same-line adjacent `U&'...' '...'` strings must not gain a newline.
- `U&"..."` Unicode identifiers must not be treated as string continuation candidates.
- MySQL mode must keep its current behavior and must not gain PostgreSQL continuation preservation.

## Constraints

- No new SQL dialect option.
- No SQL parser or semantic validator.
- No changes to Unicode escape decoding or validation.
- No changes to existing MySQL string behavior.
- No comment-mediated continuation handling in this batch.
- Keep the production change local to the existing continuation predicate unless tests prove a broader change is required.

## Verification

Add focused regression tests and run the full repository CI before merge. After merge, verify the exact integration SHA and the post-merge CI run.
