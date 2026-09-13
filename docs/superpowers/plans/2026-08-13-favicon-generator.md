# Favicon generator implementation plan

**Goal:** Publish one bounded browser-local favicon asset generator without
claiming ICO, ZIP, SVG, deployment, or validation capability.

**Architecture:** Pure helpers define the square crop, fixed asset set, and
plain-text integration snippets. A client component reuses the current raster
decode and Canvas safety limits, owns generated object URLs, and exposes each
PNG as an individual download. The registry remains the source of truth.

## Task 1: RED contract tests

- Add failing tests for portrait/landscape/square center crops.
- Add failing tests for the exact five asset descriptors.
- Add failing tests for bounded HTML and manifest snippets.
- Add failing registry, renderer, and editorial coverage expectations.
- Run only the affected tests and record the expected missing-contract failure.

## Task 2: Pure generator contract

- Add crop and asset/snippet helpers to `image-advanced-tools.tsx`.
- Keep output filenames and dimensions fixed and deterministic.
- Reject invalid source dimensions through the existing core gate.

## Task 3: Browser UI and publication

- Add `FaviconGeneratorTool` with bounded raster upload and center-crop notice.
- Generate five PNG blobs without network or persistence.
- Revoke replaced/unmounted object URLs.
- Add the renderer allowlist/switch case, bilingual editorial page, and precise
  registry description/state transition.

## Task 4: Targeted verification and visual QA

- Run affected Vitest suites, registry verification, lint, and typecheck once.
- Build once and run focused Playwright coverage in desktop/mobile Chromium.
- Capture and inspect controlled-fixture screenshots; fix source defects before
  accepting the result.
- Run `git diff --check`, commit the thematic patch, and push the existing branch.
