# Portfolio MVP AI Workspace Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the authenticated RU/EN AI workspace and a complete Audit Copilot vertical slice on top of the existing safe AI API without activating an unevaluated provider tool.

**Architecture:** The Next.js application exposes same-origin account routes that forward only the session cookie and a validated idempotency key to FastAPI. Strict TypeScript guards validate every catalog, credit, and run payload before React sees it; focused components render catalog/history, the Audit Copilot form, and its grounded structured result. The existing FastAPI resolver remains authoritative for project/audit ownership and provider input, so client route context is only a convenience.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest, Playwright, FastAPI/Pydantic v2, existing SQLite AI ledger and Dramatiq/OpenRouter worker.

**Spec:** `docs/superpowers/specs/2026-09-10-webdiag-portfolio-mvp-ai-suite-design.md`

## Global Constraints

- Work only on `feature/backend-production-readiness`; do not create a branch, merge, deploy, release, or modify `main`.
- Keep all six AI tools internal until real RU/EN evaluation, provider smoke, measured cost, approved fixed credit prices, production preflight, and an explicit catalog activation change pass.
- Anonymous AI execution is forbidden; every run and source resource remains account-owned.
- Do not expose provider secrets, raw prompts, raw responses, provider error bodies, stack traces, or internal infrastructure details.
- Reject unknown fields and invalid payload shapes at every public boundary; do not use `any`, unchecked casts, or error suppression.
- This plan adds no dependencies and no image, audio, binary upload, payment, CMS publication, or website-mutation capability.
- UI copy is RU-first with equivalent EN copy; do not present fixture data or unavailable tools as real results.
- New business logic follows TDD; run one targeted test command after each grouped patch and one fresh relevant full verification at the end.
- Preserve the existing account shell, mobile drawer focus management, dark theme, ownership-safe 404 behavior, and SSRF/injection protections.

## Delivery split

This is the first of three independently reviewable implementation plans:

1. this plan — shared public AI workspace plus Audit Copilot vertical slice;
2. project evidence capture plus Competitor Gap, Content Strategy, Content Optimizer, Search Intent & Page Fit, and Internal Linking Planner;
3. real-provider evaluation, cost approval, individual activation, production overlay verification, and final browser/release gates.

The first slice is production-safe while tools remain internal: the real UI shows an honest unavailable state, and contract/browser tests exercise the ready-tool path with controlled fixtures.

---

### Task 1: Add stable AI workspace routes and navigation

**Files:**
- Modify: `apps/web/src/lib/routes.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell-contract.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell-contract.test.ts`

**Interfaces:**
- Consumes: existing `Locale`, `accountPath()`, and account workspace navigation builders.
- Produces: `accountAIPath(locale: Locale): string`, section ID `"ai"`, and portfolio navigation ID `"ai"` for later pages and contextual actions.

- [ ] **Step 1: Write the failing route and navigation assertions**

```ts
expect(accountAIPath("ru")).toBe("/account/ai");
expect(accountAIPath("en")).toBe("/en/account/ai");

const navigation = buildAccountWorkspaceNavigation("ru", "ai");
expect(navigation.portfolio.map((item) => item.id)).toEqual([
  "overview", "projects", "ai", "reports", "account",
]);
expect(navigation.portfolio[2]).toMatchObject({
  label: "AI-инструменты",
  href: "/account/ai",
  active: true,
});
```

