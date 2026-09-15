# Account Workspace Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the secure, responsive Operations Workspace foundation with a real aggregate overview API, preserved project context, and no synthetic dashboard data.

**Architecture:** Add one ownership-scoped `webdiag.account.overview.v1` read model assembled from the existing SQLite workspace, monitor, and report stores. The Next.js account shell consumes this strict same-origin contract and renders portfolio/project navigation plus deterministic next actions; existing detail APIs remain unchanged.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, SQLite, Next.js 16.3, React 19.2, TypeScript 5.9, Vitest 3.2, Playwright 1.61, existing CSS token system.

## Global Constraints

- Work only on `feature/backend-production-readiness`; do not merge, release, tag, deploy, or integrate payments.
- Display only persisted WebDiag data; do not invent health, uptime, incident, trend, notification, AI, or historical values.
- Keep all account requests same-origin, credentialed, no-store, strictly validated, and ownership scoped.
- Preserve ownership-hiding 404 behavior and stable account error envelopes.
- RU and EN must have equivalent information architecture and state handling.
- Use existing design tokens first; declare every new account token before use.
- Do not add dependencies.
- Follow TDD: one observed RED, minimal implementation, targeted GREEN, thematic commit.
- Run unchanged suites only once at the final verification gate.

---

## File map

- `apps/api/src/webdiag_api/accounts/overview_models.py`: versioned aggregate read model only.
- `apps/api/src/webdiag_api/accounts/overview_service.py`: ownership-scoped composition of existing stores.
- `apps/api/src/webdiag_api/accounts/overview_api.py`: authenticated no-store route and dependency factory.
- `apps/api/src/webdiag_api/accounts/workspace_storage.py`: one bounded latest-audit-per-project query.
- `apps/api/src/webdiag_api/main.py`: register the overview router.
- `apps/api/tests/test_account_overview_api.py`: service/API ownership, consistency, and no-store regressions.
- `apps/web/app/api/account/overview/route.ts`: private Next.js proxy route.
- `apps/web/src/features/account/account-overview-contract.ts`: strict browser-side validator and selectors.
- `apps/web/src/features/account/account-overview-client.ts`: same-origin overview fetch.
- `apps/web/src/features/account/account-overview-contract.test.ts`: contract and deterministic action tests.
- `apps/web/src/features/account/account-overview-client.test.ts`: transport/error tests.
- `apps/web/src/features/account/account-auth-form.tsx`: explicit safe native POST fallback.
- `apps/web/src/features/account/account-workspace-shell-contract.ts`: portfolio/project navigation model.
- `apps/web/src/features/account/account-workspace-shell.tsx`: overview loading and responsive shell orchestration.
- `apps/web/src/features/account/account-dashboard.tsx`: first-use and returning-user dashboards.
- `apps/web/src/features/account/account-workspace-shell-contract.test.ts`: navigation and project-context unit tests.
- `apps/web/app/account.css`: token declarations and responsive Operations Workspace styling.
- `apps/web/e2e/account.spec.ts`: no-JS credential safety, real overview, project context, keyboard, and mobile regressions.

---

### Task 1: Prevent native auth forms from leaking credentials

**Files:**
- Modify: `apps/web/src/features/account/account-auth-form.tsx`
- Modify: `apps/web/e2e/account.spec.ts`

**Interfaces:**
- Consumes: existing `loginPath(locale)` and `registerPath(locale)` helpers.
- Produces: an auth `<form method="post" action="...">` whose native fallback cannot serialize credentials into a URL.

- [ ] **Step 1: Write the failing browser regression**

Add a Playwright test that disables JavaScript before navigation, submits login and registration forms, and asserts that neither the resulting URL nor browser history contains the email or password:

```ts
test("native auth fallback never places credentials in the URL", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Электронная почта").fill("secret-user@example.com");
  await page.getByLabel("Пароль").fill("secret-password-value");
  await page.getByRole("button", { name: "Войти" }).click();
  expect(page.url()).not.toContain("secret-user");
  expect(page.url()).not.toContain("secret-password");
  await context.close();
});
```

- [ ] **Step 2: Run the focused RED**

Run: `npm --workspace @webdiag/web run test:browser -- --grep "native auth fallback"`

