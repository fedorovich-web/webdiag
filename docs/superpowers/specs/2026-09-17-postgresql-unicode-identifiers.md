# PostgreSQL Unicode Identifiers and Dollar-Quote Tags

## Goal

Close the bounded PostgreSQL lexical gap in the conservative SQL formatter so standard-mode tokenization preserves PostgreSQL-style Unicode unquoted identifiers and Unicode dollar-quote tags without changing MySQL lexical behavior or expanding the formatter into a dialect parser.

## Scope

- Extend standard-mode bare identifier recognition beyond ASCII letters.
- Treat Unicode letters as valid identifier-start characters alongside `_`.
- Preserve the existing PostgreSQL continuation set: Unicode letters, `_`, ASCII digits, and `$`.
- Apply the same Unicode-aware start/continuation rules to dollar-quote tags, except `$` is not valid inside the tag itself.
- Scan Unicode code points safely, including non-BMP letters represented by UTF-16 surrogate pairs.
- Preserve existing ASCII identifier, placeholder, operator, quoted literal, dollar-quote, and MySQL regression behavior.

## Explicit non-goals

- No new `postgresql` dialect option.
- No identifier normalization or case-folding changes.
- No SQL parser rewrite.
- No MySQL or SQL Server Unicode-identifier expansion.
- No UI changes.

## Required regressions

RED tests must cover:

1. Cyrillic bare identifier preservation.
2. Latin bare identifier containing a diacritic.
3. A valid Unicode tagged dollar-quoted string.
4. A non-BMP Unicode letter in a bare identifier to prove code-point-safe scanning.
5. ASCII controls for continuation characters and existing dollar tags.
6. Boundaries that remain invalid or lexically separate: digit-at-start and a dollar-quote delimiter immediately following an identifier.
7. Existing placeholders, PostgreSQL compound operators, and MySQL lexical behavior remain unchanged.

## Implementation constraint

Use a small tokenizer-local helper for code-point-aware PostgreSQL identifier scanning. Do not broaden unrelated token classes or refactor the formatter outside the minimum lexical surface required by the failing tests.