- [ ] **Step 2: Run the targeted test and observe RED**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-workspace-shell-contract.test.ts`

Expected: FAIL because `accountAIPath` and the `ai` navigation entries do not exist.

- [ ] **Step 3: Implement the route and navigation entry**

```ts
export function accountAIPath(locale: Locale): string {
  return `${accountPath(locale)}/ai`;
}
```

Extend `AccountWorkspaceSection` and `AccountWorkspaceNavigationId` with `"ai"`, import `accountAIPath`, and insert this item between Projects and Reports:

```ts
{
  id: "ai",
  label: ru ? "AI-инструменты" : "AI tools",
  href: accountAIPath(locale),
  active: section === "ai",
  disabled: false,
}
```

- [ ] **Step 4: Run the targeted test and observe GREEN**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-workspace-shell-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the navigation contract**

```bash
git add apps/web/src/lib/routes.ts apps/web/src/features/account/account-workspace-shell-contract.ts apps/web/src/features/account/account-workspace-shell-contract.test.ts
git commit -m "feat(account): add AI workspace navigation"
```

### Task 2: Define strict browser-side AI contracts

**Files:**
- Create: `apps/web/src/features/account/account-ai-contract.ts`
- Create: `apps/web/src/features/account/account-ai-contract.test.ts`

**Interfaces:**
- Consumes: FastAPI response contracts `webdiag.ai.catalog.v1`, `webdiag.credits.balance.v1`, `webdiag.ai.run.v1`, and `webdiag.ai.run_list.v1`.
- Produces: `AIToolId`, `AIToolSummary`, `AICatalogResponse`, `AICreditBalanceResponse`, `AIRun`, `AIRunDetailResponse`, `AIRunListResponse`, `AuditActionPlanOutput`, `isAICatalogResponse()`, `isAICreditBalanceResponse()`, `isAIRunDetailResponse()`, and `isAIRunListResponse()`.

- [ ] **Step 1: Write failing validation tests with valid and hostile payloads**

```ts
const succeeded = {
  contract_version: "webdiag.ai.run.v1",
  run: {
    id: "11111111-1111-4111-8111-111111111111",
    tool_id: "ai_audit_action_plan",
    contract_version: "v1",
    credit_price: 7,
    state: "succeeded",
    output: {
      summary: "Fix the verified title issue first.",
      actions: [{
        issue_ids: ["issue-title"],
        title: "Add a descriptive title",
        rationale: "The saved audit found the issue.",
        steps: ["Publish a descriptive title."],
        verification: "Run the deterministic title check again.",
        affected_urls: ["https://example.com/page"],
      }],
    },
    error_code: null,
    created_at: "2026-09-10T12:00:00Z",
    updated_at: "2026-09-10T12:01:00Z",
  },
};

expect(isAIRunDetailResponse(succeeded)).toBe(true);
expect(isAIRunDetailResponse({ ...succeeded, debug_prompt: "secret" })).toBe(false);
expect(isAIRunDetailResponse({
  ...succeeded,
  run: { ...succeeded.run, output: { summary: "x", actions: [] } },
})).toBe(false);
```

Cover all six allowlisted tool IDs, all six persisted states, positive integer credit prices, UUIDs, timestamps, nullable output/error rules, exact keys, bounded action arrays, HTTP(S) affected URLs, and rejection of unknown tool IDs and fields.

- [ ] **Step 2: Run the contract test and observe RED**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-contract.test.ts`

Expected: FAIL because the contract module does not exist.

- [ ] **Step 3: Implement exact-key runtime guards without assertions**

Use small reusable predicates:

```ts
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
```

Define `AI_TOOL_IDS` as a readonly tuple and derive the union from it:

```ts
export const AI_TOOL_IDS = [
  "ai_audit_action_plan",
  "ai_competitor_gap_report",
  "ai_content_brief",
  "ai_content_optimizer",
  "ai_search_intent_page_fit",
  "ai_internal_linking_planner",
] as const;

export type AIToolId = (typeof AI_TOOL_IDS)[number];
```

Validate `output` according to `tool_id`; in this first slice, accept a non-null output only for `ai_audit_action_plan`. Other succeeded tool outputs remain rejected until their focused renderers land in plan 2. Non-succeeded runs require `output === null`; succeeded runs require `error_code === null`.

- [ ] **Step 4: Run the contract test and observe GREEN**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the strict web contracts**

```bash
git add apps/web/src/features/account/account-ai-contract.ts apps/web/src/features/account/account-ai-contract.test.ts
git commit -m "feat(account): validate AI workspace contracts"
```

