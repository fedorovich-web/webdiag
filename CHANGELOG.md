# Changelog

## A10.34 — CSS color / specificity / typography tools

- Activated Color Converter for local HEX normalization and HEX → RGB/HSL conversion with copyable CSS values, channel display, preview, and strict 3/6-digit HEX validation.
- Activated CSS Specificity Calculator for bounded selector-list analysis, ID/class/type buckets, pseudo-element/type counting, :where() zeroing, and strongest-argument handling for :is(), :not(), and :has().
- Activated Typography Scale Generator for base px + ratio modular-scale generation, bounded step ranges, px/rem output, and CSS custom properties for design-token workflows.
- Kept all three tools browser-only with no backend request, stylesheet execution, file upload, color-palette extraction, font metric inference, or new dependency.
- Added pure TypeScript contracts, RU/EN interfaces and editorial pages, renderer coverage, registry/API parity updates, and targeted unit tests.
- Registry remains at 125 entries and now exposes 96 ready public tools; exactly three existing internal entries were promoted.

## A10.33 — CSS Design Generator Workbench

- Activated CSS Gradient Generator, Box Shadow Generator, and Border Radius Generator as bounded browser-only design utilities.
- Kept each generator local with explicit numeric caps, HEX-only color parsing where applicable, no backend calls, no storage, no canvas export, no AI design claims, and no remote assets.
- Added pure TypeScript generation helpers, RU/EN tool UIs, editorial pages, runtime tests, renderer coverage, and registry/API parity updates.
- Registry remains at 125 entries and now exposes 93 ready public tools; exactly three existing internal CSS-design entries were promoted.
## A10.31 — Cron Expression Workbench / JWT Inspection Lab

- Replaced the planned separate cron generator/parser microtools with one Cron Expression Workbench for five-field Unix cron: builder fields, strict parsing, ranges/lists/steps, JAN–DEC and SUN–SAT names, Vixie-style day-of-month/day-of-week semantics, and normalized explanation.
- Added bounded UTC next-occurrence preview in a dedicated same-origin Web Worker with a 10-result cap, 366-day horizon, fixed iteration ceiling, request validation, hard UI timeout, cancellation, and no scheduler execution.
- Reframed the planned JWT Decoder as JWT Inspection Lab with strict Base64URL, fatal UTF-8, JSON object/depth/node limits, header/payload display, exp/nbf/iat browser-clock review, iss/sub/aud/jti checks, and explicit alg=none, missing-alg, empty-signature, and decode-is-not-verification warnings.
- Kept JWT processing browser-only with no signature verification, remote JWKS, OAuth/OIDC discovery, network request, logging, history, persistent storage, private-key input, or dynamic HTML rendering.
- Kept the separate cron parser and URL parser candidates internal because their useful scope is covered by the combined cron workflow and the existing URL normalization/query tools.
- Added pure TypeScript contracts, RU/EN interfaces and editorial pages, Worker/security/runtime tests, renderer coverage, and registry/API parity updates without a new dependency.
- Registry remains at 125 entries and now exposes 90 ready public tools; exactly two existing internal entries were promoted.

## A10.30 — SQL / GraphQL / Safe Regex code workbench

- Activated SQL Formatter with a bounded conservative tokenizer for common clauses, joins, lists, nested subqueries, strings, comments, quoted identifiers, keyword casing, and two- or four-space indentation.
- Activated GraphQL Formatter for operations, variables, arguments, directives, fragments, selection sets, comments, escaped strings, and block strings with bounded lexical and delimiter checks.
- Activated Safe Regex Lab with JavaScript RegExp semantics inside a fresh dedicated Web Worker, hard 100–1,000 ms timeout, bounded input, 500-match cap, captures, optional indices, and zero-length match advancement.
- Added heuristic review signals for nested quantifiers, broad wildcards, quantified alternation, backreferences, lookbehind, large quantifiers, and very long patterns without claiming proof of ReDoS safety.
- Kept all three tools browser-only with no SQL/GraphQL execution, database connection, remote schema fetch, server-side regex execution, `eval`, `Function`, or new dependency.
- Added pure TypeScript engines, isolated-worker contract, RU/EN interfaces and editorial pages, formatter/worker boundary tests, renderer coverage, and registry gates.
- Registry remains at 125 entries and now exposes 88 ready public tools; exactly three existing internal entries were promoted.

