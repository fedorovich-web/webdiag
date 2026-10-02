# WebDiag Full Codebase Audit & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce WebDiag to a maintainable production codebase with no confirmed dead code, brittle tests, accidental duplicate implementations, obsolete styling layers, unused dependencies, or avoidable CI/security debt while preserving product behavior.

**Architecture:** Audit the repository as two explicit dependency graphs: the TypeScript/Next.js workspace graph (`apps/web`, `packages/tool-core`, `packages/tool-registry`) and the Python service graph (`apps/api`, `apps/worker`). Deletions require evidence from imports, route/actor wiring, manifests, tests, build output, or runtime smoke checks; ambiguous code is retained until its ownership is proven. Cleanup is performed in small commits with CI verification after each risk-bearing change.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, ESLint 9, Vitest, Playwright, Python 3.13/3.14, FastAPI, Dramatiq, Ruff, Pytest, Docker Compose, GitHub Actions.

**Spec:** User request in the WebDiag project conversation dated 2026-09-12: full code audit and removal of unused code, hacks, dead code and AI-generated slop without regressions.

## Global Constraints

- Preserve the approved homepage design and existing product behavior unless a behavior is demonstrably broken.
- Never delete code based only on naming, age, or apparent duplication; prove it is unreachable or superseded.
- Do not use `npm audit fix --force` or broad dependency upgrades without identifying the vulnerable dependency path and compatibility impact.
- Do not weaken tests, lint, type safety, security checks, dependency pinning, or production smoke gates to make CI green.
- Keep Python support at `>=3.13,<3.15` and Node support at `>=22,<25` unless a separate compatibility decision changes it.
- Keep commits scoped so a regression can be attributed and reverted independently.
- Treat `main`/`master` as protected; work only in `feature/backend-production-readiness` until final review.

---

### Task 1: Establish a trustworthy green baseline

**Files:**
- Modify only failing tests whose assertions are demonstrably stale or brittle.
- Inspect `.github/workflows/ci.yml`, root `package.json`, workspace manifests and current workflow logs.

**Interfaces:**
- Consumes: current branch CI and existing product contracts.
- Produces: a baseline where failures represent real regressions rather than stale assertions.

- [ ] **Step 1:** Reproduce each current CI failure from the workflow log and identify the exact failing assertion or command.
- [ ] **Step 2:** For a stale assertion, compare the assertion with the production function it tests and preserve the production behavior when it is already correct.
- [ ] **Step 3:** Replace brittle keyword/regex assertions with deterministic contract assertions when exact copy or exact structure is the intended contract.
- [ ] **Step 4:** Push the smallest test-only correction and require the full workflow to advance beyond the previously failing stage.
- [ ] **Step 5:** Record any remaining baseline failures separately; do not combine unrelated fixes in the same commit.

### Task 2: Strengthen TypeScript dead-code detection

**Files:**
- Inspect/modify: `tsconfig.base.json`, `apps/web/tsconfig.json`, `eslint.config.mjs`.
- Test: root `typecheck`, `lint`, unit tests and build.

**Interfaces:**
- Consumes: current TypeScript project boundaries and Next.js generated types.
- Produces: static checks that surface unused locals/parameters without false positives from generated code.

- [ ] **Step 1:** Inspect the web tsconfig include/exclude set and current ESLint rules before changing compiler flags.
- [ ] **Step 2:** Enable `noUnusedLocals` and `noUnusedParameters` only where the existing source graph can be remediated without generated-file noise.
- [ ] **Step 3:** Run/observe typecheck and classify every new failure as dead code, intentional API surface, or framework-required parameter.
- [ ] **Step 4:** Delete genuinely unused symbols; use intentional naming only for parameters required by a framework or interface, never to conceal removable code.
- [ ] **Step 5:** Keep the stricter check only after lint, typecheck, unit tests and build are green.

### Task 3: Audit the Next.js route and component graph

**Files:**
- Inspect: `apps/web/app/**`, `apps/web/src/components/**`, `apps/web/src/features/**`, `apps/web/src/lib/**`, `apps/web/content/**`.
- Test: relevant Vitest suites, Next build, Playwright smoke.