### Task 3: Add a bounded same-origin AI proxy

**Files:**
- Create: `apps/web/src/features/account/account-ai-proxy.ts`
- Create: `apps/web/src/features/account/account-ai-proxy.test.ts`
- Create: `apps/web/app/api/account/ai/catalog/route.ts`
- Create: `apps/web/app/api/account/ai/runs/route.ts`
- Create: `apps/web/app/api/account/ai/runs/[runId]/route.ts`
- Create: `apps/web/app/api/account/credits/route.ts`

**Interfaces:**
- Consumes: `resolveAccountApiBaseUrl()`, `selectAccountSessionCookie()`, `validAccountResourceId()`, and upstream FastAPI account AI routes.
- Produces: `selectAIIdempotencyKey(value: string | null): string | null`, `accountAIRunPath(runId: string): string | null`, and `proxyAccountAI(request, options)`.

- [ ] **Step 1: Write failing proxy-boundary tests**

```ts
expect(selectAIIdempotencyKey("550e8400-e29b-41d4-a716-446655440000"))
  .toBe("550e8400-e29b-41d4-a716-446655440000");
expect(selectAIIdempotencyKey(" too-short ")).toBeNull();
expect(selectAIIdempotencyKey("line\nbreak-value")).toBeNull();
expect(accountAIRunPath("11111111-1111-4111-8111-111111111111"))
  .toBe("/v1/account/ai/runs/11111111-1111-4111-8111-111111111111");
expect(accountAIRunPath("../credits")).toBeNull();
```

Also exercise a 300,001-byte body rejection, malformed upstream JSON, timeout mapping, and the rule that only the selected session cookie and validated `Idempotency-Key` are forwarded.

- [ ] **Step 2: Run the proxy test and observe RED**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-proxy.test.ts`

Expected: FAIL because the proxy module does not exist.

- [ ] **Step 3: Implement the focused proxy**

Use `MAX_BODY_BYTES = 300_000`, a 12-second proxy timeout, `cache: "no-store"`, and `accept: "application/json"`. Accept only `GET`, `POST`, and `DELETE`. For POST bodies, forward `content-type: application/json`. For run creation, reject a missing or invalid idempotency header locally with `ai_invalid_idempotency_key` and status 422. Never forward arbitrary browser headers.

Route mappings are exact:

```ts
// /api/account/ai/catalog -> /v1/account/ai/catalog
// /api/account/ai/runs -> /v1/account/ai/runs
// /api/account/ai/runs/[runId] -> /v1/account/ai/runs/{validated UUID}
// /api/account/credits -> /v1/account/credits
```

Return stable no-store JSON errors for invalid IDs, oversized bodies, invalid upstream JSON, timeout, unavailable upstream, and missing internal API configuration.

- [ ] **Step 4: Run the proxy test and observe GREEN**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-proxy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the proxy boundary**

```bash
git add apps/web/src/features/account/account-ai-proxy.ts apps/web/src/features/account/account-ai-proxy.test.ts apps/web/app/api/account/ai apps/web/app/api/account/credits
git commit -m "feat(account): proxy bounded AI requests"
```

### Task 4: Add the typed AI client and idempotent Audit Copilot submission

**Files:**
- Create: `apps/web/src/features/account/account-ai-client.ts`
- Create: `apps/web/src/features/account/account-ai-client.test.ts`
- Create: `apps/web/src/features/account/account-messages.test.ts`
- Modify: `apps/web/src/features/account/account-messages.ts`

**Interfaces:**
- Consumes: Task 2 validators and same-origin endpoints from Task 3.
- Produces: `getAICatalog()`, `getAICredits()`, `listAIRuns()`, `getAIRun(runId)`, `deleteAIRun(runId)`, `createAuditActionPlan(input, idempotencyKey)`, and localized safe error mappings.

- [ ] **Step 1: Write failing client tests**

```ts
const created = await createAuditActionPlan({
  locale: "ru",
  projectId: "11111111-1111-4111-8111-111111111111",
  auditId: "22222222-2222-4222-8222-222222222222",
}, "550e8400-e29b-41d4-a716-446655440000", fetcher);

