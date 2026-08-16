# Tool Error Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw tool exception messages with a stable, safe, fully localized RU/EN user-error boundary.

**Architecture:** Introduce one allowlisted error-code catalog and `ToolUserError` for deterministic local validation. API error codes and bounded local parameters map to localized copy; every unknown value maps to a generic fallback. Migrate tools in three coherent groups and enforce the boundary with a source gate.

**Tech Stack:** TypeScript, React, Next.js, Node test runner.

## Global Constraints

- Never render arbitrary `Error.message`, response bodies, stack traces, or provider details.
- Preserve current API contracts and server-side validation/authorization.
- Use only bounded stable codes and typed numeric/string parameters.
- Keep RU and EN catalogs complete for every exposed code.
- Run one RED and one GREEN test command per migration group.

---

### Task 1: Add the shared boundary and source gate

**Files:**
- Create: `apps/web/src/features/tools/tool-error-presentation.ts`
- Create: `apps/web/src/features/tools/tool-error-presentation.test.ts`
- Modify: `scripts/tests-workspace-integrity.test.mjs`

- [ ] Add failing tests for known API codes, local codes with bounded parameters, unknown exceptions, RU/EN parity, and source rejection of visible `caught.message` usage.
- [ ] Run the focused tool-error and workspace-integrity tests once and confirm RED.
- [ ] Implement `ToolUserError`, the exhaustive catalog, parameter formatting, and generic fallback.
- [ ] Run the same tests once and require GREEN for the boundary itself.

### Task 2: Migrate API-backed workbenches

**Files:**
- Modify: API-backed tool components under `apps/web/src/features/tools/` found by the source gate.
- Modify: their existing `*-tools.test.ts`, `*-tool-contract.test.ts`, and proxy-route tests only where behavior changes.

- [ ] Add failing assertions for localized known codes and safe unknown-error fallback in representative tools from every API-backed family.
- [ ] Run the affected API-backed tool test files once and confirm RED.
- [ ] Replace raw message rendering with the shared boundary without changing request/response contracts.
- [ ] Run the same affected files once and require GREEN.

### Task 3: Migrate media/browser and structured/text workbenches

**Files:**
- Modify: local image, QR, srcset, CSS, structured-data, query/code, text/encoding, and generator components under `apps/web/src/features/tools/`.
- Modify: their adjacent tests.

- [ ] Add failing assertions for stable local codes, localized bounds/row references, and unknown fallback.
- [ ] Run the affected local-tool tests once and confirm RED.
- [ ] Replace user-visible English throws with `ToolUserError` codes and route all catches through the shared presenter.
- [ ] Run the affected local-tool tests plus the source gate once and require GREEN.
- [ ] Commit the subsystem as `fix(tools): localize safe error boundaries`.