**Interfaces:**
- Consumes: App Router entry points, imports from route files and shared components.
- Produces: reachable route/component graph with unused components, helpers, clients and duplicate wrappers removed.

- [ ] **Step 1:** Enumerate every App Router entry point (`page`, `layout`, `route`, metadata/sitemap/robots files) and its direct feature dependencies.
- [ ] **Step 2:** Enumerate exported components/helpers in `src` and trace production imports separately from test-only imports.
- [ ] **Step 3:** Delete a source file/export only when no production entry point, dynamic import, registry, test fixture contract or build script references it.
- [ ] **Step 4:** Consolidate duplicate helper implementations only when their semantics and error handling are equivalent; add/update focused tests before replacement.
- [ ] **Step 5:** Run build and browser smoke after each route/component cleanup batch.

### Task 4: Consolidate homepage CSS and remove legacy styling layers

**Files:**
- Inspect: `apps/web/app/globals.css`, `home-v11.css`, `home-fidelity.css`, `home-polish.css`, `apps/web/src/features/home/home-fidelity.module.css`, homepage component imports.
- Test: `home-design.spec.ts`, homepage Chromium artifact at desktop/mobile target widths.

**Interfaces:**
- Consumes: approved Fresh Mint visual reference and current homepage DOM classes.
- Produces: the minimum number of style layers needed to reproduce the approved page, without obsolete overrides or specificity wars.

- [ ] **Step 1:** Establish actual CSS import order and identify selectors that are fully overridden by later layers.
- [ ] **Step 2:** Group selectors by homepage section and compare duplicate declarations property-by-property.
- [ ] **Step 3:** Move the effective declaration to the owning stylesheet/module before deleting an obsolete rule; do not rely on increasing specificity.
- [ ] **Step 4:** Remove empty/obsolete selectors and legacy visual emulation rules once Chromium screenshots confirm no visual regression.
- [ ] **Step 5:** Verify 375/390/430/768/1024/1440 widths and desktop/mobile screenshots before declaring the consolidation complete.

### Task 5: Audit shared package public APIs

**Files:**
- Inspect: `packages/tool-core/src/**`, `packages/tool-registry/src/**`, both `src/index.ts` files and package tests.
- Test: package unit tests plus consuming web build/typecheck.

**Interfaces:**
- Consumes: package export barrels and imports from `apps/web` and repository scripts.
- Produces: minimal intentional public exports with no stale compatibility aliases or unreachable helpers.

- [ ] **Step 1:** Map every barrel export to all repository consumers.
- [ ] **Step 2:** Distinguish public package API, internal implementation and test-only utilities.
- [ ] **Step 3:** Remove unused exports and their private implementations only when all consumers are absent.
- [ ] **Step 4:** Collapse compatibility aliases only when no persisted data, tool registry identifier or external route contract depends on them.
- [ ] **Step 5:** Verify registry/core tests, web typecheck and Next build.

### Task 6: Audit Python API wiring and service boundaries

**Files:**
- Inspect: `apps/api/src/webdiag_api/main.py`, `config.py`, `recovery.py`, `registry.py`, `validation.py`, and all subpackages under `accounts`, `ai`, `audit`, `crawl`, `security`, `tools`, `data`.
- Test: `apps/api/tests/**`, Ruff, production API image smoke.

**Interfaces:**
- Consumes: FastAPI router registration, dependency injection, storage/service imports and persisted contracts.
- Produces: router/service graph with no unregistered endpoints, orphan modules, duplicate validation or unused compatibility paths.

- [ ] **Step 1:** Start at `main.py` and map every included router and startup/runtime dependency.
- [ ] **Step 2:** Trace services/storage/models from routers inward and identify modules with no production import path.
- [ ] **Step 3:** Treat reflection, import-time registration, environment-selected providers and migration/recovery paths as dynamic references that must be proved before deletion.
- [ ] **Step 4:** Remove confirmed orphan code in one subsystem at a time and run its focused tests plus full API tests/Ruff.
- [ ] **Step 5:** Build and smoke the production API image after each structural cleanup batch.

### Task 7: Audit worker actors, scheduler and provider graph