## A10.29 — JSONPath / TOML / CSV data workbench

- Activated JSONPath Query Lab with a bounded no-eval parser for properties, indices, wildcards, recursive descent, unions, slices, and simple existence/comparison filters.
- Activated TOML ↔ JSON Converter for a documented TOML configuration subset covering tables, array tables, dotted keys, arrays, inline tables, safe integers, finite floats, and date/time preservation as strings.
- Activated CSV Data Workbench as one combined validator/converter for delimiter detection, quoted and multiline fields, inconsistent rows, duplicate or empty headers, CSV ↔ JSON conversion, and spreadsheet-formula-like signals.
- Kept the separate `csv-validator` internal because CSV validation is already part of the stronger workbench and a second public entry would be a duplicate microtool.
- Kept all three tools browser-only with no backend route, external fetch, eval, custom object construction, or new dependency.
- Added pure TypeScript engines, RU/EN interfaces and editorial pages, boundary and round-trip tests, renderer coverage, and registry gates.
- Registry remains at 125 entries and now exposes 85 ready public tools; exactly three existing internal entries were promoted.

## A10.28 — JSON Schema / YAML-JSON / XML utilities

- Activated JSON Schema Validator with a documented bounded JSON Schema 2020-12 subset covering local JSON Pointer `$ref`, core type/object/array/string/number constraints, combinators, and selected syntactic formats without remote schema fetching.
- Activated YAML ↔ JSON Converter for a safe configuration subset with mappings, sequences, scalars, duplicate-key detection, bounded indentation/depth, and explicit rejection of anchors, aliases, custom tags, merge keys, and block scalars.
- Activated XML Formatter and Validator for bounded well-formedness checks, matching tags, quoted attributes, comments, CDATA, processing instructions, predefined/numeric entities, and mixed-content-preserving formatting.
- Kept all three tools browser-only with no backend requests, custom code execution, schema fetching, DTD/entity expansion, or server-side parsing.
- Explicitly excluded full JSON Schema vocabulary support, full YAML 1.2.2 semantics, XSD/Relax NG/Schematron validation, canonical XML serialization, and automatic repair claims.
- Added pure TypeScript engines, RU/EN interfaces and editorial pages, copyable reports, boundary tests, renderer coverage, and registry gates.
- Registry remains at 125 entries and now exposes 82 ready public tools; exactly three existing internal entries were promoted.

## A10.27 — DNS resolver comparison / domain RDAP / IP RDAP

- Added DNS Resolver Comparison for one selected record type across Cloudflare, Google Public DNS, Quad9, and OpenDNS, including bounded parallel queries, answer-set comparison, partial errors, TTL display, and backend-to-resolver timing.
- Replaced the planned legacy WHOIS implementation with Domain RDAP Lookup using the IANA DNS bootstrap and the selected registry RDAP service for statuses, events, nameservers, registrar, abuse contact, and delegationSigned signals.
- Added IP RDAP Network Lookup using IANA IPv4/IPv6 bootstrap and most-specific prefix selection for registry range, CIDR0, handle, type, status, country field, and abuse contact.
- Kept all claims bounded: resolver agreement is not global propagation proof, domain RDAP 404 is not availability proof, and IP country is registration allocation data rather than device geolocation.
- Kept RDAP responses bounded and omitted registrant personal contact data; bootstrap and registry HTTP requests use the existing safe fetcher with SSRF, redirect, peer-IP, timeout, and body-size protections.
- Added strict backend contracts, allowlisted Next.js proxies, frontend runtime validators, RU/EN editorial pages, copyable reports, parser/API/proxy/renderer tests, and registry gates.
- Registry remains at 125 entries and now exposes 79 ready public tools; no commercial IP API, legacy WHOIS scraping, reputation score, or fake global propagation tool was added.

## A10.26 — specialized structured-data generators

- Added Organization Schema JSON-LD Generator for explicit Organization, Corporation, NGO, or LocalBusiness data, including stable @id, logo, PostalAddress, sameAs, and one bounded ContactPoint.
- Added BreadcrumbList Schema JSON-LD Generator for 2–20 ordered items with HTTP(S) validation, sequential positions, and optional omission of item only for the final crumb.
- Added Product Schema JSON-LD Generator for explicit Product and optional Offer fields, including images, SKU, Brand, GTIN, MPN, price, currency, availability, condition, seller, and priceValidUntil.
- Kept all three tools browser-only with no backend request, crawler, AI, placeholder fabrication, ratings/reviews invention, availability inference, or rich-result eligibility claim.
- Escaped less-than characters in JSON-LD serialization so user input cannot close the script element; empty optional fields are omitted rather than filled with examples.
- Added deterministic validation, RU/EN forms and editorial pages, copyable output, generator tests, renderer coverage, and registry gates.
- Registry baseline is now 125 entries and 76 ready public tools; the existing generic schema generator remains the quick template while these tools provide deeper entity-specific contracts.

