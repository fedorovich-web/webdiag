# WebDiag GitHub Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover the confirmed A11.5 + A10.40 WebDiag development candidate into GitHub, add a reproducible CI gate, and expose the work only through a Draft PR while leaving `main` untouched.

**Architecture:** Treat `main@d9f0a9208499cd626cd172e3c8b2ef4878ab1dba` as the immutable base and `recovery/a11.5-github-baseline` as the isolated integration branch. Reconstruct the candidate from the verified handoff plus A11.5 cumulative archive, preserve approved visual baselines from `main`, commit only the intended source delta, then add GitHub Actions as a separate commit so recovery content and CI infrastructure remain independently reviewable.

**Tech Stack:** Git/GitHub, GitHub Actions, Node.js 24, npm 10.9.2, Next.js workspace, TypeScript/Vitest/Playwright, Python 3.14, pytest, Ruff.

## Global Constraints

- Repository: `fedorovich-web/webdiag`.
- Base commit: `d9f0a9208499cd626cd172e3c8b2ef4878ab1dba`.
- Working branch: `recovery/a11.5-github-baseline`.
- Package version remains `0.5.11`; no version bump is part of recovery.
- `main` must not be changed, merged, force-pushed, tagged, or released during recovery.
- Unverified commits are allowed only on the recovery branch and must remain behind a Draft PR.
- The recovered product state must match the uploaded local project / reconstructed A11.5 normalized product hash `5a45e644d89d3adcd81ef88f4c2e9e5bd25fe34fe693c4c116811a51a6c2bb73` under the documented exclusion policy.
- Preserve existing GitHub visual baselines. Do not accept local absence of snapshot files as deletion intent.
- Exclude local/generated/transfer artifacts: `node_modules/`, `.next/`, `.venv/`, test result directories, Python caches, `*.pyc`, `*.log`, `*.tsbuildinfo`, local `.env`, generated `SHA256SUMS.txt`, replacement archives, `HANDOFF/`, `MANIFEST.txt`, `CREATE_WEBDIAG_HANDOFF.ps1`, `CREATE_WEBDIAG_HANDOFF.py`, and `test_create_webdiag_handoff.py`.
- Delete the two obsolete tracked handoff scripts only: `create-webdiag-next-chat-context.ps1` and `create-webdiag-next-chat-context-v2.ps1`.
- Do not reconcile the historical `110`-tool public release gate in this recovery. Record it as follow-up work.
- No working/passing claim is permitted without fresh command or GitHub Actions evidence.

---

### Task 1: Commit the confirmed recovery candidate

**Files:**
- Modify/Create: the exact 150-path recovery set in Appendix A.
- Delete: `create-webdiag-next-chat-context.ps1`.
- Delete: `create-webdiag-next-chat-context-v2.ps1`.
- Preserve unchanged: `apps/web/e2e/visual.spec.ts-snapshots/**` from `main`.

**Interfaces:**
- Consumes: verified handoff `d9f0a920...`, A11.5 cumulative replacement archive, user-provided full project archive.
- Produces: one Git commit whose tree contains the recovered A11.0–A11.5 + A10.40 candidate without generated/transfer artifacts.

- [ ] **Step 1: Recompute the candidate identity before writing Git objects**

Run the deterministic comparison over the extracted local project and reconstructed candidate. Require 560 normalized product files on each side and aggregate SHA-256 `5a45e644d89d3adcd81ef88f4c2e9e5bd25fe34fe693c4c116811a51a6c2bb73`.

Expected: identical product state; only generated/transfer files and intentionally preserved historical screenshot baselines differ.

- [ ] **Step 2: Validate the recovery inclusion set**

Require all 150 Appendix A paths to exist in the reconstructed candidate. Reject any path under the exclusion list. Require the two deletion paths to be absent from the candidate.

Expected: 150 candidate paths, zero missing paths, zero excluded paths.

- [ ] **Step 3: Build a Git tree over the exact base tree**

Use the base commit tree of `d9f0a9208499cd626cd172e3c8b2ef4878ab1dba`. Overlay the 150 candidate files, preserve all unspecified base paths (including visual snapshots), and delete exactly the two obsolete tracked handoff scripts.

Expected: no `main` ref update; only an unreferenced tree object exists until the commit is created.

- [ ] **Step 4: Create the recovery source commit**

Commit message:

```text
Recover A11.5 development baseline
```

Parent must be the current recovery-branch HEAD. Advance only `recovery/a11.5-github-baseline` by fast-forward.

