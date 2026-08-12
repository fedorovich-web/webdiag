# WebDiag account workspace

A11.0 provides registration, login, current-session state, server-side logout, bounded scrypt hashing, opaque sessions, and the private same-origin account proxy.

Login failures are stored as bounded SHA-256 identity keys rather than submitted email
addresses. Five failures within 15 minutes block that identity for 15 minutes; the API
returns `429 account_login_rate_limited` with `Retry-After`. Successful authentication
clears the failure record and upgrades a legacy scrypt hash to the configured work factors.

A11.1 adds the first real data layer:

- ownership-scoped projects;
- canonical public HTTP(S) origins only;
- duplicate-origin protection within an account;
- project list and detail;
- atomic server-side audit execution for an owned project;
- versioned safe saved-audit payloads;
- bounded history of up to 100 audits per project;
- RU/EN project, history, and saved-report routes.

A11.2 adds the account workspace presentation without introducing new backend entities:

- one route-aware shell for account, project, and saved-audit pages;
- sticky desktop sidebar;
- accessible mobile drawer with focus trap, Escape handling, focus restoration, and scroll locking;
- RU/EN workspace navigation;
- project switcher populated only from the real project list;
- overview based only on project count, recently updated projects, and the complete project list;
- shell state updated directly from a successful create-project response without a second project-list request;
- light/dark token parity and responsive overflow coverage.

A11.2 does not claim audit totals, uptime, monitoring, notifications, reports, or other metrics that are not present in the A11.1 contracts.

A11.3 adds an issue-priority projection without introducing new backend storage:

- issue list and detail are derived from the saved audit payload;
- six normalized categories: SEO, performance, accessibility, security, content, and technical;
- deterministic global `fix_order` from persisted priority, severity, and stable issue ID;
- server-side category/priority filtering and priority/category/title sorting;
- ownership-scoped RU/EN routes for issue list and detail;
- recommendations and affected URLs only from the persisted safe payload;
- no raw evidence, tool mappings, internal job/run IDs, or pseudo-AI explanations.


## Storage contracts

The SQLite database contains:

```text
account_users
account_sessions
account_workspace_projects
account_workspace_saved_audits
account_workspace_monitors
account_workspace_monitor_runs
account_workspace_reports
```

Projects are limited to 100 per account. Saved audits are limited to 100 per project. A11.2 does not change storage or introduce delete/archive behavior.

The saved payload contract is:

```text
webdiag.account.saved_audit_payload.v1
```

It contains only the target origin, score, safe check summaries, safe issue fields, same-origin affected URLs without query/fragment, recommendations, and completion time. It does not persist raw evidence, cookies, authorization values, internal tool mappings, or process-local job/run identifiers.

## API

```text
POST /v1/account/projects
GET  /v1/account/projects
GET  /v1/account/projects/{projectId}
POST /v1/account/projects/{projectId}/audits
GET  /v1/account/projects/{projectId}/audits/{auditId}
GET  /v1/account/projects/{projectId}/audits/{auditId}/issues
GET  /v1/account/projects/{projectId}/audits/{auditId}/issues/{issueId}
```

The audit POST has no browser-controlled body. The API reads the origin from the owned project, runs the existing audit service, sanitizes the result, and saves it in one server-side operation.

All account workspace responses use `Cache-Control: no-store`.

## Frontend routes

```text
/account
/account/projects/{projectId}
/account/projects/{projectId}/audits/{auditId}
/account/projects/{projectId}/audits/{auditId}/issues
/account/projects/{projectId}/audits/{auditId}/issues/{issueId}
/en/account
/en/account/projects/{projectId}
/en/account/projects/{projectId}/audits/{auditId}
/en/account/projects/{projectId}/audits/{auditId}/issues
/en/account/projects/{projectId}/audits/{auditId}/issues/{issueId}
```

The shell loads the current session and project list once per route. Project and saved-audit detail components continue to use their ownership-scoped detail endpoints.

## Local environment

```powershell
Copy-Item account.env.example .env.local
npm run dev
```

For Docker Compose:

```powershell
docker compose -f docker-compose.yml -f docker-compose.account.override.yml up --build
```

Production requires:

```text
WEBDIAG_ENVIRONMENT=production
WEBDIAG_ACCOUNT_COOKIE_SECURE=true
WEBDIAG_API_INTERNAL_URL=http://api:8000
WEBDIAG_MONITORING_INTERNAL_TOKEN=<at-least-32-random-characters>
```

Public audit jobs and runs are persisted in the configured SQLite file
(`WEBDIAG_AUDIT_DATABASE_PATH`) with SHA-256 integrity checks and bounded retention
(`WEBDIAG_AUDIT_HISTORY_LIMIT`, default 1000). The Docker account override stores this
database in the same durable `/data` volume as account state.

`NEXT_PUBLIC_WEBDIAG_API_BASE_URL` is not used for account-cookie proxying.

## Verification

