# WebDiag account Operations Workspace design

## Status and intent

- Approved product direction: a hybrid workspace for site owners and specialists.
- Default views explain the current state and next action in plain language.
- Expert evidence, affected URLs, raw check names, and diagnostic detail remain available through progressive disclosure.
- The visual benchmark is the compositional quality of the referenced Vella fintech dashboard: disciplined hierarchy, compact navigation, restrained surfaces, and high information clarity. WebDiag will not copy its brand, illustrations, assets, or finance-specific layouts.
- The account must display only persisted WebDiag data. It must not invent health percentages, uptime, incidents, trends, notifications, AI conclusions, or historical values.

## Factual current baseline

The current account already provides authenticated RU/EN routes for projects, saved audits, deterministic issues, monitoring, reports, HTML/print export, and hash-only public report sharing. It validates frontend API responses against versioned contracts and has accessible mobile drawer behavior.

The current product surface is still an engineering workspace rather than a finished customer workspace:

- the overview largely repeats recent and all-project lists;
- project context is not consistently preserved across report routes;
- navigation does not expose issues or monitoring as first-class project tasks;
- monitor and audit states expose backend-oriented labels;
- reports reproduce the immutable diagnostic snapshot but do not provide a client-reading hierarchy;
- empty, failed, expired, revoked, and transitional states are visually inconsistent;
- the authenticated shell and public site header can present conflicting account actions;
- project creation dominates the overview even after projects exist.

This redesign changes presentation and orchestration around existing contracts first. Missing lifecycle functions must not be represented as working controls until their backend contracts exist.

## Product model

The workspace has two levels:

1. **Portfolio level** — account overview, project list, reports, and account actions.
2. **Project level** — project summary, audit history, issues, monitoring, and project reports.

Every project-level route carries a project identifier. The selected project appears in the workspace header and project switcher. Switching projects navigates to the equivalent safe project landing route; it must not retain an audit or report identifier belonging to another project.

## Information architecture

### Persistent workspace shell

Desktop uses a compact fixed-width left rail and a flexible content canvas. The rail contains:

- WebDiag product identity;
- Overview;
- Projects;
- Reports;
- account identity and sign-out at the bottom.

When a project is selected, a project task group appears below the switcher:

- Project overview;
- Audits;
- Issues;
- Monitoring;
- Reports for this project.

The content header contains the current page title, project origin when applicable, language switch, project switcher, and no more than one primary action. The authenticated shell replaces conflicting public sign-in navigation on account routes.

Mobile uses a compact top bar and modal drawer with focus containment, Escape dismissal, backdrop dismissal, focus restoration, and body-scroll locking. Project context and the primary action remain visible without horizontal scrolling.

### Account overview

The overview answers four questions: what needs attention, what changed, what should happen next, and which project should be opened.

For accounts with projects, the first viewport contains:

- greeting and concise account context;
- real portfolio counts derived from loaded project data;
- a next-actions panel based only on deterministic states such as no saved audit, failed monitor, changed monitor run, or an available report;
- recently updated projects with their latest available persisted audit/monitor state;
- a secondary “add project” action.

For a new account, project creation becomes the primary empty-state task. It explains accepted public origins in user language and leaves validation/security details to inline help and errors.

No global health score is shown unless a defined backend contract supplies it. Counts cannot imply cross-project history that has not been loaded.

### Project overview

The project header shows name, canonical origin, last persisted activity, and the most relevant action. Its body contains:

- latest saved audit summary;
- issue counts grouped by defined priority values;
- latest monitor status, last run, next scheduled run, and consecutive failures when a monitor exists;
- deterministic change summary from the latest monitor run;
- recent immutable reports for the project;
- explicit empty states for missing audit, monitoring, or report data.

Dates are localized. Internal enum values never appear directly. Null scores are rendered as “not calculated,” not zero.

### Audits and issues

Audit history is chronological, bounded by the existing backend response, and shows completion time, check count, issue count, and score only when present.

The issue list defaults to fix order. It provides category and priority filters, result count, and a clear reset action. Each issue row shows:

- localized priority label;
- title and short explanation;
- category;
- affected URL count;
- next recommended action.

Issue detail separates customer-readable guidance from expert evidence:

1. impact and why the issue matters;
2. recommended steps in order;
3. affected URLs;
4. technical identifiers and source category in an expandable expert block.

The UI does not rerun an audit while browsing persisted issues.

### Monitoring

Monitoring is presented as scheduled comparison of persisted audits, not as fabricated uptime monitoring.

The page shows:

- enabled/paused state;
- localized cadence;
- configured timezone with an accessible advanced selector;
- last and next run timestamps;
- current execution state;
- consecutive failure count when non-zero;
- manual run action with pending/running protection;
- bounded run history with baseline, unchanged, changed, and failed outcomes;
- added/resolved issue counts and score delta only when supplied by the contract.

Raw error codes remain hidden from normal copy and may appear only in an expert diagnostic disclosure with no stack traces or secrets. Pause, cadence, and timezone changes use optimistic feedback only after a valid API response; otherwise the previous state remains visible with a recoverable error.

### Reports

The account report list supports portfolio and project context. Each entry shows title, project, audit date, report locale, creation date, share state, and share expiry when present.

The report reading order is:

1. report title, project, origin, audit date, and generation date;
2. executive summary derived deterministically from the immutable snapshot;
3. priority distribution and first recommended actions;
4. issue groups ordered by fix order/priority;
5. passed and non-passing checks;
6. methodology and scope notes;
7. export and sharing actions.

