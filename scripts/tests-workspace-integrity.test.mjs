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
  for (const scriptName of ["python:where", "python:install", "test:python", "lint:python"]) {
    const command = rootPackage.scripts[scriptName];
    assert.match(command, /^node scripts\/run-python\.mjs(?: |$)/, `${scriptName} bypasses .venv`);
  }
  assert.equal(rootPackage.scripts["test:python"].includes("python -m"), false);
  assert.equal(rootPackage.scripts["lint:python"].includes("python -m"), false);
});