Expected: FAIL because the current form defaults to GET and serializes named controls into the URL.

- [ ] **Step 3: Add the explicit native POST fallback**

Set the existing form attributes without changing the JavaScript JSON login flow:

```tsx
<form
  className="wd-account-form"
  method="post"
  action={register ? registerPath(locale) : loginPath(locale)}
  onSubmit={onSubmit}
  aria-busy={pending}
>
```

The non-JavaScript fallback may receive the framework's method-not-allowed page; the security contract is that secrets never enter the URL.

- [ ] **Step 4: Run the focused GREEN**

Run: `npm --workspace @webdiag/web run test:browser -- --grep "native auth fallback"`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- apps/web/src/features/account/account-auth-form.tsx apps/web/e2e/account.spec.ts
git commit -m "fix(auth): secure native form fallback"
```

---

### Task 2: Add the ownership-scoped overview read model

**Files:**
- Create: `apps/api/src/webdiag_api/accounts/overview_models.py`
- Create: `apps/api/src/webdiag_api/accounts/overview_service.py`
- Modify: `apps/api/src/webdiag_api/accounts/workspace_storage.py`
- Create: `apps/api/tests/test_account_overview_api.py`

**Interfaces:**
- Consumes: `SqliteWorkspaceStore.list_projects`, new `list_latest_audits`, `SqliteMonitoringStore.list_monitors`, and `SqliteReportStore.list_reports`.
- Produces: `AccountOverviewResponse(contract_version="webdiag.account.overview.v1", projects=...)` and `AccountOverviewService.get_overview(*, user_id: str)`.

- [ ] **Step 1: Write failing service and storage tests**

Cover two users sharing one database, projects with and without audits/monitors/reports, latest-audit selection, report counts, and stable ordering:

```python
def test_overview_is_owned_and_uses_only_latest_persisted_state(tmp_path: Path) -> None:
    database = str(tmp_path / "account.sqlite3")
    services = build_overview_services(database)
    first = create_project_with_two_audits(services, user_id="user-a")
    create_project_with_monitor_and_report(services, user_id="user-a")
    create_project_with_monitor_and_report(services, user_id="user-b")

    overview = services.overview.get_overview(user_id="user-a")

    assert overview.contract_version == "webdiag.account.overview.v1"
    assert {item.project.id for item in overview.projects} == {first.project_id, services.second_project_id}
    assert overview.projects[0].latest_audit.id == first.latest_audit_id
    assert all(item.project.id != services.foreign_project_id for item in overview.projects)
```

- [ ] **Step 2: Run the focused RED**

Run: `npm run test:python -- apps/api/tests/test_account_overview_api.py -q`

Expected: FAIL because overview modules and `list_latest_audits` do not exist.

- [ ] **Step 3: Implement the versioned models**

Define strict Pydantic models:

```python
class AccountOverviewProject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project: AccountProject
    latest_audit: SavedAuditSummary | None = None
    monitor: AccountMonitor | None = None
    report_count: int = Field(ge=0)
    shared_report_count: int = Field(ge=0)
    latest_report_created_at: datetime | None = None


class AccountOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.overview.v1"] = "webdiag.account.overview.v1"
    projects: tuple[AccountOverviewProject, ...]
```

- [ ] **Step 4: Implement one latest-audit query**

Add `SqliteWorkspaceStore.list_latest_audits(*, user_id: str) -> tuple[StoredAudit, ...]` with one SQLite query using a correlated `NOT EXISTS` comparison on `(completed_at, id)` and the existing `user_id` predicate. Do not loop over projects or deserialize payload JSON.

```sql
SELECT audit.*
FROM account_workspace_audits AS audit
WHERE audit.user_id = ?
  AND NOT EXISTS (
    SELECT 1
    FROM account_workspace_audits AS newer
    WHERE newer.user_id = audit.user_id
      AND newer.project_id = audit.project_id
      AND (newer.completed_at, newer.id) > (audit.completed_at, audit.id)
  )
