# WebDiag Cross-Platform Python Hash Locks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace WebDiag's version-only Python constraint with deterministic, wheel-only SHA-256 locks that work for Windows development/CI, Linux Python 3.13/3.14 verification, and minimal API/worker production images.

**Architecture:** Four exact-pin source sets define build, API runtime, worker runtime, and development closures. A fail-closed Node parser validates their restricted grammar; an explicit PyPI-only refresher collects all non-yanked wheel hashes and publishes generated locks atomically. Local installs, CI, and multi-stage Docker builds consume committed locks in pip isolated/hash-checking mode, while an offline verifier checks source/lock/project/installed-environment parity without contacting a registry.

**Tech Stack:** Node.js 24 ESM scripts and `node:test`, Python 3.13/3.14 with pip, PyPI JSON API, Hatchling 1.27.0, GitHub Actions, Docker.

## Global Constraints

- Stay on `feature/backend-production-readiness`; do not create a branch/worktree, merge, release, deploy, tag, or modify `main`.
- Preserve all existing application dependency versions. A resolver conflict is a separate explained change, not an implicit upgrade.
- Use only the exact packages and versions in this plan unless a clean install proves inconsistency; stop and document that evidence before changing a version.
- Do not add a runtime dependency to WebDiag. Build-only pins are already implicit Hatchling dependencies; `pika==1.4.1` is already the worker's declared `rabbitmq` extra.
- Tests use fixture metadata only. Only `npm run python:lock:refresh` may access PyPI.
- Every pip third-party install uses `--isolated --index-url https://pypi.org/simple --require-hashes --only-binary=:all:`. Local WebDiag packages use `--no-deps --no-build-isolation`.
- Keep errors limited to a repository-relative filename, normalized package name, exact version, and violated rule. Never print environment values, alternate index configuration, credentials, or response bodies.
- Use `apply_patch` for source edits. Run each affected targeted gate once after its grouped change; a repeat requires a named code/test change.
- Commit only the files named by each task. Do not use `git add -A`.

---

### Task 1: Implement the fail-closed lock grammar and deterministic renderer

**Files:**

- Create: `scripts/python-locks.mjs`
- Create: `scripts/tests-python-hashes.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing parser and renderer tests**

Cover these contracts with fixture strings:

```js
parsePinSource(source, { sourceName })
parseHashedLock(source, { sourceName })
wheelHashesFromPyPIMetadata(metadata, { packageName, version })
renderHashedLock(entries, { sourceName })
```

Tests must prove:

- PEP 503-style normalization maps `_`, `.`, repeated separators, and case to one `-` form.
- Source rows accept only `name==version` plus the two repository markers `sys_platform == "win32"` and `sys_platform != "win32"`.
- Blank lines and comments are accepted; extras, URLs, paths, editable rows, pip options, wildcards, compatible/range pins, inline hashes, duplicate normalized names, and unknown/combined markers are rejected.
- Lock rows require the exact source pin followed by one or more lowercase 64-hex `--hash=sha256:` continuations.
- Duplicate or unsorted hashes, duplicate packages, sdists, yanked files, missing digests, mismatched package/version metadata, and releases with no non-yanked wheels fail closed.
- Rendering sorts packages by normalized name, hashes lexicographically, uses LF, and produces identical output for shuffled fixture metadata.

Add the new test file to `test:workspace` so the contract cannot be bypassed.

- [ ] **Step 2: Run the red test**

Run: `node --test scripts/tests-python-hashes.test.mjs`

Expected: FAIL because `scripts/python-locks.mjs` does not exist.

- [ ] **Step 3: Implement the minimal pure module**

Export the four functions above plus `normalizePythonPackageName`. Use anchored regular expressions and explicit marker allow-listing rather than general marker evaluation. Validate PyPI metadata structurally and accept only `packagetype === "bdist_wheel"`, `yanked === false`, and `digests.sha256` matching `/^[0-9a-f]{64}$/`.

Do not read files, environment values, or network state in this module.

- [ ] **Step 4: Run the targeted green test**

Run: `node --test scripts/tests-python-hashes.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the grammar contract**

```powershell
git add scripts/python-locks.mjs scripts/tests-python-hashes.test.mjs package.json
git commit -m "test(security): define Python hash lock grammar"
```

---