## A10.25 — static accessibility structure analyzers

- Added Landmark Structure Analyzer for bounded static semantic/ARIA landmark inventory, accessible names, duplicate role/name pairs, main-landmark conflicts, hidden signals, and broken naming references.
- Added Form Accessibility Analyzer for labels, aria-labelledby/aria-describedby, placeholder-only and title-only controls, duplicate IDs, fieldset/legend, and radio/checkbox grouping signals.
- Added Link and Button Accessible Name Analyzer for native and role-based links/buttons, text/alt/ARIA naming, generic names, nested interactive elements, custom-role focus signals, duplicate IDs, and suspicious link targets.
- Kept all three tools on one bounded SafeHttpFetcher page request with existing SSRF, DNS/redirect revalidation, peer-IP verification, decoded-body caps, and no JavaScript execution.
- Explicitly kept browser accessibility-tree computation, CSS visibility, focus order, keyboard activation, validation flows, screen-reader behavior, and WCAG-conformance claims outside scope.
- Added strict backend contracts, allowlisted Next.js proxies, client runtime validators, RU/EN editorial pages, copyable reports, parser/API/proxy/renderer tests, and registry gates.
- Registry baseline is now 122 entries and 73 ready public tools; no standalone label, alt, ARIA, or single-element microtools were added.

## A10.24 — URL normalization / query parameters / redirect map

- Added URL Normalization Analyzer as a local browser tool for deterministic HTTP/HTTPS syntax normalization: scheme and hostname casing, default ports, IDNA, dot segments, percent encoding, fragments, and routing-sensitive slash review signals.
- Promoted the former internal pagination/parameter entry as Query Parameter Analyzer, with local bounded query-pair inspection, repeated names, blanks, case variants, sensitive-looking names, transparent tracking/pagination/sort/filter/search/session patterns, and a non-destructive tracking-removal candidate.
- Added Redirect Map Validator for up to 25 explicit source-to-target rows, first-hop target and optional status comparison, duplicate/conflicting sources, self redirects, map chains, and cycles.
- Kept URL normalization and query analysis local with no network request; redirect-map network checks use bounded concurrency and `SafeHttpFetcher` with DNS/redirect revalidation, pinned peer verification, no response-body read, and private/local target rejection.
- Kept crawler discovery, automatic redirect generation, canonical-intent claims, parameter-removal automation, and fake SEO scores outside scope.
- Added strict backend and frontend contracts, allowlisted proxy payloads, CSV/TSV input parsing, RU/EN editorial pages, copyable reports, parser/API/proxy/renderer tests, and updated registry gates.
- Registry baseline is now 119 entries and 70 ready public tools; no URL-component or single-parameter microtools were added.

## A10.23 — JavaScript bundle / CSS delivery / font loading

- Added JavaScript Bundle Surface Analyzer with bounded static script discovery, document-reference counts, unique asset header checks, MIME, declared-size, compression, cache, redirect, module/classic, duplicate, parser-blocking, and nested-target safety signals.
- Added CSS Delivery Analyzer for stylesheet links and inline styles, bounded CSS retrieval, `@import`, `@font-face`, MIME, compression, cache, media, duplicate, alternate, disabled, and source-map signals.
- Added Font Loading Analyzer that correlates bounded static `@font-face` rules, font sources, font preloads, `font-display`, formats, cache, MIME, declared bytes, and cross-host/crossorigin signals.
- Revalidated every nested JavaScript, stylesheet, and font URL through `SafeHttpFetcher`; private or otherwise rejected asset targets are recorded without being requested.
- Kept runtime execution, browser waterfall, code coverage, unused-code conclusions, rendered-font confirmation, and synthetic performance scores outside scope.
- Added strict backend contracts, allowlisted Next.js proxies, client runtime validators, RU/EN editorial pages, copyable summaries, parser/API/proxy/renderer tests, and registry gates.
- Registry baseline is now 117 entries and 67 ready public tools; no single-file, single-header, or single-font microtools were added.

