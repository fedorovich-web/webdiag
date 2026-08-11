# WebDiag GitHub Recovery Baseline Design

Date: 2026-08-11

## Goal

Recover the latest known WebDiag development state into GitHub without modifying `main`, make GitHub the only source of truth for future development, and require CI evidence before any merge into `main`.

## Current Git baseline

- Repository: `fedorovich-web/webdiag`.
- Stable base: `main` at `d9f0a9208499cd626cd172e3c8b2ef4878ab1dba` (`Add HTML entity and diff tools`).
- Package version at the base and in the recovered candidate: `0.5.11`.
- Recovery branch: `recovery/a11.5-github-baseline`.
- `main` must remain unchanged until the recovery branch has passed the required gates and the user explicitly authorizes a merge.

## Recovered candidate evidence

Two independent local sources were compared:

1. the preserved verified handoff based on Git HEAD `d9f0a9208499cd626cd172e3c8b2ef4878ab1dba`, with its documented dirty A11.0/account worktree;
2. `webdiag-a11.5-cumulative-replacement-files.zip`, whose recorded SHA-256 is `f36a0aac6a16148df836820bd4506229530e74c8f50f7131399532c55a03089f`;
3. the user-provided full local project archive `1.zip`, SHA-256 `da0664ea6dd79710a5c194842b9879a1ac3f9b6a78689cb6110e2d426198a084`.

After excluding transfer-only/generated files and historical visual baselines, the user-provided local project and the reconstructed A11.5 candidate each contain 560 product files and produce the same normalized aggregate SHA-256:

`5a45e644d89d3adcd81ef88f4c2e9e5bd25fe34fe693c4c116811a51a6c2bb73`

This establishes the uploaded local project as confirmation of the A11.5 candidate, not as a divergent later code state.

## Candidate scope

The recovery candidate contains the accumulated development work for:

- A11.0 — account foundation closeout;
- A11.1 — projects and saved audits;
- A11.2 — account workspace UI;
- A11.3 — issues and priorities;
- A11.4 — monitoring foundation;
- A10.40 — Certificate Inspection Workbench / `WD-033`;
- A11.5 — saved reports, HTML/print export, and expiring share links;
- the associated account/site-brand/header/layout changes that were already present in the verified dirty handoff and were preserved by the cumulative replacement sequence.

The registry candidate is 125 total entries, 103 `ready`, and 22 `internal`.

## Recovery inclusion policy

Recover source code, tests, application assets, configuration, lock files, and product documentation that are part of the candidate state.

Do not import local environment or generated artifacts, including:

- `node_modules/`;
- `.next/`;
- `.venv/`;
- `test-results/`, `playwright-report/`, `blob-report/`;
- `__pycache__/`, `.pytest_cache/`, `.ruff_cache/`, `.mypy_cache/`;
- `*.pyc`, `*.log`, `*.tsbuildinfo`;
- local `.env` files;
- generated `SHA256SUMS.txt`;
- replacement ZIP files;
- `HANDOFF/`, `MANIFEST.txt`, and handoff-builder-only artifacts such as `CREATE_WEBDIAG_HANDOFF.ps1`, `CREATE_WEBDIAG_HANDOFF.py`, and `test_create_webdiag_handoff.py`.

The two obsolete tracked local handoff scripts documented as deleted in the verified handoff (`create-webdiag-next-chat-context.ps1` and `create-webdiag-next-chat-context-v2.ps1`) are recovery deletion candidates and must be reviewed explicitly before the final recovery commit.

## Visual baseline policy

The user-provided full local archive contains no `visual.spec.ts-snapshots` images. Their absence must not be interpreted as an intentional deletion.

Recovery therefore preserves the visual baselines currently tracked by GitHub `main`. Any snapshot update must occur only after the recovered UI builds and the affected screenshots are manually reviewed. The historical dirty handoff's modified `narrow-header-menu` screenshot is evidence only and is not automatically promoted as the approved baseline.

## GitHub-only workflow

From this recovery onward:

1. all development happens in `recovery/*`, `feature/*`, or equivalent non-`main` branches;
2. commits and pushes are allowed in those branches even before the full gate is green, because GitHub Actions requires pushed commits to execute;
3. work under active validation remains in a Draft PR;
4. direct changes to `main`, force-pushes to `main`, and merge to `main` are prohibited;
5. a PR may leave draft state only after the required checks are green and its diff has been reviewed;
6. merge into `main` additionally requires explicit user authorization.

## CI design

The recovery branch must add GitHub Actions before it is considered mergeable. CI should reproduce the existing project gates rather than invent a parallel validation system.

Required coverage:

- deterministic Node/npm setup using the committed lockfile;
- compatible Python setup and locked Python dependencies;
- registry and catalog verification;
- workspace, registry, core, and web unit tests;
- ESLint and TypeScript typecheck;
- production build and built-site verification with `PUBLIC_RELEASE=false`;
- Python tests, Ruff, and Python lock verification;
- Playwright Chromium browser tests;
- visual comparisons only against explicitly approved baselines.

A failing dependency installation, unavailable browser, or other environment failure is a failed/incomplete gate, not a passing result.

## Release-policy drift

Current project documentation and `scripts/verify-release.mjs` still require exactly 110 registry tools, while the accepted development registry contains 125 entries. This is a known policy/code inconsistency.

It must not be silently changed as part of copying the recovered candidate. After the candidate is recovered and CI is operational, release-policy reconciliation must be handled as an explicit reviewed task before any public release.

## Verification rules

No recovered code is described as working merely because it was present in the local project or an earlier replacement archive.

Evidence levels are separate:

- archive/hash comparison proves candidate identity;
- registry scripts prove registry structural validity;
- unit/integration/browser/build commands prove executable behavior;
- GitHub Actions provides the merge gate for the GitHub-only workflow.

Until the complete required CI passes, the recovery PR remains a development candidate.

## Success criteria

Recovery is complete only when:

- the candidate source state has been committed to `recovery/a11.5-github-baseline` without generated/local artifacts;
- the resulting GitHub diff matches the intended A11.0–A11.5 + A10.40 scope and reviewed handoff changes;
- GitHub Actions is present and the required checks pass;
- visual baselines have either remained unchanged or any required updates have been explicitly reviewed;
- no release/version/merge claim is made from archival evidence alone;
- `main` remains untouched until explicit user approval to merge.