### Task 2: Build the fixed-origin, bounded, atomic hash refresher

**Files:**

- Create: `scripts/refresh-python-lock-hashes.mjs`
- Modify: `scripts/tests-python-hashes.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing orchestration tests**

Use temporary directories and an injected `fetchMetadata(url, options)` fixture. Test exported:

```js
refreshPythonLocks({ rootDir, fetchMetadata, maxResponseBytes })
```

Prove that it:

- reads only the fixed build/API/worker/dev source pairs under `requirements/`;
- derives only `https://pypi.org/pypi/<normalized-name>/<encoded-version>/json` URLs;
- sends no authorization header and ignores proxy/index environment settings;
- rejects redirects, non-200 results, non-JSON content type, declared or streamed bodies above 2 MiB, malformed JSON, metadata identity mismatch, and invalid wheel data;
- fetches and validates every package in every group before writing any output;
- writes a private sibling temporary file and renames it over the target;
- leaves all existing locks byte-for-byte unchanged on a pre-publication failure;
- cleans its own temporary files on a handled failure;
- renders identical metadata only once through an in-memory `(name, version)` cache.

- [ ] **Step 2: Run the red test**

Run: `node --test scripts/tests-python-hashes.test.mjs`

Expected: FAIL because the refresher/export does not exist.

- [ ] **Step 3: Implement the refresher**

Use a constant manifest:

```js
const LOCK_GROUPS = [
  ["python-build.in", "python-build.lock.txt"],
  ["python-api.in", "python-api.lock.txt"],
  ["python-worker.in", "python-worker.lock.txt"],
  ["python-dev.in", "python-dev.lock.txt"],
];
```

Use the built-in `fetch`, `AbortSignal.timeout(15_000)`, redirect rejection, a 2 MiB maximum, and response-stream byte counting. Read and validate every input first; fetch every unique release; construct every output in memory; create every temporary sibling with exclusive permissions; then rename each target. If an OS failure occurs between renames, return nonzero and rely on the offline multi-group verifier in Task 4 to reject the mixed set.

The CLI must call the exported function only when invoked directly. Add:

```json
"python:lock:refresh": "node scripts/refresh-python-lock-hashes.mjs"
```

- [ ] **Step 4: Run the targeted green test**

Run: `node --test scripts/tests-python-hashes.test.mjs`

Expected: PASS with fixture-only network behavior.

- [ ] **Step 5: Commit the refresher**

```powershell
git add scripts/refresh-python-lock-hashes.mjs scripts/tests-python-hashes.test.mjs package.json
git commit -m "feat(build): add atomic Python hash refresher"
```

---

### Task 3: Define and audit the four dependency groups, then generate wheel locks

**Files:**

- Create: `requirements/python-build.in`
- Create: `requirements/python-api.in`
- Create: `requirements/python-worker.in`
- Create: `requirements/python-dev.in`
- Create: `requirements/python-build.lock.txt`
- Create: `requirements/python-api.lock.txt`
- Create: `requirements/python-worker.lock.txt`
- Create: `requirements/python-dev.lock.txt`

- [ ] **Step 1: Create exact, sorted source groups**

Keep the current 39-package closure unchanged and add only the already declared/implicit packages below:

- Build-only: `hatchling==1.27.0`, `pathspec==1.1.1`, `trove-classifiers==2026.6.1.19`; reuse `packaging==26.2` and `pluggy==1.6.0`.
- Worker RabbitMQ: `pika==1.4.1`.
- Windows conditional: `colorama==0.4.6; sys_platform == "win32"`.
- Non-Windows conditional: `uvloop==0.22.1; sys_platform != "win32"`.

Group membership:

- `python-build.in`: Hatchling plus its five-package exact closure.
- `python-api.in`: API runtime closure only, including FastAPI, Pydantic settings, boto3, HTTPX, Pillow, tzdata, and `uvicorn[standard]` transitives; exclude pytest, Ruff, Hatchling, Dramatiq, and pika.
- `python-worker.in`: worker runtime closure only, including Dramatiq, pika, boto3, HTTPX, Pillow, and Pydantic transitives; exclude FastAPI, Uvicorn, pytest, Ruff, and Hatchling.
- `python-dev.in`: exact union of build, API runtime, worker runtime, pytest closure, and Ruff.