expect(seen).toMatchObject({
  input: "/api/account/ai/runs",
  method: "POST",
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  body: JSON.stringify({
    tool_id: "ai_audit_action_plan",
    input: {
      locale: "ru",
      project_id: "11111111-1111-4111-8111-111111111111",
      audit_id: "22222222-2222-4222-8222-222222222222",
    },
  }),
});
expect(created.run.tool_id).toBe("ai_audit_action_plan");
```

Cover malformed success bodies, ownership-safe 404, insufficient credits, unavailable tool, idempotency conflict, and delete returning exactly status 204 with no response parsing.

- [ ] **Step 2: Run the client test and observe RED**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-client.test.ts`

Expected: FAIL because the client module does not exist.

- [ ] **Step 3: Implement the typed client**

Use one private `parse<T>()` helper matching existing account clients. All requests use same-origin credentials and no-store caching. `createAuditActionPlan()` accepts camelCase UI input but serializes the exact FastAPI field names. It receives the idempotency key from the caller so a UI retry after an ambiguous local failure can reuse the same key deliberately.

Extend `accountErrorMessage()` with safe RU/EN mappings for:

```text
ai_tool_unavailable
ai_invalid_tool_input
ai_invalid_idempotency_key
ai_idempotency_conflict
ai_insufficient_credits
ai_source_not_found
ai_source_unavailable
ai_run_not_found
ai_input_too_large
ai_completion_outcome_unknown
ai_provider_outcome_unknown
```

Do not render raw backend messages as user-visible copy.

- [ ] **Step 4: Run the client and message tests and observe GREEN**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-client.test.ts src/features/account/account-messages.test.ts`

Expected: PASS. `account-messages.test.ts` must include explicit mapped-code,
fallback, and raw-backend-message-redaction assertions.

- [ ] **Step 5: Commit the typed client**

```bash
git add apps/web/src/features/account/account-ai-client.ts apps/web/src/features/account/account-ai-client.test.ts apps/web/src/features/account/account-messages.ts apps/web/src/features/account/account-messages.test.ts
git commit -m "feat(account): add typed AI workspace client"
```

### Task 5: Build the RU/EN AI workspace shell and honest catalog state

**Files:**
- Create: `apps/web/src/features/account/account-ai-presentation.ts`
- Create: `apps/web/src/features/account/account-ai-presentation.test.ts`
- Create: `apps/web/src/features/account/account-ai-workspace.tsx`
- Create: `apps/web/src/features/account/account-ai-tool-list.tsx`
- Create: `apps/web/src/features/account/account-ai-run-history.tsx`
- Create: `apps/web/app/(ru)/account/ai/page.tsx`
- Create: `apps/web/app/(en)/en/account/ai/page.tsx`
- Modify: `apps/web/src/features/account/account-workspace-shell.tsx`
- Modify: `apps/web/app/account.css`

**Interfaces:**
- Consumes: Task 1 route/navigation, Task 2 contracts, and Task 4 clients.
- Produces: authenticated `/account/ai` and `/en/account/ai` pages with available-tool discovery, balance, history, and honest unavailable/empty/error states.

- [ ] **Step 1: Write failing presentation tests**

Define a readonly descriptor map for all six approved IDs. Assert exact RU/EN names, concise capability boundaries, workflow order, and safe status labels. Include:

```ts
expect(aiToolDescriptor("ru", "ai_audit_action_plan")).toMatchObject({
  title: "AI-план исправлений",
  workflowOrder: 1,
});
expect(aiRunStateLabel("en", "provider_unknown")).toBe("Outcome needs review");
expect(aiWorkspaceEmptyCopy("ru")).not.toMatch(/скоро|скоро появится|готов/u);
```

- [ ] **Step 2: Run the presentation test and observe RED**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-presentation.test.ts`