**Files:**
- Inspect: `apps/worker/src/webdiag_worker/actors.py`, `broker.py`, `scheduler.py`, `ai.py`, `crawler.py`, `monitoring.py`, `artifact_storage.py`, `image_output.py`, `tool_contracts.py`, `vercel_gateway_provider.py`.
- Test: `apps/worker/tests/**`, Ruff, production worker/scheduler image smoke.

**Interfaces:**
- Consumes: Dramatiq actor registration, scheduler dispatch, API-to-worker payload contracts and optional provider configuration.
- Produces: explicit actor/provider graph with dead actors/providers/helpers removed and contracts kept synchronized.

- [ ] **Step 1:** Map every actor name from declaration through dispatch/caller and tests.
- [ ] **Step 2:** Map scheduler jobs and optional AI/provider paths, including environment-driven loading.
- [ ] **Step 3:** Identify large modules with mixed responsibilities and separate true duplication from shared provider logic before refactoring.
- [ ] **Step 4:** Delete only actors/helpers with no producer, dynamic registration or persisted queue compatibility requirement.
- [ ] **Step 5:** Run worker tests/Ruff and production worker/scheduler image smoke.

### Task 8: Audit scripts, CI and duplicated verification logic

**Files:**
- Inspect: `scripts/**`, `.github/workflows/ci.yml`, root npm scripts, Dockerfiles and Compose verification scripts.
- Test: `test:workspace`, workflow security tests and full CI.

**Interfaces:**
- Consumes: release, registry, Python lock, Compose and source-manifest gates.
- Produces: one clear verification path per invariant, with no obsolete scripts or CI steps silently duplicating different rules.

- [ ] **Step 1:** Map every root npm script to direct human/CI callers.
- [ ] **Step 2:** Map every script file to npm scripts, workflow steps, tests or documentation callers.
- [ ] **Step 3:** Remove scripts with no caller only after confirming they are not documented operational commands.
- [ ] **Step 4:** Deduplicate verification code by extracting shared pure logic only where multiple gates enforce the same invariant.
- [ ] **Step 5:** Re-run workspace integrity/security tests and full CI.

### Task 9: Dependency and supply-chain audit

**Files:**
- Inspect: root/workspace `package.json`, `package-lock.json`, Python pyprojects/locks, `.npmrc`, Dependabot config, Docker image pins, workflow action SHAs.
- Test: `npm ci`, dependency consistency gates, Python lock verification, container builds.

**Interfaces:**
- Consumes: current dependency manifests and advisories.
- Produces: justified dependency set with unused direct dependencies removed and actionable vulnerabilities upgraded without breaking contracts.

- [ ] **Step 1:** Resolve every direct JS dependency to production imports; remove a dependency only when no runtime/build/config consumer exists.
- [ ] **Step 2:** Resolve `npm audit` findings to exact vulnerable packages, dependency paths, patched versions and runtime/dev exposure before changing versions.
- [ ] **Step 3:** Review install-script warnings (`esbuild`, `unrs-resolver`) and `.npmrc` policy; approve nothing implicitly merely to silence npm.
- [ ] **Step 4:** Review Python direct dependencies against imports and lock parity; preserve platform markers and exact hashes.
- [ ] **Step 5:** Review pinned GitHub Actions for runtime deprecation warnings and move only to verified immutable SHAs of supported releases.

### Task 10: Final anti-slop review and release-quality verification

**Files:**
- Review all files changed by Tasks 1–9 and compare the branch against the pre-audit baseline.

**Interfaces:**
- Consumes: all cleanup commits and CI evidence.
- Produces: audited branch ready for final product review.

- [ ] **Step 1:** Review changed code for unnecessary abstraction, one-use wrappers, vague names, duplicated comments, defensive branches that cannot occur, and type assertions hiding real model problems.
- [ ] **Step 2:** Search for suppression markers (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, Ruff `noqa`, broad exception catches) and justify or remove each one.
- [ ] **Step 3:** Search for `TODO`/`FIXME`/temporary/demo/mock/fallback code in production paths and classify each occurrence before keeping it.
- [ ] **Step 4:** Require registry tests, unit tests, lint, typecheck, Next build, browser tests, Python tests/Ruff, Python lock checks, Compose checks, production image builds and smoke tests to pass.
- [ ] **Step 5:** Perform final desktop/mobile homepage visual QA and report remaining intentional debt separately from completed cleanup.