Use these resolver-confirmed Windows/Linux-neutral sets; keep the rows sorted by normalized name:

```text
python-build.in (5)
hatchling==1.27.0
packaging==26.2
pathspec==1.1.1
pluggy==1.6.0
trove-classifiers==2026.6.1.19

python-api.in (33)
annotated-doc==0.0.4
annotated-types==0.7.0
anyio==4.14.2
boto3==1.43.70
botocore==1.43.70
certifi==2026.6.17
click==8.4.2
colorama==0.4.6; sys_platform == "win32"
fastapi==0.139.1
h11==0.16.0
httpcore==1.0.9
httptools==0.8.0
httpx==0.28.1
idna==3.18
jmespath==1.1.0
Pillow==12.3.0
pydantic==2.13.4
pydantic_core==2.46.4
pydantic-settings==2.14.2
python-dateutil==2.9.0.post0
python-dotenv==1.2.2
PyYAML==6.0.3
s3transfer==0.19.2
six==1.17.0
starlette==1.3.1
typing_extensions==4.16.0
typing-inspection==0.4.2
tzdata==2026.3
urllib3==2.7.0
uvicorn==0.51.0
uvloop==0.22.1; sys_platform != "win32"
watchfiles==1.2.0
websockets==16.1.1

python-worker.in (21)
annotated-types==0.7.0
anyio==4.14.2
boto3==1.43.70
botocore==1.43.70
certifi==2026.6.17
dramatiq==2.2.0
h11==0.16.0
httpcore==1.0.9
httpx==0.28.1
idna==3.18
jmespath==1.1.0
pika==1.4.1
Pillow==12.3.0
pydantic==2.13.4
pydantic_core==2.46.4
python-dateutil==2.9.0.post0
s3transfer==0.19.2
six==1.17.0
typing_extensions==4.16.0
typing-inspection==0.4.2
urllib3==2.7.0

python-dev.in (44)
annotated-doc==0.0.4
annotated-types==0.7.0
anyio==4.14.2
boto3==1.43.70
botocore==1.43.70
certifi==2026.6.17
click==8.4.2
colorama==0.4.6; sys_platform == "win32"
dramatiq==2.2.0
fastapi==0.139.1
h11==0.16.0
hatchling==1.27.0
httpcore==1.0.9
httptools==0.8.0
httpx==0.28.1
idna==3.18
iniconfig==2.3.0
jmespath==1.1.0
packaging==26.2
pathspec==1.1.1
pika==1.4.1
Pillow==12.3.0
pluggy==1.6.0
pydantic==2.13.4
pydantic_core==2.46.4
pydantic-settings==2.14.2
Pygments==2.20.0
pytest==9.1.1
python-dateutil==2.9.0.post0
python-dotenv==1.2.2
PyYAML==6.0.3
ruff==0.15.21
s3transfer==0.19.2
six==1.17.0
starlette==1.3.1
trove-classifiers==2026.6.1.19
typing_extensions==4.16.0
typing-inspection==0.4.2
tzdata==2026.3
urllib3==2.7.0
uvicorn==0.51.0
uvloop==0.22.1; sys_platform != "win32"
watchfiles==1.2.0
websockets==16.1.1
```

The API and worker membership above was confirmed with pip dry-run resolution against `requirements-dev.lock.txt` on Python 3.14. The dev set is their normalized union with the exact build/test/lint rows, so shared rows occur once; the marker-bearing colorama/uvloop rows remain unchanged.

Retain `requirements-dev.lock.txt` during this task because current installation and verification still consume it.

- [ ] **Step 2: Audit the proposed exact set before it becomes an install input**

Run:

```powershell
uvx --isolated --from pip-audit==2.10.1 pip-audit -r requirements/python-dev.in --no-deps --disable-pip
```

Expected: exit 0 and no known vulnerability report. If it reports a vulnerability or cannot parse a supported marker, stop; record the exact package/advisory or parser error and resolve it as a separate reviewed dependency decision.

- [ ] **Step 3: Generate all four locks from live public PyPI metadata**

Run: `npm run python:lock:refresh`

Expected: four generated lock files; no package version changes, URLs, sdists, or yanked artifacts.

- [ ] **Step 4: Inspect deterministic and threat-boundary properties**

Run:

