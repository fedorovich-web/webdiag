import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDir = path.join(rootDir, ".github", "workflows");
const ciWorkflow = await readFile(path.join(workflowsDir, "ci.yml"), "utf8");

test("pins every external GitHub Action to an immutable commit SHA", async () => {
  const files = (await readdir(workflowsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  assert.ok(files.length > 0, "no GitHub Actions workflows were found");

  const externalUses = [];
  for (const filename of files) {
    const source = await readFile(path.join(workflowsDir, filename), "utf8");
    for (const match of source.matchAll(/^\s*uses:\s*["']?([^\s#"']+)["']?/gm)) {
      if (!match[1].startsWith("./")) {
        externalUses.push({ filename, reference: match[1] });
      }
    }
  }

  assert.ok(externalUses.length > 0, "no external GitHub Actions were found");
  for (const { filename, reference } of externalUses) {
    assert.match(
      reference,
      /^[^@\s]+@[0-9a-f]{40}$/,
      `${filename}: external action must use a full commit SHA: ${reference}`,
    );
  }
});

test("uses committed Python hashes without an unpinned pip upgrade", () => {
  assert.doesNotMatch(ciWorkflow, /pip install --upgrade pip/);
  const windowsJob = ciWorkflow.split(/^  python-locks:/m)[0];
  const installIndex = windowsJob.indexOf("run: npm run python:install");
  const verifyIndex = windowsJob.indexOf("run: npm run verify:local");
  assert.ok(installIndex !== -1, "Windows verification does not install the Python lock");
  assert.ok(verifyIndex > installIndex, "Windows full verification runs before hashed install");
});

test("verifies Python locks on Ubuntu with Python 3.13 and 3.14", () => {
  const linuxJob = ciWorkflow.split(/^  python-locks:/m)[1];
  assert.ok(linuxJob, "python-locks job is missing");
  assert.match(linuxJob, /runs-on: ubuntu-latest/);
  assert.match(linuxJob, /python-version: \["3\.13", "3\.14"\]/);
  for (const command of [
    "npm run python:install",
    "npm run verify:python-lock",
    "npm run test:python",
    "npm run lint:python",
    "node scripts/run-python.mjs -m pip check",
  ]) {
    assert.ok(linuxJob.includes(`run: ${command}`), `Linux job is missing: ${command}`);
  }
});

test("builds and import-smokes both production images only on Python 3.14", () => {
  const linuxJob = ciWorkflow.split(/^  python-locks:/m)[1];
  const conditionalSteps = linuxJob.match(
    /- name: Build production Python images[\s\S]*?(?=\n      - name:|$)/,
  )?.[0];
  const smokeStep = linuxJob.match(
    /- name: Smoke production Python images[\s\S]*?(?=\n      - name:|$)/,
  )?.[0];
  assert.ok(conditionalSteps, "Docker build step is missing");
  assert.ok(smokeStep, "Docker smoke step is missing");
  for (const step of [conditionalSteps, smokeStep]) {
    assert.match(step, /if: matrix\.python-version == '3\.14'/);
  }
  assert.match(conditionalSteps, /docker build -f apps\/api\/Dockerfile -t webdiag-api:ci \./);
  assert.match(
    conditionalSteps,
    /docker build -f apps\/worker\/Dockerfile -t webdiag-worker:ci \./,
  );
  assert.match(smokeStep, /--entrypoint python webdiag-api:ci -c/);
  assert.match(smokeStep, /from webdiag_api\.main import app/);
  assert.match(smokeStep, /WEBDIAG_BROKER_BACKEND=stub/);
  assert.match(smokeStep, /--entrypoint python webdiag-worker:ci -c/);
  assert.match(smokeStep, /import webdiag_worker\.actors/);
  assert.doesNotMatch(smokeStep, /curl|wget|https?:\/\//i);
});