The executive summary may rephrase and count existing snapshot data, but must not add AI interpretation, business impact figures, or claims absent from the snapshot. RU reports use RU interface labels; stored diagnostic content is shown as stored until a versioned localization contract exists.

Share creation discloses the token URL once and immediately provides a copy action. Revoke and replace actions require explicit confirmation and explain that existing links stop working. Expired, revoked, malformed, and unavailable public reports use the same neutral unavailable state and do not reveal whether a report exists. Public report pages retain noindex/no-store behavior.

### Account lifecycle

The finished navigation reserves a low-prominence Account entry for identity, password change, and session controls. These controls are rendered only after backend endpoints, validation, rate limits, ownership checks, and security regression tests are implemented. Payment and Lava.top controls remain absent until the product, domain, pricing, and security gates are complete.

Project rename and recoverable archival are preferred over immediate permanent deletion. They require a separate persistence/API patch and must not be implied by inactive controls. Permanent deletion, if added later, requires an explicit typed confirmation and a documented retention policy for audits, monitors, reports, and shares.

## Interaction states

Every data-bearing surface defines:

- loading skeleton with stable geometry and `aria-busy`;
- first-use empty state with one next action;
- filtered-empty state with reset action;
- recoverable request failure with retry;
- unauthorized state that routes to sign-in without exposing account data;
- not-found state that preserves ownership-hiding behavior;
- pending mutation state that prevents duplicate submission;
- success feedback near the initiating control;
- expired/revoked share state with no ownership disclosure.

Forms keep labels visible, associate errors with fields, preserve safe entered values after server validation failures, and use native form semantics. Login and registration must have a safe non-GET fallback so credentials can never enter the URL if client JavaScript fails.

## Visual system

The account remains within the WebDiag design system. Existing global tokens are used wherever they satisfy the design. Any required account-only tokens are declared before use and mapped to an existing semantic purpose.

Direction:

- neutral light canvas with a restrained cool tint;
- white primary surfaces;
- blue-violet primary accent;
- semantic red, amber, green, and blue used only for meaning;
- one-pixel borders and limited low-elevation shadows;
- moderate radii, not pill-shaped containers everywhere;
- compact 4/8-point spacing rhythm;
- strong page/title hierarchy and muted metadata;
- tabular numerals for counts, scores, and timestamps;
- charts only for real ordered historical values with text alternatives.

Color alone never carries status. Interactive targets remain at least 44 by 44 CSS pixels on touch layouts. Visible focus states, contrast, reduced-motion behavior, keyboard order, headings, landmarks, table semantics, and live-region behavior are release requirements.

## Responsive layout

- **Wide desktop:** rail plus a 12-column content grid, with the dominant decision/action panel receiving the most width.
- **Standard desktop/tablet:** rail narrows; two-column cards collapse according to content priority rather than equal widths.
- **Mobile:** one content column; primary action near the page title; filters become a bounded disclosure; tables become labeled stacked rows without losing field names.
- No account screen may depend on hover or require horizontal page scrolling at supported viewport widths.

## API and data boundaries

- Existing response validators remain strict and versioned.
- Presentation selectors may combine already-loaded contract fields but may not infer unavailable facts.
- Cross-project aggregation requires a bounded backend aggregate contract if loading individual project resources would create an N+1 request pattern.
- All account fetches remain same-origin, credentialed, and no-store.
- Project, audit, issue, monitor, and report identifiers always come from the authenticated route context; client-provided user identifiers are never accepted.
- UI changes must preserve ownership-hiding 404 behavior and stable account error envelopes.
- New mutation endpoints, if required, follow test-first backend development with authorization, malformed identifier, cross-account, injection, request-size, and concurrency coverage.

## Delivery sequence

1. Safe authentication fallback and authenticated shell consistency.
2. Workspace foundation: navigation, responsive shell, project context, tokens, and common states.
3. Account and project overviews built from real persisted data.
4. Audits and issues progressive-disclosure experience.
5. Monitoring schedule, state, and history experience.
6. Client-readable report hierarchy, share/copy/revoke flows, export parity.
7. Account lifecycle backend contracts and UI where approved and implemented.
8. Accessibility, security, localization, browser, and visual QA.

Each patch receives focused unit/component tests while changing. Unchanged suites are not repeatedly rerun. Before completion, one fresh affected-package/full-project verification is required according to repository policy, including browser coverage at desktop and mobile sizes.

## Acceptance criteria

- A new user can create the first project without being shown irrelevant portfolio UI.
- A returning user can identify the next real action from the first viewport.
- A specialist can reach issue evidence and affected URLs without losing project/audit context.
- A client can read a shared report from summary to evidence without internal enum labels or invented claims.
- Monitoring clearly distinguishes scheduled comparison from unimplemented uptime/notification capabilities.
- RU and EN routes have equivalent information architecture and state handling.
- Keyboard, screen-reader, reduced-motion, and mobile workflows remain functional.
- Credentials never enter a URL through native form fallback.
- No new account control appears functional before its backend contract exists.
- No design change weakens authentication, ownership, no-store, noindex, share-token, or request-boundary protections.

## Explicitly deferred

- Lava.top and all payment integration;
- visual redesign of the public marketing site;
- fabricated uptime, availability, incident, notification, or AI-analysis features;
- permanent destructive project deletion without a separately approved retention design;
- localization of stored historical diagnostic prose without a versioned data migration/translation contract.