```powershell
git diff -- requirements
rg -n "https?://|^-e |--editable|\.tar\.gz|\.zip" requirements
node --test scripts/tests-python-hashes.test.mjs
```

Expected: only generated header comments, exact pins, markers, and sorted SHA-256 continuations; `rg` returns no requirement rows containing disallowed sources/archives; targeted tests pass.

- [ ] **Step 5: Commit source sets and generated locks**

```powershell
git add requirements/python-build.in requirements/python-build.lock.txt requirements/python-api.in requirements/python-api.lock.txt requirements/python-worker.in requirements/python-worker.lock.txt requirements/python-dev.in requirements/python-dev.lock.txt
git commit -m "build(python): add wheel-hashed dependency locks"
```

---

### Task 4: Migrate local installation and offline environment verification

**Files:**

- Create: `scripts/install-python-dependencies.mjs`
- Modify: `scripts/verify-python-lock.mjs`
- Modify: `scripts/tests-python-lock.test.mjs`
- Modify: `scripts/tests-workspace-integrity.test.mjs`
- Modify: `package.json`
- Delete: `requirements-dev.lock.txt`

- [ ] **Step 1: Replace verifier-exception tests with marker-aware failing tests**

Tests must prove:

- source/lock parity for all four fixed groups;
- build, API, and worker groups are subsets of dev;
- API and worker direct `pyproject.toml` dependencies and extras map to their runtime sources;
- both build-system requirements map to build and dev;
- Windows selects `colorama` and excludes `uvloop`; Linux does the reverse;
- installed-package comparison uses the selected dev rows and has no package exception maps;
- missing, extra, or version-drifted installed distributions fail;
- malformed freeze output and duplicate installed names fail;
- `python:install` invokes a dedicated installer and the old root lock has no consumer.

- [ ] **Step 2: Run the red targeted tests**

Run:

```powershell
node --test scripts/tests-python-lock.test.mjs scripts/tests-workspace-integrity.test.mjs
```

Expected: FAIL because the verifier still reads the root lock and carries Windows/optional exceptions.

- [ ] **Step 3: Implement the installer and offline verifier**

`scripts/install-python-dependencies.mjs` must locate `.venv` with `requireVenvPython`, then run exactly two child processes with `shell: false` and inherited stdio:

```text
python -m pip --isolated install --index-url https://pypi.org/simple --require-hashes --only-binary=:all: -r requirements/python-dev.lock.txt
python -m pip --isolated install --no-deps --no-build-isolation -e ./apps/api[dev] -e ./apps/worker[dev,rabbitmq]
```

Do not pass ambient `PIP_*` values to pip; construct a child environment with those keys removed. Propagate the first nonzero exit without running step two.

Rewrite `verify-python-lock.mjs` around `python-locks.mjs`. It must read all eight source/generated files, check group relationships and both `pyproject.toml` declarations, evaluate only the two allow-listed platform markers, and compare the selected dev set with `pip freeze --exclude-editable`. Remove `WINDOWS_SKIPPED_LOCKED_PACKAGES`, `WINDOWS_ALLOWED_INSTALLED_PACKAGES`, and `OPTIONAL_PROJECT_INSTALLED_PACKAGES`.

Change scripts to:

```json
"python:install": "node scripts/install-python-dependencies.mjs",
"verify:python-lock": "node scripts/verify-python-lock.mjs"
```

Delete `requirements-dev.lock.txt` only after `rg` shows no live consumer.

- [ ] **Step 4: Run the targeted green tests**

Run:

```powershell
node --test scripts/tests-python-hashes.test.mjs scripts/tests-python-lock.test.mjs scripts/tests-workspace-integrity.test.mjs scripts/tests-python-runtime.test.mjs
rg -n "requirements-dev\.lock\.txt" package.json scripts .github apps docker-compose*.yml README.md docs/INSTALLATION.md
```

Expected: tests PASS; `rg` may find historical documentation only, but no executable consumer. Do not edit historical verification entries.

- [ ] **Step 5: Prove a clean Windows install**

Create a repository-adjacent temporary directory with `New-Item`, create a Python 3.14 venv there, and invoke the same two pip commands against absolute repository lock/package paths. Then run:

```text
<temporary-python> -m pip check
<temporary-python> -m pip freeze --exclude-editable
```