ORDER BY audit.completed_at DESC, audit.id DESC
```

- [ ] **Step 5: Implement deterministic service composition**

Build dictionaries keyed by `project_id`, count only the authenticated user's reports, and return projects ordered by `updated_at DESC, id DESC`:

```python
class AccountOverviewService:
    def get_overview(self, *, user_id: str) -> AccountOverviewResponse:
        projects = self._workspace.list_projects(user_id=user_id)
        audits = {item.project_id: item for item in self._workspace.list_latest_audits(user_id=user_id)}
        monitors = {item.project_id: item for item in self._monitoring.list_monitors(user_id=user_id)}
        reports = _group_reports(self._reports.list_reports(user_id=user_id))
        return AccountOverviewResponse(
            projects=tuple(
                _overview_project(project, audits.get(project.id), monitors.get(project.id), reports.get(project.id, ()))
                for project in projects
            )
        )
```

- [ ] **Step 6: Run targeted GREEN and Ruff for touched Python files**

Run:

```powershell
npm run test:python -- apps/api/tests/test_account_overview_api.py -q
node scripts/run-python.mjs -m ruff check apps/api/src/webdiag_api/accounts/overview_models.py apps/api/src/webdiag_api/accounts/overview_service.py apps/api/src/webdiag_api/accounts/workspace_storage.py apps/api/tests/test_account_overview_api.py
```

Expected: all targeted tests pass and Ruff reports no errors.

- [ ] **Step 7: Commit**

```powershell
git add -- apps/api/src/webdiag_api/accounts/overview_models.py apps/api/src/webdiag_api/accounts/overview_service.py apps/api/src/webdiag_api/accounts/workspace_storage.py apps/api/tests/test_account_overview_api.py
git commit -m "feat(account): add persisted workspace overview"
```

---

### Task 3: Expose the authenticated no-store overview API

**Files:**
- Create: `apps/api/src/webdiag_api/accounts/overview_api.py`
- Modify: `apps/api/src/webdiag_api/main.py`
- Modify: `apps/api/tests/test_account_overview_api.py`

**Interfaces:**
- Consumes: `AccountOverviewService.get_overview(user_id=...)` and existing account session dependency.
- Produces: `GET /v1/account/overview` with `AccountOverviewResponse`, `Cache-Control: no-store`, and ordinary account 401 behavior.

- [ ] **Step 1: Add failing API boundary tests**

```python
def test_overview_api_requires_session_hides_other_users_and_is_no_store(client) -> None:
    unauthenticated = client.get("/v1/account/overview")
    assert unauthenticated.status_code == 401
    assert unauthenticated.headers["cache-control"] == "no-store"

    response = client.get("/v1/account/overview", cookies=session_cookie_for("user-a"))
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json()["contract_version"] == "webdiag.account.overview.v1"
    assert all(item["project"]["id"] != foreign_project_id for item in response.json()["projects"])
```

- [ ] **Step 2: Run the API RED**

Run: `npm run test:python -- apps/api/tests/test_account_overview_api.py -q`

Expected: FAIL with 404 for the missing route.

- [ ] **Step 3: Implement and register the router**

Use a cached dependency factory that creates existing stores against `settings.account_database_path`. Resolve the current user exclusively from the session cookie and account service, then set `response.headers["cache-control"] = "no-store"` before returning the overview.

```python
router = APIRouter(prefix="/v1/account", tags=["account-overview"])


