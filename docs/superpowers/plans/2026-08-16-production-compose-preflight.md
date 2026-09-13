# Production Compose Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fail-closed, testable single-host production Compose profile without selecting or contacting a deployment provider.

**Architecture:** Layer `docker-compose.production.yml` over the existing base and account files. Build the Next.js public-release decision into the web image, require production credentials through Compose interpolation, and verify the rendered model with a privacy-safe Node preflight.

**Tech Stack:** Docker Compose v2+, Dockerfiles, Node.js 24 standard library, Node test runner, GitHub Actions.

## Global Constraints

- Stay on `feature/backend-production-readiness`; do not create another branch or worktree.
- Do not merge, tag, release, deploy, modify `main`, call OpenRouter/S3, or commit real credentials.
- Preserve the single-API-writer SQLite topology; do not imply horizontal API support.
- `PUBLIC_RELEASE=false` remains the safe default outside the explicit production overlay.
- Production account cookies are secure and monitoring, crawler, AI, and safety secrets are distinct.
- Production private artifacts are S3-only; local artifact storage is forbidden.
- Tests use synthetic credentials and must not print the resolved Compose environment.

---

### Task 1: Lock the production topology contract with RED tests

**Files:**
- Modify: `scripts/tests-workspace-integrity.test.mjs`
- Test: `scripts/tests-workspace-integrity.test.mjs`

**Interfaces:**
- Consumes: repository files through `new URL(relative, root)` and `readFile`.
- Produces: static invariants for the production override, environment example, verifier, Dockerfile build arg, and root package script.

- [x] **Step 1: Write failing file and policy tests**

Read the new files at module scope. Assert the production override contains literal web build/runtime `PUBLIC_RELEASE: "true"`, API/worker `WEBDIAG_ENVIRONMENT: production`, secure cookies, required `${NAME:?message}` interpolation for every secret, S3 rather than local storage, and loopback application ports. Assert the web Dockerfile defines `ARG PUBLIC_RELEASE=false` before `RUN npm run build`. Assert `rootPackage.scripts["verify:production-compose"]` invokes only the new Node script.

- [x] **Step 2: Run the focused test to verify RED**

```powershell
node --test scripts/tests-workspace-integrity.test.mjs
```

Expected: FAIL because the production override, example, verifier, and package script do not exist.

- [x] **Step 3: Inspect the RED diff**

```powershell
git diff -- scripts/tests-workspace-integrity.test.mjs
```

Expected: only source-of-truth assertions, no implementation.

---

### Task 2: Add the fail-closed production Compose layer

**Files:**
- Create: `docker-compose.production.yml`
- Create: `.env.production.example`
- Modify: `apps/web/Dockerfile`
- Test: `scripts/tests-workspace-integrity.test.mjs`

**Interfaces:**
- Consumes: base `api`, `worker`, `web`, `rabbitmq` services and account `monitoring_scheduler`; removes unused base PostgreSQL and Valkey services.
- Produces: the exact three-file single-host production stack.

- [x] **Step 1: Add the safe web build argument**

Immediately before the builder build command use:

```dockerfile
ARG PUBLIC_RELEASE=false
ENV PUBLIC_RELEASE=${PUBLIC_RELEASE}
RUN npm run build
```

The production overlay sets only `PUBLIC_RELEASE: "true"` as a build argument.

- [x] **Step 2: Create the production override**

Define production API, worker, scheduler, and web settings. Every real secret uses required interpolation, for example:

```yaml
WEBDIAG_AI_INTERNAL_TOKEN: "${WEBDIAG_AI_INTERNAL_TOKEN:?set a distinct AI internal token}"
WEBDIAG_AI_ARTIFACT_STORAGE: s3
WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY: "${WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY:?set the private artifact S3 secret key}"
```

Use internal origin `http://api:8000`, durable `/data` SQLite paths, secure cookies, OpenRouter only on `worker`, and literal web build/runtime public release true.

- [x] **Step 3: Create the empty production environment template**

Include empty required assignments for RabbitMQ credentials, four distinct internal/safety secrets, OpenRouter, and S3. Include only these non-secret defaults: RabbitMQ user `webdiag`, S3 prefix `ai-uploads`, and optional empty S3 session token. Copying the file unchanged must fail interpolation.

- [x] **Step 4: Run the static test**

Run the Task 1 command. Expected: topology tests pass; executable preflight can remain RED until Task 3.

---

### Task 3: Render and validate the production model without leaking secrets

**Files:**
- Create: `scripts/verify-production-compose.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Test: `scripts/tests-workspace-integrity.test.mjs`

**Interfaces:**
- Consumes: `docker compose ... config --format json`, the current environment or `--env-file`; CI supplies synthetic values.
- Produces: exit code 0 plus one count-only success line, or a non-zero stable policy label.

- [x] **Step 1: Implement the renderer**

Use `spawnSync("docker", ["compose", ...files, "config", "--format", "json"], {encoding: "utf8", env: process.env, maxBuffer: 4 * 1024 * 1024})`. Accept only an optional `--env-file PATH`; CI provides distinct synthetic tokens, an `.invalid` S3 origin, and synthetic provider/S3 credentials. Parse stdout only on exit code 0. Never print stdout, stderr, or environment values.

- [x] **Step 2: Validate normalized policy**

Require expected services, production API/worker mode, S3 parity, OpenRouter only on worker, clean internal origins, literal build/runtime release true, and loopback API/web ports. Reject `development`, `change-me`, documented placeholders, local artifact storage, missing service settings, and shared internal secrets.

- [x] **Step 3: Wire package and CI commands**

Add:

```json
"verify:production-compose": "node scripts/verify-production-compose.mjs"
```

Run it in the Python 3.14 Linux job before production image builds. Keep the existing global CI `PUBLIC_RELEASE=false` default.

- [x] **Step 4: Run targeted GREEN verification**

```powershell
node --test scripts/tests-workspace-integrity.test.mjs
npm run verify:production-compose
```

Expected: both pass and no synthetic credential is printed.

---

### Task 4: Document, verify, review, and publish

**Files:**
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/RELEASE_POLICY.md`
- Modify: `docs/VERIFICATION.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the three-file invocation and preflight command.
- Produces: a runbook that distinguishes repository readiness from deployment certification.

- [x] **Step 1: Document operator steps and blockers**

Document the ignored secret-manager-populated env file, preflight, build/up commands, loopback reverse-proxy boundary, live health checks, and recovery checks. State that empty example values fail and static preflight certifies no real deployment.

- [x] **Step 2: Run one fresh final gate**

```powershell
npm run verify:local
npm run verify:production-compose
git diff --check
```

Record observed counts only. Do not claim a provider, S3, domain, TLS, payment, release, or deployment probe.

- [x] **Step 3: Commit and review**

Stage only production Compose/preflight files and documentation. Commit `feat(ops): add production compose preflight`. Request independent review; resolve Critical/Important findings before pushing the existing feature branch. Keep PR 3 Draft.