Feed the captured freeze output to the exported verifier with `platform: "win32"`. Before deleting the temporary directory, resolve its absolute path and assert it is beneath the explicitly created repository-adjacent test directory, not the repository or a user/system root. Delete only that verified literal path.

Expected: install, `pip check`, and offline comparison PASS; no sdist/build-isolation download appears.

- [ ] **Step 6: Refresh the project `.venv` and verify it**

Run once after the clean-environment proof:

```powershell
npm run python:install
npm run verify:python-lock
node scripts/run-python.mjs -m pip check
```

Expected: all PASS.

- [ ] **Step 7: Commit the local-install migration**

```powershell
git add scripts/install-python-dependencies.mjs scripts/verify-python-lock.mjs scripts/tests-python-lock.test.mjs scripts/tests-workspace-integrity.test.mjs package.json requirements-dev.lock.txt
git commit -m "security(python): enforce hashed local installs"
```

---

### Task 5: Convert API and worker images to hashed multi-stage builds

**Files:**

- Modify: `scripts/tests-workspace-integrity.test.mjs`
- Modify: `apps/api/Dockerfile`
- Modify: `apps/worker/Dockerfile`

- [ ] **Step 1: Add failing Docker policy tests**

Read both Dockerfiles and assert:

- each has named `builder` and final `runtime` stages;
- builder installs `requirements/python-build.lock.txt` with isolated/fixed-index/require-hashes/wheel-only flags;
- builder runs `pip wheel --no-deps --no-build-isolation` for only its local package;
- final stage installs only its matching runtime lock with the same third-party integrity flags;
- final local wheel install uses `--no-deps`;
- no bare `pip install /app/apps/...`, editable install, dev lock, pytest, or Ruff appears;
- final image copies only the wheel from builder, not the source tree.

- [ ] **Step 2: Run the red test**

Run: `node --test scripts/tests-workspace-integrity.test.mjs`

Expected: FAIL against both current single-stage Dockerfiles.

- [ ] **Step 3: Implement both multi-stage Dockerfiles**

Use the existing unmodified `python:3.14-slim-bookworm` base in both stages. In builder, copy the build lock and one package, install hashed build dependencies, and create `/wheels/webdiag_*.whl`. In runtime, copy the API lock for the API image or the worker lock for the worker image, then copy/install exactly one local wheel with `--no-deps`. Keep existing `EXPOSE` and `CMD` behavior.

Do not claim base-image provenance; digest pinning remains outside this patch.

- [ ] **Step 4: Run the targeted green test**

Run: `node --test scripts/tests-workspace-integrity.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the container migration**

```powershell
git add scripts/tests-workspace-integrity.test.mjs apps/api/Dockerfile apps/worker/Dockerfile
git commit -m "security(docker): install hashed Python runtimes"
```

---

### Task 6: Add Linux Python 3.13/3.14 and Docker release gates

**Files:**

- Modify: `scripts/tests-workflow-security.test.mjs`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add failing workflow policy tests**

Without adding a YAML parser dependency, assert the checked-in workflow contains:

- no `pip install --upgrade pip` step;
- existing Windows full verification still calls `npm run python:install` before `npm run verify:local`;
- a separate Ubuntu job with `matrix.python-version: ["3.13", "3.14"]`;
- immutable existing checkout/setup-node/setup-python action SHAs;
- hashed install, offline verify, Python tests, Ruff, and `pip check` on both matrix entries;
- API/worker Docker builds and bounded smoke checks only when matrix Python is 3.14;
- no service start, provider request, RabbitMQ connection, S3 request, OpenRouter request, or public URL probe.

- [ ] **Step 2: Run the red test**

Run: `node --test scripts/tests-workflow-security.test.mjs`

Expected: FAIL because the workflow upgrades pip and has no Linux matrix job.

- [ ] **Step 3: Modify the workflow**

Remove the Windows `Upgrade pip` step. Add `python-locks` on `ubuntu-latest` with Node 24 and Python matrix 3.13/3.14, `npm ci`, `.venv` creation, `npm run python:install`, `npm run verify:python-lock`, `npm run test:python`, `npm run lint:python`, and `node scripts/run-python.mjs -m pip check`.

For 3.14 only, build tagged local images from both Dockerfiles. Smoke API with a direct Python import of `webdiag_api.main:app`; smoke worker with a direct import of `webdiag_worker.actors`. Override image entrypoints for these imports so neither service starts and no external capability is exercised.

- [ ] **Step 4: Run the targeted green gate**

Run:

```powershell
node --test scripts/tests-workflow-security.test.mjs scripts/tests-workspace-integrity.test.mjs
npm run test:workspace
```

Expected: targeted tests and the complete workspace-script suite PASS.

- [ ] **Step 5: Commit the CI gate**

```powershell
git add scripts/tests-workflow-security.test.mjs .github/workflows/ci.yml
git commit -m "security(ci): verify Python hashes across platforms"
```

---

### Task 7: Document operations, run one fresh full verification, and update the Draft PR

**Files:**

- Modify: `README.md`
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/VERIFICATION.md`