Expected: FAIL because the presentation module does not exist.

- [ ] **Step 3: Implement focused presentation and React modules**

Keep responsibilities separated:

- `account-ai-presentation.ts` — localized immutable descriptors and state labels;
- `account-ai-tool-list.tsx` — available tool cards and disabled explanations;
- `account-ai-run-history.tsx` — bounded run list with status, timestamp, cost, and open/delete actions;
- `account-ai-workspace.tsx` — load orchestration only.

The workspace loads catalog, credits, and the first 20 runs with `Promise.allSettled()`. Authentication loss delegates to the existing account event path. A failed history request does not erase a successfully loaded catalog or balance. An empty real catalog says that AI runs are unavailable until evaluation is complete; it does not advertise internal tool count or fake an activation date.

Add `section === "ai"` rendering in `AccountWorkspaceShell`. Pages use noindex metadata and render:

```tsx
<AccountWorkspaceShell locale="ru" section="ai">
  <AccountAIWorkspace locale="ru" />
</AccountWorkspaceShell>
```

CSS uses the existing account design tokens, maximum readable content widths, distinct primary/secondary actions, responsive single-column cards below the established account breakpoint, 44px touch targets, visible focus, and no horizontal overflow. Do not add a separate design system or dependency.

- [ ] **Step 4: Run presentation tests, typecheck, and lint**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-presentation.test.ts src/features/account/account-workspace-shell-contract.test.ts`

Run: `npm --workspace @webdiag/web run typecheck`

Run: `npm --workspace @webdiag/web run lint`

Expected: all PASS.

- [ ] **Step 5: Commit the AI workspace shell**

```bash
git add apps/web/src/features/account/account-ai-presentation.ts apps/web/src/features/account/account-ai-presentation.test.ts apps/web/src/features/account/account-ai-workspace.tsx apps/web/src/features/account/account-ai-tool-list.tsx apps/web/src/features/account/account-ai-run-history.tsx apps/web/app/'(ru)'/account/ai/page.tsx apps/web/app/'(en)'/en/account/ai/page.tsx apps/web/src/features/account/account-workspace-shell.tsx apps/web/app/account.css
git commit -m "feat(account): build AI workspace foundation"
```

### Task 6: Complete the Audit Copilot form, polling, and grounded result

**Files:**
- Create: `apps/web/src/features/account/account-ai-query.ts`
- Create: `apps/web/src/features/account/account-ai-query.test.ts`
- Create: `apps/web/src/features/account/account-ai-audit-copilot.tsx`
- Create: `apps/web/src/features/account/account-ai-action-plan-result.tsx`
- Modify: `apps/web/src/features/account/account-ai-workspace.tsx`
- Modify: `apps/web/src/features/account/account-saved-audit.tsx`
- Modify: `apps/web/app/account.css`
- Modify: `apps/web/app/(ru)/account/ai/page.tsx`
- Modify: `apps/web/app/(en)/en/account/ai/page.tsx`

**Interfaces:**
- Consumes: `project_id` and `audit_id` query convenience context, Task 4 client calls, and the strict `AuditActionPlanOutput` from Task 2.
- Produces: `parseAIWorkspaceContext(searchParams)`, an Audit Copilot submission form, deliberate idempotent retry, bounded polling, deletion, and structured result rendering.

- [ ] **Step 1: Write failing query and state-transition tests**

```ts
expect(parseAIWorkspaceContext(new URLSearchParams(
  "project_id=11111111-1111-4111-8111-111111111111&audit_id=22222222-2222-4222-8222-222222222222",
))).toEqual({
  projectId: "11111111-1111-4111-8111-111111111111",
  auditId: "22222222-2222-4222-8222-222222222222",
});
expect(parseAIWorkspaceContext(new URLSearchParams("project_id=../x&audit_id=1")))
  .toEqual({ projectId: null, auditId: null });