## A10.22 — CSP / third-party scripts / resource hints

- Added CSP Analyzer for enforced headers, Report-Only, static meta policies, directive inventory, risky source expressions, duplicate directives, and missing key restrictions.
- Added Third-party Script Analyzer with bounded static HTML inventory, hostname-based same-host/cross-host classification, async/defer/module signals, parser-blocking candidates, duplicate src detection, SRI/crossorigin signals, and transparent hostname-pattern groups.
- Added Resource Hints Analyzer for preconnect, dns-prefetch, preload, prefetch, modulepreload, and literal preinit, including duplicate, `as`, `crossorigin`, malformed URL, and excessive-preconnect review signals.
- Kept all three tools on SafeHttpFetcher with SSRF, redirect revalidation, peer-IP verification, decoded-body limits, and one page fetch per analyzer.
- Added strict backend contracts, Next.js proxy validation, client runtime validators, RU/EN editorial pages, copyable summaries, parser/API/proxy/renderer tests, and registry gates.
- Registry baseline is now 115 entries and 64 ready public tools; no one-header, one-script, or one-hint microtools were added.

## 0.5.11 — approved homepage redesign patch

- Repositioned WebDiag as a technical SEO audit platform rather than a generic toolbox.
- Added the approved multi-page header navigation and tool-category dropdown.
- Added RU/EN and light/dark controls without a system-theme mode.
- Rebuilt the homepage hero, report preview, audit scenarios, coverage, priorities, process, monitoring, tools, AI, pricing, knowledge, FAQ and final CTA sections.
- Added interactive report tabs with useful per-tab content and transitions.
- Standardized Lucide icons, typography, text colors, spacing, gaps, hover, active and transition tokens.
- Corrected the accessibility icon to a keyboard-oriented symbol.
- Applied the final report-sidebar background fill correction through the full report frame.

## 0.5.10 — Header and section redesign correction

- Reworked header navigation and controls to remove bulky pill-block feeling.
- Rebuilt the hero input/report composition with calmer Electric Pulse hierarchy.
- Normalized section backgrounds to white and cool gray with visible soft transitions.
- Removed mixed pastel card backgrounds from audit and priority sections.
- Redesigned audit modules, priority board, tool mapping, and secondary blocks for stronger section rhythm.

## 0.5.9 — Electric Pulse homepage redesign reset

- Rebuilt the homepage around an Electric Pulse color direction with indigo/blue accents instead of green/teal primary styling.
- Reworked the hero with a new H1, stronger audit bar, tighter report preview, and smoother white/cool-gray background system.
- Replaced the table-like audit section with modular audit cards and varied masonry-style proportions.
- Replaced the priority table with a designed severity board for critical, warning, and improvement findings.
- Reworked workflow, tools, AI, and monitoring sections to reduce repeated layouts and keep utilities secondary to the audit report.

## 0.5.8 — 2026-07-18

- Reworked the 0.5.7 homepage rhythm after visual review: narrower Hero report, stronger URL action, tighter H1 measure, and less dominant right-side preview.
- Moved the audit-scope heading back into a normal left-first reading flow and rebuilt the checks section as a clearer diagnostic matrix.
- Gave priorities, workflow, tools, AI, and monitoring different layout systems and backgrounds instead of repeating the same split-section pattern.
- Replaced the tools list with staggered problem-to-tool cards and rebuilt the AI/monitoring area as four masonry-style cards with alternating widths.
- Updated RU/EN copy to reduce squeezed headings, internal wording, and generic SaaS filler while keeping the audit-first positioning.

## 0.5.7 — 2026-07-18

- Rebuilt the home page around the approved Clinical Audit Intelligence direction.
- Replaced the 0.5.6 SaaS-template composition with a report-first hero, diagnostic matrix, compact priority issue board, workflow timeline, and problem-to-tool mapping.
- Updated RU/EN homepage copy and metadata around technical website audit before SEO growth.
- Shifted the visual system toward controlled teal/indigo audit-product identity and reduced decorative cards, heavy dashboard framing, and purple dominance.
- Left registry/tool algorithms and visual snapshots unchanged.

## 0.5.6 — 2026-07-18