```powershell
node scripts/run-python.mjs -m pytest `
  apps/api/tests/test_account_api.py `
  apps/api/tests/test_account_workspace_api.py `
  apps/api/tests/test_account_issues_api.py `
  apps/api/tests/test_account_monitoring_api.py `
  apps/api/tests/test_account_reports_api.py -q

node scripts/run-python.mjs -m ruff check `
  apps/api/src/webdiag_api/accounts `
  apps/api/tests/test_account_api.py `
  apps/api/tests/test_account_workspace_api.py `
  apps/api/tests/test_account_issues_api.py `
  apps/api/tests/test_account_monitoring_api.py `
  apps/api/tests/test_account_reports_api.py `
  apps/api/src/webdiag_api/config.py `
  apps/api/src/webdiag_api/main.py

npm --workspace @webdiag/web exec -- `
  vitest run `
  src/features/account/account-client.test.ts `
  src/features/account/account-proxy-contract.test.ts `
  src/features/account/account-workspace-client.test.ts `
  src/features/account/account-workspace-shell-contract.test.ts `
  src/features/account/account-issues-contract.test.ts `
  src/features/account/account-report-contract.test.ts `
  src/features/account/account-report-client.test.ts `
  --pool=forks --maxWorkers=1

npm --workspace @webdiag/web exec -- `
  playwright test e2e/account.spec.ts --project=chromium

npm run verify:local
```

## Deliberately deferred

- archive/delete semantics;
- password recovery, email verification, billing, and operator administration.

## A11.4 monitoring foundation

A11.4 adds a real monitoring execution path rather than a presentation-only dashboard:

- one ownership-scoped monitor per project;
- cadence values from one hour to one week;
- canonical IANA timezone input;
- atomic SQLite due claiming with a 15-minute lease and a five-minute heartbeat;
- scheduled execution through the existing audit service;
- persisted baseline, unchanged, changed, and failed outcomes;
- bounded retry delays and a maximum history of 100 runs;
- RU/EN configuration, pause/resume, run-now, and history UI.

Monitoring stores its own safe versioned audit snapshots and does not consume the A11.1 saved-audit limit.
It does not expose raw evidence, internal tokens, provider destinations, or worker lease values.

Monitoring tables:

```text
account_workspace_monitors
account_workspace_monitor_runs
```

Monitoring API:

```text
POST  /v1/account/projects/{projectId}/monitor
GET   /v1/account/monitors
GET   /v1/account/projects/{projectId}/monitor
PATCH /v1/account/projects/{projectId}/monitor
GET   /v1/account/projects/{projectId}/monitor/history
POST  /v1/account/projects/{projectId}/monitor/run
POST  /v1/internal/monitoring/run-due
```

The internal endpoint requires `WEBDIAG_MONITORING_INTERNAL_TOKEN`. The worker sends it only as a Bearer header over the configured private HTTP(S) origin.

The notification boundary is contract-only:

```text
webdiag.monitor.notification_event.v1
```

No email, webhook, messenger, or other delivery provider is implemented in A11.4.

## A11.5 saved reports

A11.5 adds immutable saved reports derived only from an owned saved-audit payload.
Creating a report does not run a new audit and does not accept an audit payload from the browser.

Storage adds one table:

```text
account_workspace_reports
```

Limits and privacy rules:

- no more than 100 reports per account;
- report snapshots are limited to 2,000,000 UTF-8 bytes;
- snapshots contain only the safe saved-audit checks, issues, recommendations, score, origin, and timestamps;
- raw evidence, user/session data, job/run identifiers, cookies, and authorization values are excluded;
- share tokens are returned once, stored only as SHA-256 hashes, and expire after 1–30 days;
- revocation invalidates the current share token immediately;
- there is no public report listing or search endpoint;
- public responses use `no-store`, `noindex`, `nofollow`, `noarchive`, and `no-referrer` controls.

Report contracts:

```text
webdiag.account.report_snapshot.v1
webdiag.account.report_list.v1
webdiag.account.report_detail.v1
webdiag.account.report_share.v1
webdiag.public.report.v1
```

Account API:

```text
POST   /v1/account/projects/{projectId}/audits/{auditId}/reports
GET    /v1/account/reports
GET    /v1/account/reports/{reportId}
POST   /v1/account/reports/{reportId}/share
DELETE /v1/account/reports/{reportId}/share
GET    /v1/account/reports/{reportId}/export.html
GET    /v1/account/reports/{reportId}/print
```

Public API:

```text
GET /v1/public/reports/{shareToken}
GET /v1/public/reports/{shareToken}/export.html
GET /v1/public/reports/{shareToken}/print
```

The HTML artifact is self-contained, script-free, escaped, and protected by a restrictive Content Security Policy.
The print endpoint is the PDF architecture for A11.5: users open the print-ready HTML and use the browser's Save as PDF function. Server-side PDF rendering is not claimed or implemented.

Frontend routes:

```text
/account/reports
/account/reports/{reportId}
/en/account/reports
/en/account/reports/{reportId}
/reports/share/{shareToken}
```

Verification includes an exact SHA-256 assertion for a fixed HTML report artifact and coverage for ownership, share hashing, expiry/revoke behavior, public privacy, and export security headers.