@router.get("/overview", response_model=AccountOverviewResponse)
def get_account_overview(
    response: Response,
    overview: OverviewServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountOverviewResponse:
    response.headers["cache-control"] = "no-store"
    user_id = current_account_user_id(account_service, webdiag_session)
    return overview.get_overview(user_id=user_id)
```

Reuse or extract the existing session-to-user helper instead of trusting a request user ID.

- [ ] **Step 4: Run API GREEN and touched-file Ruff**

Run:

```powershell
npm run test:python -- apps/api/tests/test_account_overview_api.py -q
node scripts/run-python.mjs -m ruff check apps/api/src/webdiag_api/accounts/overview_api.py apps/api/src/webdiag_api/main.py apps/api/tests/test_account_overview_api.py
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- apps/api/src/webdiag_api/accounts/overview_api.py apps/api/src/webdiag_api/main.py apps/api/tests/test_account_overview_api.py
git commit -m "feat(api): expose account overview contract"
```

---

### Task 4: Add the strict Next.js overview boundary

**Files:**
- Create: `apps/web/app/api/account/overview/route.ts`
- Modify: `apps/web/src/features/account/account-workspace-proxy.ts`
- Create: `apps/web/src/features/account/account-overview-contract.ts`
- Create: `apps/web/src/features/account/account-overview-client.ts`
- Create: `apps/web/src/features/account/account-overview-contract.test.ts`
- Create: `apps/web/src/features/account/account-overview-client.test.ts`

**Interfaces:**
- Consumes: `GET /v1/account/overview` and existing account error envelope.
- Produces: `getAccountOverview(fetcher = fetch): Promise<AccountOverviewResponse>`, `isAccountOverviewResponse(value)`, and `deriveAccountNextActions(overview, locale)`.

- [ ] **Step 1: Write failing contract/client tests**

Cover exact keys, nested monitor/audit/report values, extra-field rejection, same-origin/no-store credentials, invalid response rejection, and deterministic actions:

```ts
expect(isAccountOverviewResponse(validOverview)).toBe(true);
expect(isAccountOverviewResponse({ ...validOverview, synthetic_health: 92 })).toBe(false);
await expect(getAccountOverview(fetcher)).resolves.toEqual(validOverview);
expect(calls[0]).toMatchObject({
  input: "/api/account/overview",
  init: { method: "GET", cache: "no-store", credentials: "same-origin" },
});
expect(deriveAccountNextActions(noAuditOverview, "ru")[0]?.kind).toBe("run_audit");
```

- [ ] **Step 2: Run Vitest RED**

Run: `npm --workspace @webdiag/web run test -- account-overview-contract.test.ts account-overview-client.test.ts`

Expected: FAIL because modules and route do not exist.

- [ ] **Step 3: Add the private proxy route**

Extend the workspace proxy path union with `/v1/account/overview` and create:

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createAccountWorkspaceProxy({
  method: "GET",
  path: "/v1/account/overview",
  body: false,
});
```

- [ ] **Step 4: Implement strict contracts and selectors**

Define readonly TypeScript interfaces matching the Python model exactly. Reuse exported validators only where they remain exact; do not loosen `only(...)` checks. Define actions as a discriminated union:

```ts
export type AccountNextAction =
  | { readonly kind: "create_project"; readonly projectId: null }
  | { readonly kind: "run_audit"; readonly projectId: string }
  | { readonly kind: "review_change"; readonly projectId: string }
  | { readonly kind: "resolve_monitor_failure"; readonly projectId: string }
  | { readonly kind: "create_report"; readonly projectId: string };
```

Selection precedence is monitor failure, changed monitor, missing audit, missing report. Limit the returned portfolio list to three actions using stable project order. Do not manufacture an action from dates or scores.

- [ ] **Step 5: Implement the fetch client**

```ts
export async function getAccountOverview(fetcher: Fetcher = fetch): Promise<AccountOverviewResponse> {
  const response = await fetcher("/api/account/overview", {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  });
  return parseAccountOverview(response);
}
```

- [ ] **Step 6: Run Vitest GREEN**

Run: `npm --workspace @webdiag/web run test -- account-overview-contract.test.ts account-overview-client.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- apps/web/app/api/account/overview/route.ts apps/web/src/features/account/account-workspace-proxy.ts apps/web/src/features/account/account-overview-contract.ts apps/web/src/features/account/account-overview-client.ts apps/web/src/features/account/account-overview-contract.test.ts apps/web/src/features/account/account-overview-client.test.ts
git commit -m "feat(web): validate account overview boundary"
```

---

### Task 5: Build portfolio and project-aware navigation

**Files:**
- Modify: `apps/web/src/features/account/account-workspace-shell-contract.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell-contract.test.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell.tsx`
- Modify: `apps/web/src/lib/routes.ts`

**Interfaces:**
- Consumes: loaded project list, `currentProjectId`, and current `AccountWorkspaceSection`.
- Produces: `buildAccountWorkspaceNavigation(locale, section, currentProjectId?)`, project task links, and an account shell that loads session/projects/overview once per refresh token.

- [ ] **Step 1: Write failing navigation tests**

Assert portfolio links, project links, active states, and cross-project-safe switching:

```ts
const projectNav = buildAccountWorkspaceNavigation("ru", "project", projectId);
expect(projectNav.project?.map((item) => item.id)).toEqual([
  "project_overview", "audits", "issues", "monitoring", "project_reports",
]);
expect(projectNav.project?.find((item) => item.id === "monitoring")?.href)
  .toBe(`/account/projects/${projectId}/monitoring`);
expect(projectLandingAfterSwitch("ru", otherProjectId)).toBe(`/account/projects/${otherProjectId}`);
```

- [ ] **Step 2: Run navigation RED**

Run: `npm --workspace @webdiag/web run test -- account-workspace-shell-contract.test.ts`

Expected: FAIL because only the three portfolio links exist.

- [ ] **Step 3: Implement route helpers and navigation model**

Return distinct `portfolio` and optional `project` groups. Use only existing live routes; “Audits” and “Issues” route to the project overview until an audit identifier exists, with labels/actions located in the page rather than a fabricated URL. Reports may include `?project=<uuid>` only after strict query parsing is added in the reports plan.

- [ ] **Step 4: Update shell orchestration**

Load session, project list, and overview concurrently. Treat overview failure as a recoverable dashboard error without discarding a valid session/project list. Preserve the existing drawer focus trap and logout error behavior. Make project selection navigate only to `projectPath(locale, selectedId)`.

```ts
const [sessionResult, projectsResult, overviewResult] = await Promise.allSettled([
  getAccountSession(),
  listAccountProjects(),
  getAccountOverview(),
]);
```

Do not render fake data when overview is unavailable; render a retryable overview state while navigation remains usable.

- [ ] **Step 5: Run focused shell tests**

Run: `npm --workspace @webdiag/web run test -- account-workspace-shell-contract.test.ts account-overview-contract.test.ts account-overview-client.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/web/src/features/account/account-workspace-shell-contract.ts apps/web/src/features/account/account-workspace-shell-contract.test.ts apps/web/src/features/account/account-workspace-shell.tsx apps/web/src/lib/routes.ts
git commit -m "feat(account): preserve project workspace context"
```

---

### Task 6: Replace the placeholder dashboard with real next actions

**Files:**
- Modify: `apps/web/src/features/account/account-dashboard.tsx`
- Create: `apps/web/src/features/account/account-dashboard-contract.ts`
- Create: `apps/web/src/features/account/account-dashboard-contract.test.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell.tsx`

**Interfaces:**
- Consumes: `AccountOverviewResponse`, projects, session, and `deriveAccountNextActions`.
- Produces: first-use dashboard, returning-user dashboard, and localized presentation selectors with no invented values.

- [ ] **Step 1: Write failing presentation-selector tests**

```ts
expect(accountOverviewMetrics(validOverview)).toEqual({
  projectCount: 2,
  projectsWithAudit: 1,
  projectsRequiringAttention: 1,
  readyReportCount: 3,
});
expect(formatNullableScore(null, "ru")).toBe("Не рассчитана");
expect(formatMonitorStatus("changed", "ru")).toBe("Есть изменения");
expect(Object.values(accountOverviewMetrics(validOverview))).not.toContain("%30");
```

- [ ] **Step 2: Run dashboard RED**

Run: `npm --workspace @webdiag/web run test -- account-dashboard-contract.test.ts`

Expected: FAIL because selectors do not exist.

- [ ] **Step 3: Implement pure localized selectors**

Create pure functions for counts, nullable score, monitor status, localized dates, and action labels/links. `projectsRequiringAttention` counts only `monitor.status === "failed"` or `monitor.status === "changed"`; it does not infer attention from a numeric score.

- [ ] **Step 4: Implement the first-use and returning-user layouts**

For zero projects, render a single project-creation empty state. For existing projects, render greeting, four real count cards, up to three next actions, recent project summaries, and a secondary add-project disclosure. Remove duplicate recent/all-project grids.

Each project summary may display only fields in the overview contract: latest audit time/score/issue count, monitor state and times, report count, name, origin, and update time.

- [ ] **Step 5: Run focused Vitest GREEN**

Run: `npm --workspace @webdiag/web run test -- account-dashboard-contract.test.ts account-workspace-shell-contract.test.ts account-overview-contract.test.ts account-overview-client.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/web/src/features/account/account-dashboard.tsx apps/web/src/features/account/account-dashboard-contract.ts apps/web/src/features/account/account-dashboard-contract.test.ts apps/web/src/features/account/account-workspace-shell.tsx
git commit -m "feat(account): add real operations overview"
```

---

### Task 7: Apply the responsive visual foundation and verify the flow

**Files:**
- Modify: `apps/web/app/account.css`
- Modify: `apps/web/e2e/account.spec.ts`

**Interfaces:**
- Consumes: semantic class names from Tasks 5–6 and existing global WebDiag tokens.
- Produces: the approved Operations Workspace visual hierarchy across desktop and mobile without changing public marketing design.

- [ ] **Step 1: Add failing browser assertions for behavior and geometry**

Mock the overview API with persisted audit/monitor/report data and assert:

```ts
await expect(page.getByRole("heading", { level: 1, name: "Обзор" })).toBeVisible();
await expect(page.getByText("Требуют внимания")).toBeVisible();
await expect(page.getByText("Есть изменения")).toBeVisible();
await expect(page.getByText(/uptime|доступност.*%/i)).toHaveCount(0);
await expect(page.getByRole("complementary", { name: "Панель кабинета" })).toBeVisible();
```

At 390 by 844, assert drawer focus restoration, 44-pixel trigger size, and `scrollWidth === clientWidth`. At 1440 by 900, assert the rail and main content do not overlap.

- [ ] **Step 2: Run focused browser RED**

Run: `npm --workspace @webdiag/web run test:browser -- --grep "account workspace|operations overview|native auth fallback"`

Expected: FAIL on the new overview/design assertions.

- [ ] **Step 3: Declare and apply account visual tokens**

Add tokens only inside `.wd-account-workspace-page` and map them to existing semantic values:

```css
.wd-account-workspace-page {
  --wd-account-canvas: var(--surface-muted);
  --wd-account-surface: var(--surface);
  --wd-account-border: var(--line);
  --wd-account-accent: var(--accent);
  --wd-account-radius: 16px;
  --wd-account-rail-width: 264px;
}
```

If an existing token name differs, use the actual repository token rather than adding an undefined reference. Implement a compact rail, restrained borders/shadows, clear typography, semantic state indicators with text, 12-column desktop layout, and one-column mobile layout. Keep touch targets at least 44 by 44 pixels and honor `prefers-reduced-motion`.

- [ ] **Step 4: Run the focused browser GREEN once**

Run: `npm --workspace @webdiag/web run test:browser -- --grep "account workspace|operations overview|native auth fallback"`

Expected: PASS with no console, network, accessibility, or horizontal-overflow regressions.

- [ ] **Step 5: Run the affected-package gate once**

Run:

```powershell
npm --workspace @webdiag/web run test
npm --workspace @webdiag/web run lint
npm --workspace @webdiag/web run typecheck
npm run test:python -- apps/api/tests/test_account_overview_api.py apps/api/tests/test_account_workspace_api.py apps/api/tests/test_account_monitoring_api.py apps/api/tests/test_account_reports_api.py -q
npm run lint:python
git diff --check
```

Expected: all commands pass. Do not rerun them unless a subsequent edit changes the checked code.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/web/app/account.css apps/web/e2e/account.spec.ts
git commit -m "feat(account): polish operations workspace foundation"
```

---

## Final self-review checklist

- Spec coverage in this sub-project: safe auth fallback, portfolio/project shell, real overview data, deterministic next actions, RU/EN structure, desktop/mobile foundation, and common error/loading states.
- Intentionally separate later plans: audit/issue progressive disclosure, monitoring page redesign, client report hierarchy/sharing UX, and account lifecycle APIs.
- The overview contract contains no synthetic score, trend, uptime, notification, AI, or user-supplied ownership field.
- Backend aggregation is bounded and avoids per-project audit queries.
- All new names used by later tasks are defined in earlier tasks.
- No placeholder instructions or new dependencies are present.
