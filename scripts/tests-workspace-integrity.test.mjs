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
const apiDockerfile = await readFile(new URL("apps/api/Dockerfile", root), "utf8");
const workerDockerfile = await readFile(new URL("apps/worker/Dockerfile", root), "utf8");

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

test("Python production images build local wheels with hashed build dependencies", () => {
  for (const [name, dockerfile] of [
    ["api", apiDockerfile],
    ["worker", workerDockerfile],
  ]) {
    assert.match(dockerfile, /^FROM python:3\.14-slim-bookworm AS builder$/m, name);
    assert.match(dockerfile, /^FROM python:3\.14-slim-bookworm AS runtime$/m, name);
    const [builder, runtime] = dockerfile.split(
      /^FROM python:3\.14-slim-bookworm AS runtime$/m,
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
      /^FROM python:3\.14-slim-bookworm AS runtime$/m,
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
