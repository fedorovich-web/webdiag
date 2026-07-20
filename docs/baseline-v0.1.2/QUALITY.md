# QUALITY.md — WebDiag

Дата: 2026-07-16

## Definition of Done для инструмента

Инструмент считается реализованным только если:

1. имеет уникальный intent и отдельный URL;
2. выполняет заявленную функцию;
3. не является placeholder;
4. имеет input/output schema;
5. имеет error, empty, loading и success states;
6. соблюдает executor policy и limits;
7. имеет unit tests;
8. для server-side инструмента имеет negative security tests;
9. имеет уникальные title, description, H1 и canonical;
10. не содержит недоказанных claims;
11. проверен на 1440, 1024, 430, 390 и 375 px;
12. проходит keyboard/accessibility review;
13. зарегистрирован в едином product registry.

## Test pyramid

### Unit

- schemas;
- parsers;
- normalizers;
- browser utilities;
- audit checks;
- URL classification;
- scoring;
- registry consistency.

### Integration

- API + PostgreSQL;
- API + broker;
- worker + database;
- safe fetch;
- crawl persistence;
- monitoring transitions.

### E2E

- public tool route;
- tool execution;
- auth;
- project creation;
- audit launch;
- report;
- re-check;
- responsive navigation.

## Release gates

- unit green;
- integration green;
- critical Playwright green;
- axe critical routes green;
- no unresolved P0 security finding;
- registry count equals 110;
- no duplicate slug/title/canonical;
- sitemap and catalog generated from registry;
- no tool page with `status=published` and missing executor/test owner.

## I18N quality gates

- no missing locale keys;
- no published tool without RU and EN metadata;
- correct canonical and reciprocal hreflang;
- no locale redirect loops;
- localized validation, loading and errors;
- responsive tests in both languages.

## Content quality gates

- unique intent;
- author, reviewer and sources;
- last reviewed and review due;
- related tool/product path;
- no thin, placeholder or unreviewed machine-translated article;
- no orphan published content.
