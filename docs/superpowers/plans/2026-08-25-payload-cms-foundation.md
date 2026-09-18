# Payload CMS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Security hold — 2026-08-25:** Do not execute this plan. Payload `3.85.0`
> produced 17 production audit findings, including 11 high-severity findings.
> Stable Payload `3.88.0` removed the high findings but retained seven findings
> through `dompurify@3.4.8` and `esbuild@0.18.20`. Resume only when a stable,
> supported Payload tree passes `npm audit --omit=dev` without `--force`, audit
> suppression, vendored patches, or out-of-range overrides. The recorded pins
> remain historical planning inputs, not approved installation versions.

**Goal:** Add an isolated, production-gated Payload CMS service with PostgreSQL, secure administrative access contracts, RU/EN content schemas, S3 media configuration, and a validated server-only WebDiag content client without switching any existing public route.

**Architecture:** `apps/cms` is a separate Next.js/Payload workspace and container. Payload owns editorial schemas and exposes bounded published projections; `apps/web` consumes those projections only from server code. The existing FastAPI/API, account SQLite, three-service production core, and optional AI overlay remain unchanged until a later route-cutover plan explicitly promotes the CMS overlay.

**Tech Stack:** Node.js 22–24, npm workspaces, TypeScript 5.9.3, Next.js 16.3.0, React 19.2.8, Payload 3.85.0, PostgreSQL 18, Payload Lexical, Payload S3 storage adapter, Vitest 3.2.6, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-08-25-payload-cms-content-platform-design.md`

## Global Constraints

- Work only on `feature/backend-production-readiness`; do not create a new branch or worktree.
- Do not merge, release, deploy, modify `main`, provision production infrastructure, or use production credentials.
- Pin `payload`, every `@payloadcms/*` package, and the S3 adapter to exactly `3.85.0`; do not use ranges.
- Keep `next` at `16.3.0`, `react` and `react-dom` at `19.2.8`, TypeScript at `5.9.3`, and the root Node engine at `>=22.0.0 <25`.
- Add `graphql` at exactly `16.14.2`, which satisfies Payload's `^16.8.1` peer requirement.
- RU and EN are separate records joined by `translationGroupId`; Payload field localization and experimental localized status are not used.
- No existing public page reads Payload in this plan. Route cutover, end-to-end `503`, public sitemap migration, and repository-content deletion belong to later plans.
- The CMS has only `owner` and `admin` human roles. There is no public registration or external-author workflow.
- Operational tool identity, capability, state, executor class, security copy, and API behavior remain registry/backend-owned.
- Production CMS startup requires PostgreSQL, a bounded Payload secret, an HTTPS public CMS URL, and the complete S3 credential tuple. Production local-media fallback is forbidden.
- Tests precede implementation. Run one targeted command after each changed group and one fresh full relevant verification at the end; do not repeat unchanged checks.
- Add dependencies only after the exact package versions and peer ranges are recorded in the plan; run `npm audit --omit=dev` after the lockfile changes.
- Never print database URLs, Payload secrets, S3 credentials, request bodies, or internal CMS responses.

## Program decomposition

This plan implements only the independently testable CMS foundation. After it passes, write and execute these plans in order:

1. editorial sections: blog, knowledge, methodology, guides, and glossary;
2. fixed pages: audit, monitoring, pricing, and privacy;
3. tool editorial: exact migration of all 115 current tool records;
4. home/discovery: home, metadata, sitemap, strict ingress `503`, static-source removal, and final release gates.

---

### Task 1: Add the Payload workspace and prove framework compatibility

**Files:**
- Create: `apps/cms/package.json`
- Create: `apps/cms/tsconfig.json`
- Create: `apps/cms/next-env.d.ts`
- Create: `apps/cms/next.config.ts`
- Create: `apps/cms/vitest.config.ts`
- Create: `scripts/run-cms-fixture.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/tests-workspace-integrity.test.mjs`

**Interfaces:**
- Consumes: root version `0.5.11`, root Node engine, existing npm workspace conventions.
- Produces: npm workspace `@webdiag/cms`; scripts `test:cms`, `lint:cms`, `typecheck:cms`, and `build:cms`; TypeScript alias `@payload-config` mapped to `apps/cms/src/payload.config.ts`; fixture-only command runner that never accepts or prints production secrets.

- [ ] **Step 1: Write the failing workspace-integrity assertions**

Add `cmsPackage` loading and these assertions to `scripts/tests-workspace-integrity.test.mjs`:

```js
const cmsPackage = await readJson("apps/cms/package.json");

assert.equal(cmsPackage.name, "@webdiag/cms");
assert.equal(cmsPackage.version, rootPackage.version);
assert.equal(cmsPackage.dependencies.next, webPackage.dependencies.next);
assert.equal(cmsPackage.dependencies.react, webPackage.dependencies.react);
assert.equal(cmsPackage.dependencies["react-dom"], webPackage.dependencies["react-dom"]);
for (const name of [
  "payload",
  "@payloadcms/db-postgres",
  "@payloadcms/next",
  "@payloadcms/richtext-lexical",
  "@payloadcms/storage-s3",
  "@payloadcms/ui",
]) assert.equal(cmsPackage.dependencies[name], "3.85.0", name);
assert.equal(lock.packages["node_modules/@webdiag/cms"].resolved, "apps/cms");
assert.equal(lock.packages["node_modules/@webdiag/cms"].link, true);
```

- [ ] **Step 2: Run the integrity test and confirm RED**

Run: `node --test scripts/tests-workspace-integrity.test.mjs`

Expected: FAIL because `apps/cms/package.json` and the workspace lock entry do not exist.

- [ ] **Step 3: Create the workspace manifest and root scripts**

Use this dependency surface in `apps/cms/package.json`:

```json
{
  "name": "@webdiag/cms",
  "version": "0.5.11",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev -p 3001",
    "build": "cross-env NODE_OPTIONS=--no-deprecation next build",
    "start": "next start -p 3001",
    "lint": "eslint .",
    "test": "vitest run --pool=forks --maxWorkers=1",
    "typecheck": "tsc --noEmit",
    "payload": "cross-env NODE_OPTIONS=--no-deprecation PAYLOAD_CONFIG_PATH=src/payload.config.ts payload",
    "generate:importmap": "npm run payload -- generate:importmap",
    "generate:types": "npm run payload -- generate:types",
    "migrate": "npm run payload -- migrate",
    "migrate:create": "npm run payload -- migrate:create"
  },
  "dependencies": {
    "@payloadcms/db-postgres": "3.85.0",
    "@payloadcms/next": "3.85.0",
    "@payloadcms/richtext-lexical": "3.85.0",
    "@payloadcms/storage-s3": "3.85.0",
    "@payloadcms/ui": "3.85.0",
    "@webdiag/tool-registry": "0.5.11",
    "graphql": "16.14.2",
    "next": "16.3.0",
    "payload": "3.85.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@types/node": "24.10.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "cross-env": "10.1.0",
    "eslint": "9.35.0",
    "eslint-config-next": "16.3.0",
    "typescript": "5.9.3",
    "vitest": "3.2.6"
  }
}
```

Add `apps/cms` to root `workspaces`. Add root scripts:

```json
"test:cms": "npm --workspace @webdiag/cms run test",
"lint:cms": "npm --workspace @webdiag/cms run lint",
"typecheck:cms": "npm --workspace @webdiag/cms run typecheck",
"build:cms": "node scripts/run-cms-fixture.mjs build",
"cms:generate:importmap": "node scripts/run-cms-fixture.mjs generate:importmap",
"cms:generate:types": "node scripts/run-cms-fixture.mjs generate:types"
```

Configure `apps/cms/tsconfig.json` to extend `../../tsconfig.base.json`, set `jsx: "preserve"`, `noEmit: true`, and map `@payload-config` to `./src/payload.config.ts`. Configure Next through `withPayload` and set `output: "standalone"`, `reactStrictMode: true`, and `poweredByHeader: false`.

Implement `scripts/run-cms-fixture.mjs` with `spawnSync` and an argument allowlist of `build`, `generate:importmap`, `generate:types`, `migrate`, `migrate:create`, and `migrate:status`. It supplies only these explicit test values to the child process:

```js
const fixtureEnvironment = {
  WEBDIAG_ENVIRONMENT: "test",
  WEBDIAG_CMS_DATABASE_URL:
    "postgresql://webdiag_cms_fixture:webdiag_cms_fixture@127.0.0.1:55432/webdiag_cms_fixture",
  WEBDIAG_CMS_SECRET: "fixture-only-payload-secret-0000000000000000",
  WEBDIAG_CMS_PUBLIC_URL: "http://127.0.0.1:3001",
};
```

The runner invokes npm without a shell, inherits stdio, returns the child exit code, rejects unknown commands, and never logs its environment. Production containers call the workspace scripts directly and cannot enter fixture mode.

- [ ] **Step 4: Install, inspect peer resolution, and audit production dependencies**

Run:

```powershell
npm install
npm ls payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-s3 graphql next react react-dom
npm audit --omit=dev
```

Expected: one lockfile, all Payload packages resolve to `3.85.0`, Next resolves to `16.3.0`, React resolves to `19.2.8`, GraphQL resolves to `16.14.2`, and the audit reports no unresolved production vulnerability. If the audit reports a vulnerability, stop this task and document the exact advisory before changing versions.

- [ ] **Step 5: Run the workspace integrity test and confirm GREEN**

Run: `node --test scripts/tests-workspace-integrity.test.mjs`

Expected: PASS, including CMS workspace and lock-link assertions.

- [ ] **Step 6: Commit the compatibility foundation**

```powershell
git add -- package.json package-lock.json apps/cms/package.json apps/cms/tsconfig.json apps/cms/next-env.d.ts apps/cms/next.config.ts apps/cms/vitest.config.ts scripts/run-cms-fixture.mjs scripts/tests-workspace-integrity.test.mjs
git commit -m "build(cms): add pinned Payload workspace"
```

---

### Task 2: Add fail-closed CMS environment parsing

**Files:**
- Create: `apps/cms/src/config/environment.ts`
- Create: `apps/cms/src/config/environment.test.ts`

**Interfaces:**
- Consumes: `NodeJS.ProcessEnv`.
- Produces: `loadCmsEnvironment(env?: NodeJS.ProcessEnv): CmsEnvironmentConfig`; `CmsConfigurationError`; `CmsEnvironmentConfig` with `environment`, `databaseUrl`, `payloadSecret`, `publicUrl`, and optional complete `s3` tuple.

- [ ] **Step 1: Write failing environment tests**

Cover these exact cases in `environment.test.ts`:

```ts
expect(() => loadCmsEnvironment({} as NodeJS.ProcessEnv)).toThrow("WEBDIAG_CMS_DATABASE_URL");
expect(() => loadCmsEnvironment({
  WEBDIAG_ENVIRONMENT: "production",
  WEBDIAG_CMS_DATABASE_URL: "postgresql://cms:secret@cms-postgres:5432/webdiag_cms",
  WEBDIAG_CMS_SECRET: "S123456789012345678901234567890123456789",
  WEBDIAG_CMS_PUBLIC_URL: "https://cms.webdiag.ru",
} as NodeJS.ProcessEnv)).toThrow("WEBDIAG_CMS_MEDIA_S3_BUCKET");
```

Also assert that development accepts `http://127.0.0.1:3001`, production rejects non-HTTPS public URLs, database URLs require `postgres:` or `postgresql:`, secrets require 32–256 printable non-space characters, partial S3 tuples fail, and thrown messages contain variable names but never secret values.

- [ ] **Step 2: Run the environment test and confirm RED**

Run: `npm --workspace @webdiag/cms run test -- src/config/environment.test.ts`

Expected: FAIL because the parser is absent.

- [ ] **Step 3: Implement the bounded parser**

Use these public types:

```ts
export type CmsRuntimeEnvironment = "development" | "test" | "production";

export interface CmsS3Config {
  readonly endpointUrl: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

export interface CmsEnvironmentConfig {
  readonly environment: CmsRuntimeEnvironment;
  readonly databaseUrl: string;
  readonly payloadSecret: string;
  readonly publicUrl: string;
  readonly s3: CmsS3Config | null;
}

export class CmsConfigurationError extends Error {}
export function loadCmsEnvironment(env: NodeJS.ProcessEnv = process.env): CmsEnvironmentConfig;
```

Parse URLs through `new URL`, return normalized origins without credentials, require the entire S3 tuple when any S3 variable is present, and require S3 in production. Do not include raw values in errors.

- [ ] **Step 4: Run the environment test and confirm GREEN**

Run: `npm --workspace @webdiag/cms run test -- src/config/environment.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit fail-closed configuration**

```powershell
git add -- apps/cms/src/config/environment.ts apps/cms/src/config/environment.test.ts
git commit -m "feat(cms): validate production configuration"
```

---

### Task 3: Define roles, content identities, and registry-bound validation

**Files:**
- Create: `apps/cms/src/access/roles.ts`
- Create: `apps/cms/src/access/roles.test.ts`
- Create: `apps/cms/src/content/identity.ts`
- Create: `apps/cms/src/content/identity.test.ts`
- Create: `apps/cms/src/content/tool-registry.ts`
- Create: `apps/cms/src/content/tool-registry.test.ts`

**Interfaces:**
- Consumes: Payload request user shape and `publicTools` from `@webdiag/tool-registry`.
- Produces: `CmsRole`, `hasCmsRole`, `ownerOnly`, `administratorOnly`, `CmsLocale`, `parseCmsLocale`, `validateTranslationIdentity`, `isReadyToolSlug`, `assertReadyToolSlug`, and bounded `CmsContentValidationError`.

- [ ] **Step 1: Write failing role and identity tests**

Use exact role behavior:

```ts
expect(hasCmsRole(null, "admin")).toBe(false);
expect(hasCmsRole({ roles: ["admin"] }, "admin")).toBe(true);
expect(ownerOnly({ req: { user: { roles: ["admin"] } } } as never)).toBe(false);
expect(ownerOnly({ req: { user: { roles: ["owner"] } } } as never)).toBe(true);
expect(administratorOnly({ req: { user: { roles: ["admin"] } } } as never)).toBe(true);
expect(parseCmsLocale("ru")).toBe("ru");
expect(parseCmsLocale("de")).toBeNull();
expect(() => validateTranslationIdentity({ locale: "ru", translationGroupId: "../x" })).toThrow();
```

In `tool-registry.test.ts`, iterate every `publicTools` slug and assert acceptance; assert rejection for an internal, empty, traversal, and unknown slug.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npm --workspace @webdiag/cms run test -- src/access/roles.test.ts src/content/identity.test.ts src/content/tool-registry.test.ts`

Expected: FAIL because the modules are absent.

- [ ] **Step 3: Implement pure bounded helpers**

Use these constraints:

```ts
export type CmsRole = "owner" | "admin";
export type CmsLocale = "ru" | "en";

export type CmsContentValidationErrorCode =
  | "cms_invalid_identity"
  | "cms_unknown_tool_slug";

export class CmsContentValidationError extends Error {
  constructor(readonly code: CmsContentValidationErrorCode) {
    super(code);
  }
}

const TRANSLATION_GROUP = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const CONTENT_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
```

`administratorOnly` accepts `owner` or `admin`; `ownerOnly` accepts only `owner`. `assertReadyToolSlug` uses a set derived solely from `publicTools` and throws a bounded `CmsContentValidationError("cms_unknown_tool_slug")` without echoing the rejected value.

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run: `npm --workspace @webdiag/cms run test -- src/access/roles.test.ts src/content/identity.test.ts src/content/tool-registry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit authorization primitives**

```powershell
git add -- apps/cms/src/access apps/cms/src/content/identity.ts apps/cms/src/content/identity.test.ts apps/cms/src/content/tool-registry.ts apps/cms/src/content/tool-registry.test.ts
git commit -m "feat(cms): add bounded editorial identities"
```

---

### Task 4: Define Payload collections and the published projection boundary

**Files:**
- Create: `apps/cms/src/collections/Users.ts`
- Create: `apps/cms/src/collections/PublicPages.ts`
- Create: `apps/cms/src/collections/Articles.ts`
- Create: `apps/cms/src/collections/ToolEditorial.ts`
- Create: `apps/cms/src/collections/Media.ts`
- Create: `apps/cms/src/collections/shared-fields.ts`
- Create: `apps/cms/src/endpoints/published-projection.ts`
- Create: `apps/cms/src/endpoints/published-projection.test.ts`
- Create: `apps/cms/src/payload.config.ts`
- Create: `apps/cms/src/payload-types.ts`

**Interfaces:**
- Consumes: environment parser, role helpers, identity validators, registry validator.
- Produces: Payload collections `users`, `public-pages`, `articles`, `tool-editorial`, `media`; collection endpoints `GET /api/public-pages/published/:routeKey/:locale`, `GET /api/articles/published/:section/:slug/:locale`, and `GET /api/tool-editorial/published/:toolSlug/:locale`; generated Payload types.

- [ ] **Step 1: Write failing published-projection tests**

Test the pure projection resolver behind the endpoints with an injected finder:

```ts
const result = await resolvePublishedPair({
  identity: { kind: "public-page", routeKey: "audit", locale: "ru" },
  find: async () => [publishedRu, publishedEn],
});
expect(result).toEqual({ kind: "found", document: publishedRu });
```

Cover zero documents as `{ kind: "missing" }`, one locale only as missing, duplicate locale as `CmsProjectionError("cms_projection_invalid")`, draft partner as missing, wrong translation group as invalid, unknown route/section/tool slug as missing, and a finder exception as `CmsProjectionError("cms_projection_unavailable")`. Ensure error messages never include document data.

- [ ] **Step 2: Run the projection test and confirm RED**

Run: `npm --workspace @webdiag/cms run test -- src/endpoints/published-projection.test.ts`

Expected: FAIL because the resolver and collections are absent.

- [ ] **Step 3: Implement collections with admin-only base access**

Apply these rules to every editorial collection:

```ts
access: {
  create: administratorOnly,
  read: administratorOnly,
  update: administratorOnly,
  delete: ownerOnly,
},
versions: { drafts: true },
```

`users` uses `auth: true`, role options `owner` and `admin`, owner-only user management, and no public create endpoint after the protected first-user bootstrap. `media` accepts only authorized users for mutation and has no anonymous base read.

Define separate `locale`, `translationGroupId`, and identity fields. Use fixed options:

- public page route keys: `home`, `audit`, `monitoring`, `pricing`, `privacy`;
- article sections: `blog`, `knowledge`, `methodology`, `guide`, `glossary`;
- locales: `ru`, `en`.

Use a hook-maintained, read-only `identityKey` with a unique database constraint:

```text
public-pages:<routeKey>:<locale>
articles:<section>:<slug>:<locale>
tool-editorial:<toolSlug>:<locale>
```

All three editorial collections share these exact fields: `locale`, `translationGroupId`, `identityKey`, `seoTitle`, `metaDescription`, `h1`, `lead`, `sourceUrls`, `reviewer`, `lastReviewedAt`, and `reviewDueAt`. `sourceUrls` is an array of HTTPS URLs. Review dates use Payload date fields.

Collection-specific fields are:

- `public-pages`: `routeKey` and a `sections` blocks field initially allowing `prose`, `cardGrid`, and `notice` blocks;
- `articles`: `section`, `slug`, `excerpt`, and Lexical `body`;
- `tool-editorial`: `toolSlug`, `quickFacts`, `howToSteps`, `supportedFeatures`, `limitations`, `useCases`, `technicalNotes`, `faq` (`question`, `answer`), and `relatedToolSlugs`;
- `users`: `name` and `roles` with only `owner` and `admin`;
- `media`: Payload upload metadata only; localized alternative text is required later at each content usage site rather than stored globally on the asset.

The initial public-page block fields are bounded text structures: `prose` has `eyebrow`, `heading`, and Lexical `body`; `cardGrid` has `ariaLabel` and one-to-six items with `heading`, `body`, optional internal `href`, and optional `actionLabel`; `notice` has `heading`, `body`, optional internal `href`, optional `actionLabel`, and tone `neutral` or `important`. These blocks do not accept arbitrary component names, JSON, HTML, scripts, or external embed URLs. Home-specific blocks are added only in the later home/discovery plan with a new migration.

Do not add raw HTML, iframe, script, arbitrary JSON-LD, arbitrary canonical URL, or executable embed fields. Use Payload Lexical for article bodies and typed arrays/groups for fixed pages and tool editorial.

- [ ] **Step 4: Implement the paired published projection**

Export:

```ts
export type PublishedProjectionResult<T> =
  | { readonly kind: "found"; readonly document: T }
  | { readonly kind: "missing" };

export interface PublishedLocaleDocument {
  readonly id: string | number;
  readonly locale: CmsLocale;
  readonly translationGroupId: string;
  readonly _status: "draft" | "published";
}

export type PublishedIdentity =
  | { readonly kind: "public-page"; readonly routeKey: string; readonly locale: CmsLocale }
  | { readonly kind: "article"; readonly section: string; readonly slug: string; readonly locale: CmsLocale }
  | { readonly kind: "tool-editorial"; readonly toolSlug: string; readonly locale: CmsLocale };

export interface PublishedPairInput<T extends PublishedLocaleDocument> {
  readonly identity: PublishedIdentity;
  readonly find: () => Promise<readonly T[]>;
}

export type CmsProjectionErrorCode =
  | "cms_projection_invalid"
  | "cms_projection_unavailable";

export class CmsProjectionError extends Error {
  constructor(readonly code: CmsProjectionErrorCode) {
    super(code);
  }
}

export async function resolvePublishedPair<T extends PublishedLocaleDocument>(
  input: PublishedPairInput<T>,
): Promise<PublishedProjectionResult<T>>;
```

The endpoint parses bounded route params, queries both locales with explicit `_status = published`, uses `overrideAccess: true` only inside this fixed projection implementation without a user, verifies one RU and one EN record share the same translation group, strips administrative/version fields, and returns only the requested locale. It uses these exact envelopes with `cache-control: no-store` and `x-content-type-options: nosniff`:

```json
{"contractVersion":"webdiag.cms.published.v1","document":{}}
```

```json
{"contractVersion":"webdiag.cms.error.v1","code":"cms_content_not_found"}
```

```json
{"contractVersion":"webdiag.cms.error.v1","code":"cms_content_unavailable"}
```

The success envelope returns `200`; missing/incomplete pairs return `404`; database/query failure returns `503` with `Retry-After: 30`. No envelope includes raw exception, query, identity, internal URL, or unpublished partner data.

- [ ] **Step 5: Configure Payload and generate types**

In `payload.config.ts`, use `postgresAdapter`, `lexicalEditor`, the five collections, Admin user `users`, generated types at `src/payload-types.ts`, and the environment parser. Set the database `migrationDir` to `src/migrations`, and constrain both `cors` and `csrf` to the normalized CMS public origin. Add S3 only through the configuration produced in Task 7.

Run:

```powershell
npm run cms:generate:types
```

Expected: generated types contain all five collection slugs and no environment values.

- [ ] **Step 6: Run the collection tests and typecheck**

Run:

```powershell
npm --workspace @webdiag/cms run test -- src/endpoints/published-projection.test.ts
npm --workspace @webdiag/cms run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit CMS content contracts**

```powershell
git add -- apps/cms/src/collections apps/cms/src/endpoints apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): define secure content collections"
```

---

### Task 5: Wire the official Payload Admin and REST application routes

**Files:**
- Create: `apps/cms/src/app/(payload)/layout.tsx`
- Create: `apps/cms/src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `apps/cms/src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- Create: `apps/cms/src/app/(payload)/admin/importMap.js`
- Create: `apps/cms/src/app/(payload)/api/[...slug]/route.ts`
- Create: `apps/cms/src/app/(payload)/custom.css`
- Create: `apps/cms/src/health/response.ts`
- Create: `apps/cms/src/app/health/route.ts`
- Create: `apps/cms/src/health/response.test.ts`

**Interfaces:**
- Consumes: `@payload-config`, Payload generated import map, Payload REST route handlers.
- Produces: Admin UI at `/admin`, Payload REST under `/api`, and bounded health response `{ status: "ok" }` only after Payload and PostgreSQL initialize.

- [ ] **Step 1: Write the failing health-route test**

Inject the database probe and assert:

```ts
expect((await healthResponse(async () => undefined)).status).toBe(200);
expect(await (await healthResponse(async () => undefined)).json()).toEqual({ status: "ok" });
const failed = await healthResponse(async () => { throw new Error("database details"); });
expect(failed.status).toBe(503);
expect(await failed.json()).toEqual({ status: "unavailable" });
expect(await failed.text()).not.toContain("database details");
```

- [ ] **Step 2: Run the health test and confirm RED**

Run: `npm --workspace @webdiag/cms run test -- src/health/response.test.ts`

Expected: FAIL because the route helper is absent.

- [ ] **Step 3: Add official Payload route wrappers**

Use the official `RootLayout`, `handleServerFunctions`, `RootPage`, `generatePageMetadata`, and REST handler wrappers. The REST route exports only `GET`, `POST`, `DELETE`, `PATCH`, and `OPTIONS`. Do not add GraphQL or GraphQL Playground routes.

The health route initializes Payload through the configured singleton, executes a bounded database availability probe, and delegates response formatting to the pure `healthResponse(probe)` helper. It returns only `ok` or `unavailable` with `cache-control: no-store` and `x-content-type-options: nosniff`.

Generate the import map only after the Admin route tree exists:

```powershell
npm run cms:generate:importmap
```

Expected: `apps/cms/src/app/(payload)/admin/importMap.js` contains generated component mappings and no environment values.

- [ ] **Step 4: Run health, typecheck, and production build compatibility gates**

Run:

```powershell
npm --workspace @webdiag/cms run test -- src/health/response.test.ts
npm --workspace @webdiag/cms run typecheck
npm run build:cms
```

Expected: all PASS. The build must produce a standalone server. Treat a Payload Admin build/runtime incompatibility as a blocker; do not bypass or suppress it.

- [ ] **Step 5: Commit the Payload application surface**

```powershell
git add -- apps/cms/src/app apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): expose protected Payload application"
```

---

### Task 6: Generate and verify the initial PostgreSQL migration

**Files:**
- Create: `apps/cms/src/migrations/20260825_000000_cms_foundation.ts`
- Create: `apps/cms/src/migrations/20260825_000000_cms_foundation.json`
- Create: `apps/cms/src/migrations/index.ts`
- Create: `apps/cms/src/migrations/migrations.test.ts`
- Create: `docker-compose.cms.test.yml`

**Interfaces:**
- Consumes: Payload collection config and a disposable PostgreSQL 18 service.
- Produces: committed reversible migration, `migrations` export, and repeatable integration command `npm --workspace @webdiag/cms run migrate`.

- [ ] **Step 1: Write the failing migration inventory test**

Assert that `migrations` exports exactly one migration with callable `up` and `down`, that the migration source contains tables for all five collections and Payload versions, and that package scripts expose `migrate`, `migrate:create`, and `migrate:status`.

- [ ] **Step 2: Run the inventory test and confirm RED**

Run: `npm --workspace @webdiag/cms run test -- src/migrations/migrations.test.ts`

Expected: FAIL because no migration exists.

- [ ] **Step 3: Start disposable PostgreSQL and generate the named migration**

Create `docker-compose.cms.test.yml` with this isolated service. It must not reference or modify the repository's normal `postgres_data` volume:

```yaml
services:
  cms_postgres_test:
    image: postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382
    environment:
      POSTGRES_DB: webdiag_cms_fixture
      POSTGRES_USER: webdiag_cms_fixture
      POSTGRES_PASSWORD: webdiag_cms_fixture
    ports:
      - "127.0.0.1:55432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U webdiag_cms_fixture -d webdiag_cms_fixture"]
      interval: 2s
      timeout: 3s
      retries: 20
    tmpfs:
      - /var/lib/postgresql/data
```

Run:

```powershell
docker compose -f docker-compose.cms.test.yml up -d --wait cms_postgres_test
node scripts/run-cms-fixture.mjs migrate:create cms_foundation
```

Rename the generated timestamped TypeScript and snapshot files to `20260825_000000_cms_foundation.ts` and `20260825_000000_cms_foundation.json`, then update `src/migrations/index.ts` to import that exact basename. Do not hand-edit generated SQL unless the generated migration is non-reversible or contains a schema outside the five declared collections and Payload metadata tables.

- [ ] **Step 4: Apply the migration twice and verify idempotent status**

Run:

```powershell
node scripts/run-cms-fixture.mjs migrate
node scripts/run-cms-fixture.mjs migrate
node scripts/run-cms-fixture.mjs migrate:status
```

Expected: first run applies one migration; second run applies none; status reports the migration complete.

- [ ] **Step 5: Run the migration inventory test and confirm GREEN**

Run: `npm --workspace @webdiag/cms run test -- src/migrations/migrations.test.ts`

Expected: PASS.

- [ ] **Step 6: Stop only the disposable test topology and commit**

Run: `docker compose -f docker-compose.cms.test.yml down --volumes`

Then:

```powershell
git add -- apps/cms/src/migrations docker-compose.cms.test.yml
git commit -m "feat(cms): add PostgreSQL foundation migration"
```

---

### Task 7: Add fail-closed S3 media storage

**Files:**
- Create: `apps/cms/src/storage/media-storage.ts`
- Create: `apps/cms/src/storage/media-storage.test.ts`
- Modify: `apps/cms/src/payload.config.ts`
- Modify: `apps/cms/src/collections/Media.ts`

**Interfaces:**
- Consumes: `CmsEnvironmentConfig.s3`.
- Produces: `createMediaStorage(config): Plugin | null`; local media only outside production; production S3 collection prefix `public-content`; maximum upload bytes `10_485_760`.

- [ ] **Step 1: Write failing media-storage tests**

Assert that development without S3 returns no storage plugin, production cannot reach this function with a null S3 tuple, S3 configuration targets only the `media` collection, uses prefix `public-content`, disables local storage, and never serializes credentials into returned public URLs or error text.

Assert the `Media` collection allows only MIME types `image/png`, `image/jpeg`, `image/webp`, and `image/avif`. Assert the Payload-wide upload configuration sets `limits.fileSize` to `10_485_760`, `abortOnLimit: true`, `safeFileNames: true`, and a bounded upload timeout. SVG and every non-raster type are rejected until a separate sanitization and delivery design is approved.

- [ ] **Step 2: Run the storage test and confirm RED**

Run: `npm --workspace @webdiag/cms run test -- src/storage/media-storage.test.ts`

Expected: FAIL because the storage factory is absent.

- [ ] **Step 3: Implement the official S3 adapter boundary**

Create the plugin through `s3Storage` with `enabled: config.environment === "production"`, `collections: { media: { prefix: "public-content" } }`, the configured bucket, endpoint, region, and credentials. Keep `clientUploads` disabled and do not set `disablePayloadAccessControl: true`; public media delivery is added with the first route-cutover plan so draft assets cannot become public merely by upload.

The `Media` collection must set `disableLocalStorage: true` in production through the adapter and may use local filesystem storage only in development/test.

- [ ] **Step 4: Run storage tests and typecheck**

Run:

```powershell
npm --workspace @webdiag/cms run test -- src/storage/media-storage.test.ts
npm --workspace @webdiag/cms run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit media storage**

```powershell
git add -- apps/cms/src/storage apps/cms/src/payload.config.ts apps/cms/src/collections/Media.ts
git commit -m "feat(cms): require durable production media storage"
```

---

### Task 8: Add the server-only WebDiag CMS client contract

**Files:**
- Create: `apps/web/src/lib/cms/types.ts`
- Create: `apps/web/src/lib/cms/errors.ts`
- Create: `apps/web/src/lib/cms/environment.ts`
- Create: `apps/web/src/lib/cms/environment.test.ts`
- Create: `apps/web/src/lib/cms/client.ts`
- Create: `apps/web/src/lib/cms/client.test.ts`

**Interfaces:**
- Consumes: fixed `WEBDIAG_CMS_INTERNAL_URL`, bounded identity segments, CMS published projection envelope.
- Produces: `fetchCmsProjection<T>(request, parser, fetcher?): Promise<CmsLookup<T>>`; `CmsLookup<T> = { kind: "found"; value: T } | { kind: "missing" }`; `CmsUnavailableError` with allowlisted codes.

- [ ] **Step 1: Write failing web CMS environment and client tests**

Cover:

```ts
expect(loadCmsClientEnvironment({ WEBDIAG_CMS_INTERNAL_URL: "http://cms:3001" })).toEqual({
  origin: "http://cms:3001",
  timeoutMs: 3000,
  maxResponseBytes: 1_000_000,
});
```

Assert rejection of credentials, query, fragment, non-HTTP schemes, paths other than `/`, and missing production origin. For the client assert:

- `cache: "no-store"`, `accept: "application/json"`, and an abort signal;
- `200` plus one valid document returns `found`;
- CMS `404` returns `missing`;
- success and error envelopes require their exact `contractVersion` and allowlisted fields;
- timeout, network failure, non-404 non-2xx, wrong content type, invalid JSON, invalid envelope, duplicate documents, invalid parser result, declared content length over 1,000,000, and actual body over 1,000,000 throw bounded `CmsUnavailableError`;
- thrown errors never contain the internal origin, response body, identity value, or upstream exception text.

- [ ] **Step 2: Run the client tests and confirm RED**

Run: `npm --workspace @webdiag/web run test -- src/lib/cms/environment.test.ts src/lib/cms/client.test.ts`

Expected: FAIL because the CMS client modules are absent.

- [ ] **Step 3: Implement the server-only client**

Use these types:

```ts
export type CmsCollection = "public-pages" | "articles" | "tool-editorial";
export type CmsClientErrorCode =
  | "cms_unavailable"
  | "cms_timeout"
  | "cms_invalid_response";

export class CmsUnavailableError extends Error {
  constructor(readonly code: CmsClientErrorCode) {
    super(code);
  }
}

export interface CmsProjectionRequest {
  readonly collection: CmsCollection;
  readonly segments: readonly string[];
  readonly locale: "ru" | "en";
}

export type CmsProjectionParser<T> = (value: unknown) => T | null;
export type CmsFetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

export type CmsLookup<T> =
  | { readonly kind: "found"; readonly value: T }
  | { readonly kind: "missing" };

export async function fetchCmsProjection<T>(
  request: CmsProjectionRequest,
  parser: CmsProjectionParser<T>,
  fetcher: CmsFetcher = fetch,
): Promise<CmsLookup<T>>;
```

Construct paths from an allowlisted collection and individually validated segments. Never accept a full path or URL from callers. Read the response as bounded text before `JSON.parse`; do not call unbounded `response.json()`. Add `import "server-only"` to the client entry point.

- [ ] **Step 4: Run the client tests and confirm GREEN**

Run: `npm --workspace @webdiag/web run test -- src/lib/cms/environment.test.ts src/lib/cms/client.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the web boundary**

```powershell
git add -- apps/web/src/lib/cms
git commit -m "feat(web): add bounded server-only CMS client"
```

---

### Task 9: Add CMS containers and an opt-in production preflight

**Files:**
- Create: `apps/cms/Dockerfile`
- Create: `docker-compose.cms.override.yml`
- Create: `docker-compose.production.cms.yml`
- Create: `.env.production.cms.example`
- Create: `scripts/verify-production-cms-compose.mjs`
- Create: `scripts/tests-production-cms-compose.test.mjs`
- Modify: `package.json`
- Modify: `scripts/tests-workspace-integrity.test.mjs`
- Modify: `.github/dependabot.yml`
- Modify: `.dockerignore`

**Interfaces:**
- Consumes: existing base, account, and production Compose files.
- Produces: opt-in services `cms_postgres` and `cms`; `web.WEBDIAG_CMS_INTERNAL_URL=http://cms:3001`; root script `verify:production-cms-compose`.

- [ ] **Step 1: Write failing Compose-policy tests**

Assert the CMS preflight renders exactly `api`, `monitoring_scheduler`, `web`, `cms_postgres`, and `cms`; all application services use `restart: unless-stopped`; no service exposes a non-loopback host port; CMS database storage is a single named volume; production CMS has no writable local media volume; the URL-safe PostgreSQL password appears only in `cms_postgres` and the CMS database URL; Payload and S3 secrets appear only in `cms`; only `web` receives `WEBDIAG_CMS_INTERNAL_URL`; core services receive no AI secrets; required secrets are printable 32–256 characters where applicable; public CMS and S3 endpoint URLs are HTTPS; and production placeholders are rejected.

Update workspace-integrity expectations so all production Docker stages are pinned by tag and SHA-256, `/apps/cms` is in Dependabot's Docker directories, and Docker context still excludes all `.env` files.

- [ ] **Step 2: Run Compose-policy tests and confirm RED**

Run: `node --test scripts/tests-production-cms-compose.test.mjs scripts/tests-workspace-integrity.test.mjs`

Expected: FAIL because CMS manifests and verifier are absent.

- [ ] **Step 3: Add the pinned CMS image and Compose overlays**

Use the same pinned `node:24-bookworm-slim` digest as `apps/web/Dockerfile`. The builder runs CMS type generation, import-map generation, and build. The runtime copies only the CMS standalone output, static assets, and required public/media directories; it does not copy `.env` files or the repository source tree.

Development Compose uses a dedicated `cms_postgres` service and a development-only media volume. Production Compose requires the complete CMS secret and S3 tuple and has no local media volume. Do not add the CMS overlay to the existing core preflight; this plan keeps it opt-in until route cutover.

Use these exact production variable names in `.env.production.cms.example`, with empty values and no example credentials or URLs:

```dotenv
WEBDIAG_CMS_POSTGRES_PASSWORD=
WEBDIAG_CMS_SECRET=
WEBDIAG_CMS_PUBLIC_URL=
WEBDIAG_CMS_MEDIA_S3_ENDPOINT_URL=
WEBDIAG_CMS_MEDIA_S3_REGION=
WEBDIAG_CMS_MEDIA_S3_BUCKET=
WEBDIAG_CMS_MEDIA_S3_ACCESS_KEY_ID=
WEBDIAG_CMS_MEDIA_S3_SECRET_ACCESS_KEY=
```

Constrain `WEBDIAG_CMS_POSTGRES_PASSWORD` to 32–128 URL-unreserved characters before composing `postgresql://webdiag_cms:<password>@cms_postgres:5432/webdiag_cms`. The verifier must reject characters outside `[A-Za-z0-9._~-]` so the rendered database URL cannot be altered by delimiter injection.

- [ ] **Step 4: Implement the fail-closed CMS Compose verifier**

Follow the bounded JSON-render pattern in `scripts/verify-production-compose.mjs`: accept only optional `--env-file PATH`, call Docker Compose with base + account + production + production CMS files, parse at most 4 MiB, validate exact services/environments/volumes, and print only `production CMS Compose preflight passed: services=5`. Never print rendered Compose, stdout, stderr, or environment values.

- [ ] **Step 5: Run the Compose tests and preflight**

Use non-secret fixture values in the process environment and run:

```powershell
node --test scripts/tests-production-cms-compose.test.mjs scripts/tests-workspace-integrity.test.mjs
npm run verify:production-cms-compose
```

Expected: PASS and `services=5`.

- [ ] **Step 6: Build and smoke the CMS image with disposable PostgreSQL**

Run the CMS Docker build, start `cms_postgres` and `cms` only through the test Compose topology, wait for `/health`, request `/admin`, request a published projection that must return `404`, and verify no GraphQL Playground route is exposed. Treat an Admin runtime failure as a blocker.

- [ ] **Step 7: Commit deployment topology**

```powershell
git add -- apps/cms/Dockerfile docker-compose.cms.override.yml docker-compose.production.cms.yml .env.production.cms.example scripts/verify-production-cms-compose.mjs scripts/tests-production-cms-compose.test.mjs package.json scripts/tests-workspace-integrity.test.mjs .github/dependabot.yml .dockerignore
git commit -m "feat(cms): add fail-closed deployment overlay"
```

---

### Task 10: Integrate CI, documentation, and fresh verification

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/RELEASE_POLICY.md`
- Modify: `docs/VERIFICATION.md`
- Modify: Draft PR #3 body after push

**Interfaces:**
- Consumes: all foundation scripts and images.
- Produces: one local verification command covering CMS; CI CMS migration/build/smoke evidence; documented opt-in topology and remaining external gates.

- [ ] **Step 1: Write failing release/workspace assertions**

Extend existing Node tests to require:

```js
assert.match(rootPackage.scripts.test, /test:cms/);
assert.match(rootPackage.scripts.lint, /lint:cms/);
assert.match(rootPackage.scripts.typecheck, /typecheck:cms/);
assert.match(rootPackage.scripts["verify:local"], /build:cms/);
assert.equal(rootPackage.scripts["verify:production-cms-compose"], "node scripts/verify-production-cms-compose.mjs");
```

Assert CI contains a PostgreSQL service or disposable Compose step, applies the committed CMS migration, builds the CMS image, smokes `/health` and `/admin`, and runs the production CMS preflight with fixture-only secrets.

- [ ] **Step 2: Run the changed Node tests and confirm RED**

Run: `node --test scripts/tests-workspace-integrity.test.mjs scripts/tests-release-gate.test.mjs scripts/tests-production-cms-compose.test.mjs`

Expected: FAIL because root verification and CI do not include CMS.

- [ ] **Step 3: Integrate CMS into root verification and CI**

Update `verify:local` so CMS tests, lint, typecheck, and build run exactly once. Keep the existing web, browser, Python, registry, lock, and Compose gates. Add a Linux CI CMS job that starts disposable PostgreSQL, applies migrations, builds and smokes the CMS image, and always removes only its named containers/volume.

- [ ] **Step 4: Document truthful boundaries**

Document:

- CMS is an opt-in foundation and no public route reads it yet;
- Admin is intended for `cms.webdiag.ru` behind Cloudflare Access/VPN but no Cloudflare change has been made;
- production requires dedicated PostgreSQL, secret-manager values, S3, backup/restore evidence, and later strict `503` ingress verification;
- FastAPI remains the operational backend and current core/AI topologies are unchanged;
- exact local development, migration, preflight, build, and smoke commands using placeholder-free variable names but no credential values.

- [ ] **Step 5: Run targeted CMS verification once**

Run:

```powershell
npm run test:cms
npm run lint:cms
npm run typecheck:cms
npm run build:cms
npm run verify:production-cms-compose
git diff --check
```

Expected: all PASS. This is the single targeted post-group run; do not repeat it without a named failure or subsequent code change.

- [ ] **Step 6: Run one fresh full relevant verification**

Run: `npm run verify:local`

Expected: registry, workspace, core, web, CMS, browser, Python, lint, typecheck, builds, built-site checks, and lock verification all pass. Record exact fresh counts; do not reuse historical totals.

- [ ] **Step 7: Commit documentation and gates**

```powershell
git add -- package.json .github/workflows/ci.yml docs/ARCHITECTURE.md docs/INSTALLATION.md docs/RELEASE_POLICY.md docs/VERIFICATION.md scripts/tests-workspace-integrity.test.mjs scripts/tests-release-gate.test.mjs scripts/tests-production-cms-compose.test.mjs
git commit -m "test(cms): enforce foundation release gates"
```

- [ ] **Step 8: Review, push, and update Draft PR #3**

Run:

```powershell
git status --short --branch
git log --oneline --decorate -12
git diff recovery/a11.5-github-baseline...HEAD --check
git push origin feature/backend-production-readiness
gh pr checks 3 --watch --interval 15
gh pr view 3 --json isDraft,headRefName,baseRefName,url,statusCheckRollup
```

Update the Draft PR body with the exact CMS scope, dependency versions, test counts, migration/image/preflight evidence, and remaining external gates. Verify the PR remains Draft, head remains `feature/backend-production-readiness`, base remains `recovery/a11.5-github-baseline`, and no release/deploy occurred.

## Foundation completion gate

Do not start the editorial-section migration plan until all of these are true:

- Payload Admin and REST run on exact pinned dependencies with PostgreSQL;
- anonymous base collection access is denied and published projection endpoints expose only complete RU/EN pairs;
- unknown or non-ready tool slugs cannot enter a published projection;
- production configuration fails closed without PostgreSQL, secret, HTTPS CMS URL, or the complete S3 tuple;
- the web CMS client is server-only, no-store, bounded, timeout-protected, runtime-validated, and error-redacted;
- the CMS production overlay is opt-in and cannot weaken the existing core or AI topology;
- migration up/status behavior, image build, `/health`, `/admin`, and empty projection runtime smokes pass;
- one fresh `npm run verify:local` and GitHub CI pass;
- Draft PR #3 remains Draft and records that no public route has switched to CMS yet.