```

Extract a pure `nextAIRunPollDelay(run, elapsedMs)` helper and assert: pending/running returns a bounded delay; succeeded/failed/provider_unknown/deleted returns `null`; elapsed time above the UI polling budget returns `null` without changing persisted state.

- [ ] **Step 2: Run the focused tests and observe RED**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-query.test.ts src/features/account/account-ai-presentation.test.ts`

Expected: FAIL because query parsing and polling policy do not exist.

- [ ] **Step 3: Implement the Audit Copilot modules**

`account-ai-audit-copilot.tsx` receives only validated optional context and an available catalog entry. It:

- requires both project and audit UUIDs;
- displays exact price and capability boundary before submission;
- creates one `crypto.randomUUID()` key per user intent;
- reuses that key only for an explicit retry of the same payload;
- disables duplicate submission while a request is pending;
- starts bounded polling after a pending/running response;
- stops polling on terminal state, unmount, authentication loss, or polling budget exhaustion;
- never repeats run creation to discover status.

`account-ai-action-plan-result.tsx` renders summary, ordered actions, issue IDs, affected URLs, steps, and verification instructions as text nodes and safe links. It does not use `dangerouslySetInnerHTML`. Long URLs wrap without widening the page.

Add a contextual link to `AccountSavedAudit` only when the real catalog reports Audit Copilot ready. Until the catalog-aware condition is available within that component, link to the AI workspace with project/audit context but let the workspace show the honest unavailable state; do not label the action as runnable when unavailable.

Use exact query construction:

```ts
const href = `${accountAIPath(locale)}?${new URLSearchParams({
  project_id: projectId,
  audit_id: auditId,
}).toString()}`;
```

- [ ] **Step 4: Run all new web unit tests once**

Run: `npm --workspace @webdiag/web run test -- src/features/account/account-ai-contract.test.ts src/features/account/account-ai-proxy.test.ts src/features/account/account-ai-client.test.ts src/features/account/account-ai-presentation.test.ts src/features/account/account-ai-query.test.ts src/features/account/account-workspace-shell-contract.test.ts`

Expected: all PASS.

- [ ] **Step 5: Commit the Audit Copilot vertical slice**

```bash
git add apps/web/src/features/account/account-ai-query.ts apps/web/src/features/account/account-ai-query.test.ts apps/web/src/features/account/account-ai-audit-copilot.tsx apps/web/src/features/account/account-ai-action-plan-result.tsx apps/web/src/features/account/account-ai-workspace.tsx apps/web/src/features/account/account-saved-audit.tsx apps/web/app/'(ru)'/account/ai/page.tsx apps/web/app/'(en)'/en/account/ai/page.tsx apps/web/app/account.css
git commit -m "feat(account): add Audit Copilot workflow"
```

### Task 7: Add browser coverage and visual verification

**Files:**
- Modify: `apps/web/e2e/account.spec.ts`
- Modify: `apps/web/e2e/visual.spec.ts`
- Modify: `apps/web/e2e/visual.spec.ts-snapshots/*` only when reviewed screenshots demonstrate an intentional design change.

**Interfaces:**
- Consumes: completed AI workspace and Audit Copilot UI.
- Produces: real-browser evidence for RU/EN, ready/unavailable/error states, idempotent submission, polling, safe result rendering, keyboard access, mobile layout, and dark theme.

- [ ] **Step 1: Add failing browser scenarios with controlled fixtures**

Mock the same-origin endpoints, not the provider. Cover:

```ts
await page.route("**/api/account/ai/catalog", (route) => route.fulfill({
  json: {
    contract_version: "webdiag.ai.catalog.v1",
    tools: [{ id: "ai_audit_action_plan", contract_version: "v1", credit_price: 7 }],
  },
}));
await page.route("**/api/account/credits", (route) => route.fulfill({
  json: {
    contract_version: "webdiag.credits.balance.v1",
    account: { available: 20, reserved: 0 },
  },
}));
```

