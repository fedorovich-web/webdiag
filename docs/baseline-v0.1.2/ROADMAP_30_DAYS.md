# ROADMAP_30_DAYS.md

Дата старта в документе не назначена. День 1 начинается после принятия baseline и создания application scaffold.

## Волна W1 — дни 1–8

Цель: foundation и 56 browser-only инструментов.

- monorepo scaffold;
- CI;
- design token foundation;
- RU/EN routing and typed locale dictionaries;
- product registry;
- universal tool route/template;
- local execution SDK;
- 56 browser tools;
- bilingual catalog, category pages and search;
- image optimize, convert, resize and crop tools;
- registry consistency tests.

## Волна W2 — дни 9–15

Цель: URL Security Gateway и пассивные проверки.

- FastAPI;
- PostgreSQL;
- URL normalization;
- SSRF protection;
- safe fetch adapter;
- DNS/TLS adapter;
- rate limits;
- сетевые инструменты уровня R1;
- negative security tests.

## Волна W3 — дни 16–22

Цель: multi-request инструменты.

- RabbitMQ + Dramatiq;
- durable job state;
- redirect chains;
- bulk status;
- sitemap/hreflang;
- DNS propagation/DNSSEC;
- TLS configuration;
- cache/mobile checks;
- progress/status API.

## Волна W4 — дни 23–30

Цель: heavy tools и core beta.

- crawler;
- isolated Chromium workers;
- single-page audit;
- limited whole-site audit;
- broken links/images;
- duplicate metadata;
- orphan pages;
- Lighthouse/Web Vitals;
- accessibility quick audit;
- account, sites, history;
- basic uptime/SSL monitoring;
- bilingual blog foundation and editorial schemas;
- production hardening and release audit.

## Scope control

Чтобы 110 инструментов не сорвали beta:

- generic AI исключён;
- billing исключён из 30 дней;
- public report indexation исключена;
- unlimited crawl исключён;
- каждый сложный инструмент использует общий executor;
- UI строится на общих field/result components;
- новые инструменты не добавляются до прохождения release gate для исходных 110.

## Реалистичность

Каталог из 110 инструментов достижим за месяц только при платформенной реализации:

- 46 local/browser;
- общие parsers и converters;
- единый safe fetch;
- единый DNS/TLS executor;
- единый crawler;
- единый Chromium service;
- registry-driven pages.

110 полностью независимых движков за 30 дней не являются реалистичным или качественным планом.