- [ ] **Step 1: Update maintainer and installation documentation**

Document:

- `.in` files are reviewed exact source sets; `.lock.txt` files are generated wheel hashes;
- `npm run python:lock:refresh` is the only networked refresh and must be reviewed as a dependency change;
- normal `npm run python:install` never refreshes locks and uses the fixed PyPI origin in isolated/hash mode;
- Windows uses colorama and excludes uvloop through committed markers; Linux does the reverse;
- API and worker production images use separate runtime locks;
- hash-checking authenticates approved bytes only and does not replace vulnerability/provenance review.

Do not rewrite historical verification records. Add a new dated section only after commands complete, with observed counts/output and explicit `непроверено` for any unavailable local Docker or remote gate.

- [ ] **Step 2: Run the final dependency audits once**

Run:

```powershell
npm audit --audit-level=high --json
uvx --isolated --from pip-audit==2.10.1 pip-audit -r requirements/python-dev.in --no-deps --disable-pip
```

Expected: both exit 0. Record exact observed package/advisory counts; do not copy environment paths or registry internals into docs.

- [ ] **Step 3: Run one fresh affected/full local gate**

Run in this order:

```powershell
npm run test:workspace
npm run test:python
npm run lint:python
npm run verify:python-lock
node scripts/run-python.mjs -m pip check
git diff --check
git status --short
```

Expected: all PASS. Frontend/browser/build tests are not rerun locally because this patch changes no frontend source or UI contract; the pushed Windows `Full verification` job remains the complete repository gate.

If Docker is available, run both local builds and the same import-only smoke checks as CI exactly once. If Docker is unavailable, record local Docker verification as `непроверено`; do not substitute an invented result.

- [ ] **Step 4: Commit only factual documentation**

```powershell
git add README.md docs/INSTALLATION.md docs/VERIFICATION.md
git commit -m "docs(security): document Python hash operations"
```

- [ ] **Step 5: Review commit scope and push the existing branch**

Run:

```powershell
git status --short --branch
git log --oneline fb79f14..HEAD
git diff --stat fb79f14..HEAD
git push origin HEAD:feature/backend-production-readiness
```

Expected: clean worktree after intentional commits; push updates Draft PR #3 without force.

- [ ] **Step 6: Verify GitHub gates on the pushed SHA**

Run:

```powershell
gh run list --branch feature/backend-production-readiness --limit 5
gh pr checks 3 --watch --interval 20
```

Expected: both `Full verification` and the Linux Python hash/Docker matrix succeed for the pushed SHA. If a job fails, use `superpowers:systematic-debugging`, inspect the failing job log, make one evidence-based correction, rerun only the changed local gate, commit, and push normally.

- [ ] **Step 7: Update the Draft PR body with verified scope**

Add a concise section stating the four lock groups, fixed PyPI/hash boundary, clean Windows install evidence, Linux 3.13/3.14 results, Docker build/smoke results, audit results, and non-goals. Keep the PR draft; do not merge, release, or deploy.

---

## Plan Review Gate

Before implementation begins:

- [ ] Confirm every scope item in `docs/superpowers/specs/2026-08-16-python-hash-locks-design.md` maps to a task above.
- [ ] Confirm no task upgrades an application dependency, changes an API/UI contract, pins a Docker base digest, or contacts a provider/service.
- [ ] Scan the plan for unresolved implementation markers; expected result is none.
- [ ] Confirm red/green evidence precedes each production-code change and each task has an intentional commit boundary.