- [ ] **Step 5: Review the GitHub compare result**

Compare `main...recovery/a11.5-github-baseline`. Confirm the diff includes the intended account/workspace/monitoring/report/certificate/brand changes, the two script deletions, and no generated cache/build/archive files.

Expected: `main` unchanged; recovery branch ahead; no unexpected binary snapshot deletion or generated file addition.

---

### Task 2: Add a GitHub Actions recovery gate

**Files:**
- Create: `.github/workflows/ci.yml`.

**Interfaces:**
- Consumes: existing root scripts `verify:registry`, `test`, `lint`, `typecheck`, `build`, `test:browser`, `test:python`, `lint:python`, `verify:python-lock`.
- Produces: pull-request and branch CI that exercises the existing project gates in a clean Ubuntu environment.

- [ ] **Step 1: Define deterministic runtime setup**

Use `actions/checkout@v4`, `actions/setup-node@v4` with Node `24` and npm cache, and `actions/setup-python@v5` with Python `3.14`. Install JavaScript dependencies with `npm ci`, create `.venv`, upgrade pip, and run `npm run python:install`.

- [ ] **Step 2: Install the browser required by the repository gate**

Run:

```bash
npx playwright install --with-deps chromium
```

Do not substitute a browser-free pass for the existing Playwright gate.

- [ ] **Step 3: Run the existing full verification contract**

Run:

```bash
npm run verify:local
```

Keep `PUBLIC_RELEASE=false` so the historical 110-vs-125 public-release policy inconsistency does not get silently rewritten as part of recovery.

- [ ] **Step 4: Preserve failure evidence**

On failure, upload `apps/web/test-results/**` as a GitHub Actions artifact when the directory exists. Do not turn installation, browser, visual, test, lint, typecheck, build, Python, Ruff, or lock failures into soft warnings.

- [ ] **Step 5: Commit the CI workflow separately**

Commit message:

```text
Add GitHub recovery CI gate
```

Advance only the recovery branch.

---

### Task 3: Open and inspect the Draft recovery PR

**Files:**
- No product file changes.

**Interfaces:**
- Consumes: recovery source commit and CI workflow commit.
- Produces: one Draft PR targeting `main` and CI evidence attached to the recovery head commit.

- [ ] **Step 1: Open a Draft PR**

Title:

```text
recovery: restore A11.5 GitHub baseline
```

Base: `main`. Head: `recovery/a11.5-github-baseline`. The body must identify the immutable base SHA, recovered A11.0–A11.5 + A10.40 scope, preserved visual baselines, excluded transfer/generated artifacts, and known release-policy drift.

- [ ] **Step 2: Review PR filenames and diff**

Use GitHub's changed-file list and patch/diff endpoints. Reject any generated/cache/archive file or unexpected visual-baseline deletion before considering CI status.

- [ ] **Step 3: Read GitHub Actions status**

Fetch workflow runs for the PR head. If a run exists, inspect failed jobs/logs rather than claiming success from commit creation alone.

- [ ] **Step 4: Keep the PR in Draft**

Even if CI is green, do not mark ready and do not merge. Release-policy reconciliation and any test fixes found by CI are subsequent reviewed work on the same recovery branch or narrowly scoped follow-up commits.

---

### Task 4: Record post-recovery follow-up without changing release semantics

**Files:**
- Prefer PR description / issue tracking. Do not alter `scripts/verify-release.mjs` in this task.

**Interfaces:**
- Consumes: verified recovery PR state.
- Produces: explicit follow-up for the `110`-tool release-gate drift and any CI failures.

- [ ] **Step 1: Record the release-policy inconsistency**

State that the development registry is 125 entries while `docs/RELEASE_POLICY.md` and `scripts/verify-release.mjs` still require exactly 110. Do not infer the desired final release count during recovery.

- [ ] **Step 2: Record any failing gate with exact evidence**

For each failure, capture the job/step name and relevant log excerpt. Do not merge or mark ready until the failures are addressed and the required checks rerun successfully.

## Appendix A — exact recovery source paths