- Reset the homepage visual direction from SaaS feature-grid/dashboard mockups to a report-first audit product page.
- Rebuilt the Hero around a compact URL action, a clear audit report summary, issue rows, and score modules.
- Replaced large feature cards with a diagnostic matrix and compact priority issue list.
- Reduced AI and supporting utilities to secondary layers tied to factual audit findings.
- Updated browser IA expectations for the new report-first structure.

## 0.5.5 — 2026-07-18

- Corrected the failed 0.5.4 visual direction: replaced the heavy dark dashboard/prototype feel with a cleaner light-first audit-product presentation.
- Simplified the hero copy, URL command, report preview, audit modules, and priority cards around a concrete website-audit workflow.
- Localized RU severity labels and removed the visible RU/EN mismatch in the main report and priority sections.
- Reduced the AI block to a secondary post-audit assistant and kept supporting tools below the core diagnostic flow.
- Kept registry definitions, ready-tool count, algorithms, and existing browser snapshots unchanged pending visual review.

## 0.5.4 — 2026-07-18

- Reworked the homepage copy around technical website audit, SEO checking, report priorities, monitoring, and fix tools.
- Polished the audit command center with localized report labels, stronger URL-first CTA, score modules, severity labels, and a priority board with impact, effort, and affected URL metadata.
- Removed internal brief wording from RU homepage copy and kept AI positioned as an assistant after factual checks.
- Made the workspace typography test compatible with handoff archives that intentionally exclude local font binaries while preserving CSS/preload verification.
- Kept registry definitions, ready-tool count, algorithms, and visual snapshots unchanged.

## 0.5.3 — 2026-07-17

- Refined homepage from wireframe-like audit layout to a stronger website-audit product UI.
- Rebuilt hero as a URL audit command card plus report preview shell with rail, health score, metrics, module bars, issue stack, and compact AI assistant drawer.
- Added evidence strip and audit flow board to show crawl → checks → priorities → fix tasks without making AI the main product.
- Kept supporting tools as a post-audit fix layer, not the core positioning.

## 0.5.2 — 2026-07-17

- Reworked the homepage visual system from a wireframe-like layout into a polished website-audit product UI.
- Added a richer audit report hero with URL scan card, health score, severity metrics, module scores, and issue preview.
- Rebuilt audit-scope, priority, AI-assist, monitoring, and supporting-tools sections around technical SEO audit positioning.
- Kept AI as an assistant layer rather than the main product focus.
- Preserved supporting utilities as fix tools around detected audit issues.

## 0.5.1 — 2026-07-17

- Repositioned the public homepage from a generic online-tools directory to website audit / technical SEO diagnostics.
- Rebuilt homepage copy around site checks, issue priorities, reports, monitoring, AI as an assistant layer, and supporting tools for fixes.
- Updated RU/EN header, footer, metadata, JSON-LD descriptions, and catalog positioning.
- Kept image/JSON/hash utilities as secondary support tools, not core product positioning.

## 0.5.0 — 2026-07-17

- Repositioned public marketing, homepage copy, catalog copy, and SEO metadata around the final 120-tool release target.
- Removed the fake search command from the hero preview and replaced it with a non-interactive product proof.
- Added explicit typography tokens for H1 64px, H2 52px, H3 28px, lead 18px, body 16px, and small text 14px.
- Reworked homepage section copy to avoid weak technical wording such as operation/workflow in user-facing Russian text.
- Normalized category cards and directory blocks for a more consistent visual system.

## 0.4.0 — 2026-07-17

- Полностью пересобран Hero и первый экран главной страницы.
- Упрощены RU/EN тексты: меньше технического жаргона, больше понятных пользовательских действий.
- Добавлены новый быстрый старт, асимметричный bento-каталог возможностей, трёхшаговый сценарий, блок преимуществ и новая визуализация локальной обработки.
- Переработаны header, язык, theme control, CTA, каталог и карточки инструментов.
- Обновлены generic tool-page labels и рабочая область без изменения алгоритмов инструментов.
- Visual regression baselines обновлены под новую дизайн-систему и Manrope.

## 0.3.1 — 2026-07-17

### Self-hosted RU/EN typography