Assert the POST body contains only locale/project/audit IDs, one valid idempotency header is used, pending transitions to succeeded through GET polling, grounded output is visible, injected `<script>` text is not executed, and a repeated click cannot create a second run.

Add honest empty-catalog and insufficient-credit cases. Repeat the primary structure in EN. At 390x844 assert no horizontal overflow and all interactive controls are at least 44px. Verify keyboard focus reaches the form/result actions and the existing mobile drawer still traps/restores focus.

- [ ] **Step 2: Run the new browser subset and observe RED**

Run: `npm --workspace @webdiag/web run test:browser -- account.spec.ts --grep "AI workspace|Audit Copilot"`

Expected: FAIL before fixtures/selectors and UI behavior are complete.

- [ ] **Step 3: Complete selectors and accessibility behavior without weakening assertions**

Use roles and accessible names instead of test IDs unless no semantic selector exists. Add `aria-live="polite"` for queued/running status, `role="alert"` for safe failures, explicit labels/help associations, and focus the result heading after a terminal transition without stealing focus during ordinary polling.

- [ ] **Step 4: Run the browser subset and capture real screenshots**

Run: `npm --workspace @webdiag/web run test:browser -- account.spec.ts --grep "AI workspace|Audit Copilot"`

Expected: PASS.

Start the actual development server at the URL it reports, then capture and inspect:

- RU desktop AI workspace, 1440x900;
- RU mobile Audit Copilot result, 390x844;
- EN desktop empty/unavailable state;
- RU dark-theme result.

Do not update a visual snapshot until the rendered page has been inspected for hierarchy, overflow, touch targets, contrast, and factual copy.

- [ ] **Step 5: Commit browser coverage and intentional visual changes**

```bash
git add apps/web/e2e/account.spec.ts apps/web/e2e/visual.spec.ts apps/web/e2e/visual.spec.ts-snapshots
git commit -m "test(account): cover AI workspace journey"
```

### Task 8: Run the fresh phase verification and update evidence

**Files:**
- Modify: `docs/superpowers/specs/2026-09-10-webdiag-portfolio-mvp-ai-suite-design.md`
- Modify: Draft PR #3 body through the GitHub UI or CLI after the commit is pushed.

**Interfaces:**
- Consumes: all implementation and browser evidence from Tasks 1–7.
- Produces: a truthful phase-completion record and a clean pushed branch.

- [ ] **Step 1: Run the fresh relevant full verification once**

Run: `npm --workspace @webdiag/web run test`

Run: `npm --workspace @webdiag/web run lint`

Run: `npm --workspace @webdiag/web run typecheck`

Run: `npm run build`

Run: `npm --workspace @webdiag/web run test:browser -- account.spec.ts`

Run: `npm run test:python`

Run: `npm run lint:python`

Run: `npm run verify:production-ai-compose`

Run: `npm audit --omit=dev`

Expected: every command exits 0. Record exact counts and versions from this fresh run; do not reuse earlier totals.

- [ ] **Step 2: Review the branch diff and repository state**

Run: `git diff --check HEAD~7..HEAD`

Run: `git status --short`

Run: `git log --oneline -10`

Expected: no whitespace errors, no uncommitted files, and only thematic commits from this plan after the design/plan commits.

- [ ] **Step 3: Append factual implementation evidence to the design spec**

Add a dated section containing only observed command results, screenshot paths, the current catalog state, and explicit remaining gates. State that the six tools remain internal unless plan 3 has independently completed activation evidence.

- [ ] **Step 4: Commit and push the evidence**

```bash
git add docs/superpowers/specs/2026-09-10-webdiag-portfolio-mvp-ai-suite-design.md
git commit -m "docs(ai): record workspace verification"
git push origin feature/backend-production-readiness
```

- [ ] **Step 5: Update Draft PR #3 without changing draft status**

Add the AI workspace scope, exact verification results, screenshot evidence, and remaining provider/activation gates. Do not merge, release, deploy, or mark the PR ready for review.
