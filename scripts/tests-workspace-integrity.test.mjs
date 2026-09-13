import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

const rootPackage = await readJson("package.json");
const webPackage = await readJson("apps/web/package.json");
const corePackage = await readJson("packages/tool-core/package.json");
const registryPackage = await readJson("packages/tool-registry/package.json");
const lock = await readJson("package-lock.json");
const accountComposeOverride = await readFile(
  new URL("docker-compose.account.override.yml", root),
  "utf8",
);
const compose = await readFile(new URL("docker-compose.yml", root), "utf8");
const apiDockerfile = await readFile(new URL("apps/api/Dockerfile", root), "utf8");
const workerDockerfile = await readFile(new URL("apps/worker/Dockerfile", root), "utf8");
const webDockerfile = await readFile(new URL("apps/web/Dockerfile", root), "utf8");
const dockerignore = await readFile(new URL(".dockerignore", root), "utf8");

const SHA256_IMAGE_REFERENCE = /^[^\s@]+:[^\s@]+@sha256:[0-9a-f]{64}$/;

function externalStageReferences(dockerfile) {
  return [...dockerfile.matchAll(/^FROM\s+(\S+)(?:\s+AS\s+\S+)?$/gim)].map(
    (match) => match[1],
  );
}

function composeImageReferences(source) {
  return [...source.matchAll(/^\s*image:\s*([^\s#]+)\s*$/gm)].map((match) => match[1]);
}

const workspacePackages = [webPackage, corePackage, registryPackage];

test("all JavaScript workspaces use the root project version", () => {
  for (const pkg of workspacePackages) {
    assert.equal(pkg.version, rootPackage.version, `${pkg.name} version differs from root`);
  }
});

test("web app depends on local packages at the same version", () => {
  assert.equal(webPackage.dependencies[corePackage.name], corePackage.version);
  assert.equal(webPackage.dependencies[registryPackage.name], registryPackage.version);
});

test("package-lock resolves internal packages as workspace links", () => {
  const coreLink = lock.packages["node_modules/@webdiag/tool-core"];
  const registryLink = lock.packages["node_modules/@webdiag/tool-registry"];
  assert.deepEqual(coreLink, { resolved: "packages/tool-core", link: true });
  assert.deepEqual(registryLink, { resolved: "packages/tool-registry", link: true });
  assert.equal(lock.packages["apps/web"].version, rootPackage.version);
  assert.equal(lock.packages["packages/tool-core"].version, rootPackage.version);
  assert.equal(lock.packages["packages/tool-registry"].version, rootPackage.version);
});



test("Python packages expose the same project version", async () => {
  const apiProject = await readFile(new URL("apps/api/pyproject.toml", root), "utf8");
  const workerProject = await readFile(new URL("apps/worker/pyproject.toml", root), "utf8");
  const apiInit = await readFile(new URL("apps/api/src/webdiag_api/__init__.py", root), "utf8");
  const workerInit = await readFile(new URL("apps/worker/src/webdiag_worker/__init__.py", root), "utf8");
  const expected = rootPackage.version.replaceAll(".", "\\.");
  assert.match(apiProject, new RegExp(`^version = "${expected}"$`, "m"));
  assert.match(workerProject, new RegExp(`^version = "${expected}"$`, "m"));
  assert.match(apiInit, new RegExp(`^__version__ = "${expected}"$`, "m"));
  assert.match(workerInit, new RegExp(`^__version__ = "${expected}"$`, "m"));
});

test("lock file contains no private OpenAI registry addresses", async () => {
  const raw = await readFile(new URL("package-lock.json", root), "utf8");
  assert.equal(raw.includes("internal.api.openai.org"), false);
  assert.equal(raw.includes("applied-caas-gateway"), false);
});

test("Python npm scripts always use the project virtualenv wrapper", () => {
  for (const scriptName of ["python:where", "test:python", "lint:python"]) {
    const command = rootPackage.scripts[scriptName];
    assert.match(command, /^node scripts\/run-python\.mjs(?: |$)/, `${scriptName} bypasses .venv`);
  }
  assert.equal(rootPackage.scripts["python:install"], "node scripts/install-python-dependencies.mjs");
  assert.equal(rootPackage.scripts["test:python"].includes("python -m"), false);
  assert.equal(rootPackage.scripts["lint:python"].includes("python -m"), false);
});

test("account compose requires an explicit monitoring token", () => {
  const assignments = [
    ...accountComposeOverride.matchAll(
      /WEBDIAG_MONITORING_INTERNAL_TOKEN:\s*["']?\$\{([^}]+)\}/g,
    ),
  ].map((match) => match[1]);
  assert.deepEqual(assignments, [
    "WEBDIAG_MONITORING_INTERNAL_TOKEN:?set a random token of at least 32 characters",
    "WEBDIAG_MONITORING_INTERNAL_TOKEN:?set a random token of at least 32 characters",
  ]);
});

test("account compose exposes one distinct crawler token only to API and scheduler", () => {
  const assignments = [
    ...accountComposeOverride.matchAll(
      /WEBDIAG_CRAWLER_INTERNAL_TOKEN:\s*["']?\$\{([^}]+)\}/g,
    ),
  ].map((match) => match[1]);
  assert.deepEqual(assignments, [
    "WEBDIAG_CRAWLER_INTERNAL_TOKEN:?set a distinct random token of at least 32 characters",
    "WEBDIAG_CRAWLER_INTERNAL_TOKEN:?set a distinct random token of at least 32 characters",
  ]);
});

test("production core and opt-in AI overlay have separate fail-closed preflights", async () => {
  const productionCompose = await readFile(
    new URL("docker-compose.production.yml", root),
    "utf8",
  );
  const aiCompose = await readFile(
    new URL("docker-compose.production.ai.yml", root),
    "utf8",
  );
  const environmentExample = await readFile(
    new URL(".env.production.example", root),
    "utf8",
  );
  const aiEnvironmentExample = await readFile(
    new URL(".env.production.ai.example", root),
    "utf8",
  );
  const verifier = await readFile(
    new URL("scripts/verify-production-compose.mjs", root),
    "utf8",
  );
  const aiVerifier = await readFile(
    new URL("scripts/verify-production-ai-compose.mjs", root),
    "utf8",
  );
  const coreSecrets = [
    "WEBDIAG_MONITORING_INTERNAL_TOKEN",
    "WEBDIAG_CRAWLER_INTERNAL_TOKEN",
  ];
  const aiSecrets = [
    "RABBITMQ_DEFAULT_PASS",
    "WEBDIAG_AI_INTERNAL_TOKEN",
    "WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET",
    "AI_GATEWAY_API_KEY",
  ];

  assert.match(productionCompose, /WEBDIAG_ENVIRONMENT:\s*production/g);
  assert.match(productionCompose, /WEBDIAG_ACCOUNT_COOKIE_SECURE:\s*["']true["']/);
  assert.match(productionCompose, /WEBDIAG_AI_RUNTIME_ENABLED:\s*["']false["']/);
  assert.doesNotMatch(
    productionCompose,
    /RABBITMQ|OPENROUTER|AI_GATEWAY|AI_ARTIFACT|AI_INTERNAL_TOKEN/,
  );
  assert.match(productionCompose, /rabbitmq:\s*!reset\s+null/);
  assert.match(productionCompose, /worker:\s*!reset\s+null/);
  assert.match(productionCompose, /PUBLIC_RELEASE:\s*["']true["']/g);
  assert.match(productionCompose, /api:[\s\S]*?volumes:\s*!override\s*\n\s+- account_data:\/data/);
  assert.match(productionCompose, /ai_artifacts:\s*!reset\s+null/);
  for (const name of coreSecrets) {
    assert.match(productionCompose, new RegExp(`\\$\\{${name}:\\?[^}]+\\}`), name);
    assert.match(environmentExample, new RegExp(`^${name}=$`, "m"), name);
    assert.match(aiEnvironmentExample, new RegExp(`^${name}=$`, "m"), name);
  }
  for (const name of aiSecrets) {
    assert.match(aiCompose, new RegExp(`\\$\\{${name}:\\?[^}]+\\}`), name);
    assert.match(aiEnvironmentExample, new RegExp(`^${name}=$`, "m"), name);
    assert.doesNotMatch(environmentExample, new RegExp(`^${name}=`, "m"), name);
  }
  assert.match(aiCompose, /WEBDIAG_AI_RUNTIME_ENABLED:\s*["']true["']/);
  assert.match(aiCompose, /AI_PROVIDER:\s*["']?\$\{AI_PROVIDER:-vercel\}["']?/);
  assert.match(
    aiCompose,
    /AI_GATEWAY_BASE_URL:\s*["']?\$\{AI_GATEWAY_BASE_URL:-https:\/\/ai-gateway\.vercel\.sh\/v1\}["']?/,
  );
  assert.match(aiCompose, /AI_MODEL:\s*["']?\$\{AI_MODEL:-openai\/gpt-5\.6-sol\}["']?/);
  assert.match(
    aiCompose,
    /AI_REASONING_EFFORT:\s*["']?\$\{AI_REASONING_EFFORT:-medium\}["']?/,
  );
  assert.doesNotMatch(aiCompose, /WEBDIAG_AI_ARTIFACT_/);
  assert.match(
    aiCompose,
    /command:\s*\["dramatiq",\s*"--processes",\s*"1",\s*"--threads",\s*"1",\s*"webdiag_worker\.actors"\]/,
  );
  assert.doesNotMatch(aiEnvironmentExample, /^WEBDIAG_AI_ARTIFACT_/m);
  assert.doesNotMatch(environmentExample, /change-me|replace-with/);
  assert.doesNotMatch(aiEnvironmentExample, /change-me|replace-with/);

  assert.match(webDockerfile, /ARG PUBLIC_RELEASE=false\s+ENV PUBLIC_RELEASE=\$\{PUBLIC_RELEASE\}\s+RUN npm run build/);
  assert.match(webDockerfile, /COPY \. \.\s+RUN test ! -e \.env\.production/);
  assert.equal(
    rootPackage.scripts["verify:production-compose"],
    "node scripts/verify-production-compose.mjs",
  );
  assert.equal(
    rootPackage.scripts["verify:production-ai-compose"],
    "node scripts/verify-production-ai-compose.mjs",
  );
  assert.match(verifier, /spawnSync\(["']docker["']/);
  assert.match(verifier, /["']--format["'],\s*["']json["']/);
  assert.match(verifier, /maxBuffer:\s*4 \* 1024 \* 1024/);
  assert.match(verifier, /production Compose preflight passed/);
  assert.match(verifier, /allowedEnvironmentPlacements/);
  assert.match(verifier, /service .* received .* outside its allowlist/);
  assert.match(verifier, /API volume topology differs/);
  assert.doesNotMatch(verifier, /console\.(?:log|error)\([^\n]*(?:stdout|stderr|environment)/);
  assert.match(aiVerifier, /production AI Compose preflight passed/);
  assert.match(aiVerifier, /allowedEnvironmentPlacements/);
  assert.doesNotMatch(aiVerifier, /console\.(?:log|error)\([^\n]*(?:stdout|stderr|environment)/);

  const workflow = await readFile(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.match(workflow, /run:\s*npm run verify:production-compose/);
  assert.match(workflow, /run:\s*npm run verify:production-ai-compose/);
});

test("Docker build context excludes environment files from every directory", () => {
  const rules = new Set(
    dockerignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  for (const pattern of [".env", ".env.*", "**/.env", "**/.env.*"]) {
    assert.ok(rules.has(pattern), `.dockerignore is missing ${pattern}`);
  }
  assert.equal(
    [...rules].some((rule) => rule.startsWith("!") && rule.includes(".env")),
    false,
    "environment files must not be re-included in the Docker context",
  );
});

test("all external production container images are pinned by tag and SHA-256 digest", () => {
  const dockerReferences = [
    ...externalStageReferences(apiDockerfile),
    ...externalStageReferences(workerDockerfile),
    ...externalStageReferences(webDockerfile),
  ];
  const composeReferences = composeImageReferences(compose);

  assert.equal(dockerReferences.length, 7);
  assert.equal(composeReferences.length, 3);
  for (const reference of [...dockerReferences, ...composeReferences]) {
    assert.match(reference, SHA256_IMAGE_REFERENCE, reference);
  }

  const referencesByTag = Map.groupBy(
    dockerReferences,
    (reference) => reference.split("@sha256:")[0],
  );
  assert.equal(new Set(referencesByTag.get("python:3.14-slim-bookworm")).size, 1);
  assert.equal(new Set(referencesByTag.get("node:24-bookworm-slim")).size, 1);
});

test("Dependabot covers every directory containing production container manifests", async () => {
  const config = await readFile(new URL(".github/dependabot.yml", root), "utf8");

  assert.match(config, /^version:\s*2$/m);
  assert.match(config, /^\s*- package-ecosystem:\s*["']docker["']$/m);
  for (const directory of ["/", "/apps/api", "/apps/worker", "/apps/web"]) {
    assert.match(config, new RegExp(`^\\s*- ["']${directory.replaceAll("/", "\\/")}["']$`, "m"));
  }
  assert.match(config, /^\s*interval:\s*["']weekly["']$/m);
  assert.match(config, /^\s*group-by:\s*["']dependency-name["']$/m);
});

test("Python production images build local wheels with hashed build dependencies", () => {
  for (const [name, dockerfile] of [
    ["api", apiDockerfile],
    ["worker", workerDockerfile],
  ]) {
    assert.match(
      dockerfile,
      /^FROM python:3\.14-slim-bookworm@sha256:[0-9a-f]{64} AS builder$/m,
      name,
    );
    assert.match(
      dockerfile,
      /^FROM python:3\.14-slim-bookworm@sha256:[0-9a-f]{64} AS runtime$/m,
      name,
    );
    const [builder, runtime] = dockerfile.split(
      /^FROM python:3\.14-slim-bookworm@sha256:[0-9a-f]{64} AS runtime$/m,
    );
    assert.match(builder, /requirements\/python-build\.lock\.txt/, name);
    assert.match(
      builder,
      /pip --isolated install[^\n]*--index-url https:\/\/pypi\.org\/simple[^\n]*--require-hashes[^\n]*--only-binary=:all:/,
      name,
    );
    assert.match(
      builder,
      /pip --isolated wheel[^\n]*--no-deps[^\n]*--no-build-isolation[^\n]*--wheel-dir \/wheels/,
      name,
    );
    assert.equal(runtime.includes("COPY apps/"), false, `${name}: runtime copies source tree`);
    assert.equal(runtime.includes("python-dev.lock.txt"), false, `${name}: runtime uses dev lock`);
    assert.doesNotMatch(runtime, /pytest|ruff/i, name);
  }
});

test("Python production images install only hashed runtime dependencies and one local wheel", () => {
  const cases = [
    {
      name: "api",
      dockerfile: apiDockerfile,
      runtimeLock: "python-api.lock.txt",
      wheel: "webdiag_api-*.whl",
    },
    {
      name: "worker",
      dockerfile: workerDockerfile,
      runtimeLock: "python-worker.lock.txt",
      wheel: "webdiag_worker-*.whl",
    },
  ];

  for (const fixture of cases) {
    const runtime = fixture.dockerfile.split(
      /^FROM python:3\.14-slim-bookworm@sha256:[0-9a-f]{64} AS runtime$/m,
    )[1];
    assert.ok(runtime, `${fixture.name}: runtime stage missing`);
    assert.match(runtime, new RegExp(`requirements/${fixture.runtimeLock.replace(".", "\\.")}`));
    assert.match(
      runtime,
      /pip --isolated install[^\n]*--index-url https:\/\/pypi\.org\/simple[^\n]*--require-hashes[^\n]*--only-binary=:all:/,
      fixture.name,
    );
    assert.equal(
      runtime.includes(`COPY --from=builder /wheels/${fixture.wheel} /tmp/webdiag/`),
      true,
      `${fixture.name}: runtime does not copy its local wheel`,
    );
    assert.match(runtime, /pip --isolated install[^\n]*--no-deps \/tmp\/webdiag\/\*\.whl/);
    assert.doesNotMatch(runtime, /pip install --no-cache-dir \/app\/apps\//, fixture.name);
  }
});