- replaced the system sans-serif UI stack with a self-hosted Manrope Variable subset for English and Russian;
- restricted the variable weight axis to 400–700 and reduced the delivered WOFF2 from 55 KB to about 29 KB;
- avoided shipping four redundant static font files that would add roughly 148 KB;
- centralized display, body, UI, sans-serif, and monospace roles in CSS variables;
- preloaded the optimized font in both RU and EN root layouts and retained a dedicated monospace stack for code and machine-readable values;
- added source-contract checks for the WOFF2 signature, size ceiling, weight range, preload, and typography variables.

## 0.3.0 — 2026-07-17

### Product design, content, and SEO architecture

- rebuilt the home page around a concrete browser-utility value proposition, task launcher, real product proof, category bands, processing explanation, use cases, complete directory, FAQ, and final CTA;
- redesigned the catalog into compact, searchable groups for data and development, CSS and design, and image operations;
- moved tool workspaces before explanatory content and added typed RU/EN editorial sections for all 14 ready tools;
- documented supported behavior, limitations, use cases, technical notes, FAQs, and valid related-tool links without exposing internal definitions or claiming unimplemented capabilities;
- refined the desktop and mobile header, including a quieter `RU | EN` segmented navigation and language placement inside the mobile menu;
- added localized Open Graph and Twitter metadata, a static social image, WebSite, ItemList, and BreadcrumbList JSON-LD, and sitemap language alternates;
- expanded production verification to inspect all 32 rendered HTML routes for one H1, titles, descriptions, canonicals, hreflang, social metadata, valid JSON-LD, and internal-definition leakage;
- added screenshot baselines, responsive reflow coverage, and a regression fix preventing UUID and ULID hydration mismatches;
- retained 110 registry definitions, 14 ready tools, browser-local public operations, and the closed public-release gate.

## 0.2.8 — 2026-07-17

### Theme and locale P0 stabilization

- reduced the public theme model to explicit light and dark choices;
- made the first visit light regardless of operating-system or browser preferences;
- added a pre-hydration stored-theme bootstrap, legacy-value migration, persistence, and cross-tab synchronization;
- replaced the native theme select with an accessible two-position switch;
- replaced the single locale link with a stable `RU | EN` segmented navigation that preserves pathname, query, and hash;
- added the Next.js 16 smooth-scroll layout attribute to both root layouts;
- added Playwright theme, locale, console, hydration, mobile, desktop, and axe accessibility smoke tests;
- added a metadata icon and retained 14 ready tools with no registry changes.

## 0.2.7 — 2026-07-16

### Design foundation

- rebuilt the public UI around a light-first visual system with a complete dark theme;
- added persisted theme preferences without relying on a globally activated Python or browser state;
- added a context-preserving RU/EN language switch for home, catalog, and tool routes;
- replaced the placeholder header, footer, home page, catalog, cards, and tool-page shell;
- added catalog search, category filters, URL-preserved category selection, empty states, and result counts;
- removed internal `WD-*` identifiers from public UI;
- added breadcrumbs, local-processing notices, and related-tool navigation;
- added skip links, visible focus states, reduced-motion handling, and responsive navigation;
- added canonical, RU/EN, and `x-default` alternates to public routes;
- corrected UUID Generator classification from media utilities to development and data;
- added route, theme, catalog, UI-foundation, static-route, and client-bundle privacy gates;
- kept all 36 public routes statically prerendered;
- kept the ready-tool count at 14; no unimplemented product section or tool was exposed.

## 0.2.6 — 2026-07-16

- implemented browser-local image optimization, PNG/JPEG/WebP conversion, resizing, and cropping;
- added image geometry, quality, crop, and extension unit tests;
- increased ready tools from 10 to 14;
- added registry-to-renderer contract coverage.

## 0.2.5 — 2026-07-16

- added a cross-platform npm wrapper that always uses the project `.venv` interpreter;
- added Windows/POSIX runtime-selection tests and actionable missing-environment errors;
- removed dependence on manual virtual-environment activation from verification commands.

## 0.2.4 — 2026-07-16

- synchronized JavaScript and Python package versions;
- repaired local npm workspace resolution for shared packages;
- added workspace-integrity tests and a clean installation gate.

## 0.2.2 — 2026-07-16

- removed private OpenAI registry URLs from `package-lock.json`;
- restored public npm registry resolution;
- documented recovery from the invalid lock-file URLs.

## 0.2.0 — 2026-07-16

- created the executable npm/Python monorepo;
- imported the internal 110-tool registry;
- implemented the first ten browser-only tools;
- added RU/EN routing, FastAPI, worker foundations, and the public-release gate.
