# PostgreSQL Numeric and Parameter Token Boundary Spec

## Problem

The standard/PostgreSQL-like SQL tokenizer currently accepts a valid numeric or positional-parameter prefix and then tokenizes attached trailing text separately. That can turn PostgreSQL lexical errors into valid formatted SQL.

Examples:

```sql
SELECT 123abc;
SELECT 1e;
SELECT 0x;
SELECT $1foo;
```

PostgreSQL's scanner has explicit `integer_junk`, `numeric_junk`, `real_junk`, `param_junk`, radix-failure, and incomplete-real rules for these boundaries. The formatter must not repair those inputs by inserting whitespace.

## Required behavior

In the standard/PostgreSQL-like dialect:

- reject a numeric literal immediately followed by an identifier start, including Unicode letters and `_` according to the tokenizer's existing identifier contract;
- reject malformed radix-prefixed literals whose valid numeric prefix is immediately followed by an invalid decimal digit or identifier text;
- reject incomplete exponent forms such as `1e`, `1e+`, and `1e-`;
- reject positional parameters such as `$1foo` or `$1_name` when identifier text is attached directly;
- preserve valid literals such as `123`, `1.5`, `.5`, `1e+2`, `0xFF`, `0o755`, and `0b1010`;
- preserve valid separated aliases and casts such as `123 value`, `123::int`, `$1 value`, and `$1::text`;
- leave MySQL mode unchanged.

## Constraints

- No SQL parser or semantic validation.
- No new dialect option.
- No redesign of number tokenization.
- No changes to PostgreSQL identifier rules in this batch.
- No changes to MySQL token-boundary behavior.
- Keep the production change local to numeric/placeholder boundary validation.

## Verification

Use TDD: first prove the current formatter repairs the invalid PostgreSQL inputs, then add the minimal boundary checks. Run full repository CI before merge and again on the exact post-merge integration SHA.