- `.gitignore`
- `CHANGELOG.md`
- `account.env.example`
- `apps/api/src/webdiag_api/accounts/__init__.py`
- `apps/api/src/webdiag_api/accounts/api.py`
- `apps/api/src/webdiag_api/accounts/models.py`
- `apps/api/src/webdiag_api/accounts/monitoring_api.py`
- `apps/api/src/webdiag_api/accounts/monitoring_change.py`
- `apps/api/src/webdiag_api/accounts/monitoring_models.py`
- `apps/api/src/webdiag_api/accounts/monitoring_notifications.py`
- `apps/api/src/webdiag_api/accounts/monitoring_service.py`
- `apps/api/src/webdiag_api/accounts/monitoring_storage.py`
- `apps/api/src/webdiag_api/accounts/report_api.py`
- `apps/api/src/webdiag_api/accounts/report_artifact.py`
- `apps/api/src/webdiag_api/accounts/report_models.py`
- `apps/api/src/webdiag_api/accounts/report_service.py`
- `apps/api/src/webdiag_api/accounts/report_storage.py`
- `apps/api/src/webdiag_api/accounts/security.py`
- `apps/api/src/webdiag_api/accounts/service.py`
- `apps/api/src/webdiag_api/accounts/storage.py`
- `apps/api/src/webdiag_api/accounts/workspace_api.py`
- `apps/api/src/webdiag_api/accounts/workspace_issues.py`
- `apps/api/src/webdiag_api/accounts/workspace_models.py`
- `apps/api/src/webdiag_api/accounts/workspace_service.py`
- `apps/api/src/webdiag_api/accounts/workspace_storage.py`
- `apps/api/src/webdiag_api/config.py`
- `apps/api/src/webdiag_api/data/tools.json`
- `apps/api/src/webdiag_api/main.py`
- `apps/api/tests/test_account_api.py`
- `apps/api/tests/test_account_issues_api.py`
- `apps/api/tests/test_account_monitoring_api.py`
- `apps/api/tests/test_account_reports_api.py`
- `apps/api/tests/test_account_workspace_api.py`
- `apps/api/tests/test_api.py`
- `apps/api/tests/test_registry.py`
- `apps/web/app/(en)/en/account/page.tsx`
- `apps/web/app/(en)/en/account/projects/[projectId]/audits/[auditId]/issues/[issueId]/page.tsx`
- `apps/web/app/(en)/en/account/projects/[projectId]/audits/[auditId]/issues/page.tsx`
- `apps/web/app/(en)/en/account/projects/[projectId]/audits/[auditId]/page.tsx`
- `apps/web/app/(en)/en/account/projects/[projectId]/monitoring/page.tsx`
- `apps/web/app/(en)/en/account/projects/[projectId]/page.tsx`
- `apps/web/app/(en)/en/account/reports/[reportId]/page.tsx`
- `apps/web/app/(en)/en/account/reports/page.tsx`
- `apps/web/app/(en)/en/login/page.tsx`
- `apps/web/app/(en)/en/register/page.tsx`
- `apps/web/app/(en)/layout.tsx`
- `apps/web/app/(ru)/account/page.tsx`
- `apps/web/app/(ru)/account/projects/[projectId]/audits/[auditId]/issues/[issueId]/page.tsx`
- `apps/web/app/(ru)/account/projects/[projectId]/audits/[auditId]/issues/page.tsx`
- `apps/web/app/(ru)/account/projects/[projectId]/audits/[auditId]/page.tsx`
- `apps/web/app/(ru)/account/projects/[projectId]/monitoring/page.tsx`
- `apps/web/app/(ru)/account/projects/[projectId]/page.tsx`
- `apps/web/app/(ru)/account/reports/[reportId]/page.tsx`
- `apps/web/app/(ru)/account/reports/page.tsx`
- `apps/web/app/(ru)/login/page.tsx`
- `apps/web/app/(ru)/register/page.tsx`
- `apps/web/app/(ru)/layout.tsx`
- `apps/web/app/account.css`
- `apps/web/app/api/account/monitors/route.ts`
- `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/issues/[issueId]/route.ts`
- `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/issues/route.ts`
- `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/reports/route.ts`
- `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/route.ts`
- `apps/web/app/api/account/projects/[projectId]/audits/route.ts`
- `apps/web/app/api/account/projects/[projectId]/monitor/history/route.ts`
- `apps/web/app/api/account/projects/[projectId]/monitor/route.ts`
- `apps/web/app/api/account/projects/[projectId]/monitor/run/route.ts`
- `apps/web/app/api/account/projects/[projectId]/route.ts`
- `apps/web/app/api/account/projects/route.ts`
- `apps/web/app/api/account/reports/[reportId]/export.html/route.ts`
- `apps/web/app/api/account/reports/[reportId]/print/route.ts`
- `apps/web/app/api/account/reports/[reportId]/route.ts`
- `apps/web/app/api/account/reports/[reportId]/share/route.ts`
- `apps/web/app/api/account/reports/route.ts`
- `apps/web/app/api/reports/share/[shareToken]/export.html/route.ts`
- `apps/web/app/api/reports/share/[shareToken]/print/route.ts`
- `apps/web/app/api/reports/share/[shareToken]/route.ts`
- `apps/web/app/globals.css`
- `apps/web/app/reports/share/[shareToken]/page.tsx`
- `apps/web/e2e/account.spec.ts`
- `apps/web/e2e/home-design.spec.ts`
- `apps/web/e2e/metadata.spec.ts`
- `apps/web/e2e/pem-certificate.spec.ts`
- `apps/web/e2e/smoke.spec.ts`
- `apps/web/next-env.d.ts`
- `apps/web/public/apple-touch-icon.png`
- `apps/web/public/favicon-96x96.png`
- `apps/web/public/favicon.ico`
- `apps/web/public/favicon.svg`
- `apps/web/public/logo.avif`
- `apps/web/public/logo.webp`
- `apps/web/public/site.webmanifest`
- `apps/web/public/web-app-manifest-192x192.png`
- `apps/web/public/web-app-manifest-512x512.png`
- `apps/web/src/components/site-brand.tsx`
- `apps/web/src/components/site-header.tsx`
- `apps/web/src/content/tool-pages/security-network.ts`
- `apps/web/src/features/account/account-auth-form.tsx`
- `apps/web/src/features/account/account-client.test.ts`
- `apps/web/src/features/account/account-client.ts`
- `apps/web/src/features/account/account-contract.ts`
- `apps/web/src/features/account/account-dashboard.tsx`
- `apps/web/src/features/account/account-issue-detail.tsx`
- `apps/web/src/features/account/account-issues-contract.test.ts`
- `apps/web/src/features/account/account-issues-contract.ts`
- `apps/web/src/features/account/account-issues-list.tsx`
- `apps/web/src/features/account/account-messages.ts`
- `apps/web/src/features/account/account-monitoring-client.ts`
- `apps/web/src/features/account/account-monitoring-contract.ts`
- `apps/web/src/features/account/account-monitoring-proxy.ts`
- `apps/web/src/features/account/account-monitoring.tsx`
- `apps/web/src/features/account/account-project-detail.tsx`
- `apps/web/src/features/account/account-proxy-contract.test.ts`
- `apps/web/src/features/account/account-proxy-contract.ts`
- `apps/web/src/features/account/account-proxy.ts`
- `apps/web/src/features/account/account-report-client.test.ts`
- `apps/web/src/features/account/account-report-client.ts`
- `apps/web/src/features/account/account-report-contract.test.ts`
- `apps/web/src/features/account/account-report-contract.ts`
- `apps/web/src/features/account/account-report-detail.tsx`
- `apps/web/src/features/account/account-report-proxy.ts`
- `apps/web/src/features/account/account-report-view.tsx`
- `apps/web/src/features/account/account-reports.tsx`
- `apps/web/src/features/account/account-saved-audit.tsx`
- `apps/web/src/features/account/account-workspace-client.test.ts`
- `apps/web/src/features/account/account-workspace-client.ts`
- `apps/web/src/features/account/account-workspace-contract.ts`
- `apps/web/src/features/account/account-workspace-proxy.ts`
- `apps/web/src/features/account/account-workspace-shell-contract.test.ts`
- `apps/web/src/features/account/account-workspace-shell-contract.ts`
- `apps/web/src/features/account/account-workspace-shell.tsx`
- `apps/web/src/features/account/public-report.tsx`
- `apps/web/src/features/tools/pem-certificate-engine.test.ts`
- `apps/web/src/features/tools/pem-certificate-engine.ts`
- `apps/web/src/features/tools/pem-certificate-tool.tsx`
- `apps/web/src/features/tools/tool-renderer.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/worker/src/webdiag_worker/actors.py`
- `apps/worker/src/webdiag_worker/monitoring.py`
- `apps/worker/src/webdiag_worker/scheduler.py`
- `apps/worker/tests/test_monitoring.py`
- `docker-compose.account.override.yml`
- `docs/ACCOUNT_WORKSPACE.md`
- `docs/VERIFICATION.md`
- `packages/tool-registry/registry/tools.json`
- `packages/tool-registry/tests/registry.test.ts`
