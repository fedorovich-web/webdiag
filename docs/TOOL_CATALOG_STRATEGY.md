# WebDiag Tool Catalog Strategy

Date: 2026-07-21
Scope: A10.6 catalog strategy and quality gate.

## Product target

WebDiag targets a broad catalog of approximately 125–145 practical tools without padding the catalog with one-bit checks. The catalog should compete by practical usefulness, evidence, execution safety, and good reporting rather than by inflated tool count.

The target catalog groups are:

| Group | Target range | Notes |
|---|---:|---|
| SEO, technical audit, and indexability | 28–35 | Public URL checks, page-level audit, crawl-enabled checks later. |
| Security and network | 18–22 | Headers, TLS, DNS, email-authentication records, domain/IP lookups. |
| Performance and PageSpeed | 12–16 | PageSpeed/Core Web Vitals, cache, page weight, resources. |
| Monitoring | 6–10 | Requires auth, persistence, scheduling, notification channels. |
| Image and media utilities | 18–24 | Resize, compress, crop, convert, SVG, favicon, metadata, watermark. |
| AI tools | 18–25 | Requires real AI provider integration, billing/limits, and no fake output. |
| Development/data utilities | 15–20 | JSON, YAML, XML, CSV, JWT, regex, cron, hash, UUID/ULID, diff. |
| CSS/design utilities | 10–15 | Color, contrast, gradients, shadows, spacing, typography, grid/flex. |
| Text/data helpers | 10–15 | Text transforms, validators, encoders, generators where useful. |

The exact count is secondary. A smaller catalog of real tools is preferable to a larger catalog of weak microtools.

## Product Value Gate

A tool may become `ready` only when it passes all of these checks:

1. **Standalone user intent** — a user can describe a real job-to-be-done for this tool without naming a single HTML attribute or one header.
2. **Multi-signal result** — the result contains enough context to be useful, not only `true`/`false`.
3. **Actionable recommendation** — the tool gives next-step guidance or explains impact.
4. **Visible result UI** — the frontend exposes a complete success/error/loading state and a readable result layout.
5. **Backend or client boundary is honest** — the tool states whether it is browser-only, safe-fetch, DNS/TLS, crawler, Chromium, AI, or monitoring-backed.
6. **No duplication** — it does not duplicate an existing stronger tool.
7. **No fake capability** — AI, monitoring, crawler, PageSpeed, and background-removal tools must not be exposed as `ready` until the real provider/infrastructure exists and is tested.
8. **Safety and limits** — server-backed tools use URL policy/SSRF guards, body limits, timeouts, and normalized errors where applicable.

## Anti-microtool rule

The catalog must not promote one-bit checks as standalone tools.

Forbidden as standalone public tools:

- `H1 Checker`;
- `Title Length Checker`;
- `Meta Description Length Checker`;
- `Alt Attribute Checker`;
- `Single Header Checker` for one HTTP response header;
- a one-attribute HTML checker;
- a one-field SEO checker whose output belongs inside a stronger page-level tool.

Correct aggregation:

| Weak microtool | Correct WebDiag tool |
|---|---|
| H1 Checker | Heading Structure Checker |
| Title Length Checker | Meta Tags Checker and SERP Snippet Preview |
| Description Checker | Meta Tags Checker and SERP Snippet Preview |
| Alt Attribute Checker | Image SEO Audit |
| One security header checker | Security Headers Checker or CSP Analyzer |
| Single HTTP status only | Redirect Chain Checker or Bulk HTTP Status Checker |
| Single sitemap count only | Sitemap Validator |

Existing strong tools such as `canonical-checker`, `robots-txt-tester`, `sitemap-validator`, `redirect-chain-checker`, and `security-headers-checker` are acceptable because they inspect multiple signals and produce actionable interpretation.

## Performance and PageSpeed policy

`core-web-vitals-checker` should be implemented through a backend integration with Google PageSpeed Insights API, not by embedding an iframe or calling Google directly from the browser.

Required behavior:

- support `mobile`, `desktop`, and later `both` strategies;
- separate Lighthouse lab data from Chrome UX Report field data;
- normalize scores and metrics into a stable WebDiag DTO;
- handle missing field data explicitly;
- handle missing API key, quota errors, timeouts, and invalid upstream responses gracefully;
- never fail the entire generic audit only because PageSpeed is unavailable;
- use mocks in tests, not live Google API calls.

This tool is a strong standalone tool and can also appear as an optional section in page/site audit results.

## AI tools policy

AI tools are allowed only when backed by real provider integration and explicit product limits. They must not produce fake placeholder AI output.

Planned AI groups:

- AI meta tags generator;
- AI Schema.org generator;
- AI FAQ generator;
- AI alt text generator;
- AI SEO recommendations;
- AI competitor page summary;
- AI content brief;
- AI title/headline generator;
- AI rewrite/summarize tools;
- background remover, image enhancer, upscaler, transcription, and TTS where provider/infrastructure exists.

AI tools require usage limits, error normalization, cost awareness, and abuse controls before `ready`.

## Image/media tools policy

Image utilities should be separate from SEO audit tools when the user intent is direct asset editing or conversion.

Planned strong image tools:

- Resize Image;
- Compress Image;
- Crop Image;
- Convert Image;
- PNG/JPG/WebP/AVIF conversions;
- SVG Optimizer;
- Favicon Generator;
- Add Watermark to Image;
- Image Metadata Viewer;
- Image Metadata Remover;
- Responsive Image/Srcset Generator;
- Background Remover when backed by a real model/provider.

Do not add a public `remove watermark` tool. `Add Watermark` is allowed. Background removal is allowed only for user-supplied assets with a real implementation.

## Monitoring policy

Monitoring is not a static utility. It requires account-level infrastructure:

- users/auth;
- projects/sites;
- persistence/history;
- scheduled jobs;
- notification channels;
- rate limits;
- alert rules;
- billing/tier limits later.

Monitoring tools must stay `internal` until that foundation exists.

## Batch implementation rule

A patch can ship three tools only when they are architecturally close and can share validation, DTO patterns, UI components, and tests without lowering quality.

Preferred near-term batches:

1. **Metadata/social batch** — Meta Tags Checker, SERP Snippet Preview, Open Graph/Twitter Card Preview.
2. **Markup/schema batch** — Structured Data Validator, HTML Markup Validator, Schema.org JSON-LD Generator.
3. **Content structure batch** — Heading Structure Checker, Keyword/Phrase Frequency Analyzer, Readability Analyzer.
4. **Links/assets batch** — Link Analyzer, Image SEO Audit, Favicon/App Icons Checker.
5. **Performance batch** — Core Web Vitals/PageSpeed Checker, HTTP Cache Policy Checker, Page Weight/Resource Summary.
6. **Image utilities batch** — Resize Image, Compress Image, Convert Image.
7. **Image utilities batch 2** — Crop Image, SVG Optimizer, Add Watermark/Favicon Generator depending on implementation size.

If one tool in a three-tool batch needs substantially different infrastructure, split it out.

## Current ready baseline after A10.5

The confirmed server-backed ready tools are:

- Redirect Chain Checker;
- Robots.txt Tester;
- Sitemap Validator;
- Canonical Checker;
- Security Headers Checker.

Other browser/local utilities already marked `ready` remain public, but future promotion to `ready` must follow this document and the automated catalog quality gate.
