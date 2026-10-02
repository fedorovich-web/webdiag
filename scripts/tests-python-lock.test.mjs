import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { installPythonDependencies } from "./install-python-dependencies.mjs";
import {
  compareInstalledRequirements,
  parseFrozenRequirements,
  selectRequirementsForPlatform,
  validatePythonLockSet,
} from "./verify-python-lock.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const groups = ["build", "api", "worker", "dev"];

async function readRepositoryLockSet() {
  const lockSet = {};
  for (const group of groups) {
    lockSet[group] = {
      sourceName: `requirements/python-${group}.in`,
      sourceText: await readFile(
        path.join(rootDir, "requirements", `python-${group}.in`),
        "utf8",
      ),
      lockName: `requirements/python-${group}.lock.txt`,
      lockText: await readFile(
        path.join(rootDir, "requirements", `python-${group}.lock.txt`),
        "utf8",
      ),
    };
  }
  return {
    groups: lockSet,
    apiProjectText: await readFile(path.join(rootDir, "apps/api/pyproject.toml"), "utf8"),
    workerProjectText: await readFile(
      path.join(rootDir, "apps/worker/pyproject.toml"),
      "utf8",
    ),
  };
}

test("validates committed source, lock, group, and pyproject parity", async () => {
  const result = validatePythonLockSet(await readRepositoryLockSet());

  assert.deepEqual(
    { ok: result.ok, errors: result.errors, groupCounts: result.groupCounts },
    {
      ok: true,
      errors: [],
      groupCounts: { build: 6, api: 33, worker: 21, dev: 45 },
    },
  );
});

test("detects source-lock version drift", async () => {
  const input = await readRepositoryLockSet();
  input.groups.build.sourceText = input.groups.build.sourceText.replace(
    "hatchling==1.27.0",
    "hatchling==1.27.1",
  );

  const result = validatePythonLockSet(input);

  assert.equal(result.ok, false);
  assert.match(
    result.errors.join("\n"),
    /requirements\/python-build\.lock\.txt: hatchling source\/lock version mismatch/,
  );
});

test("detects a direct pyproject dependency missing from its runtime source", async () => {
  const input = await readRepositoryLockSet();
  input.apiProjectText = input.apiProjectText.replace("boto3==1.43.70", "boto3==1.43.71");

  const result = validatePythonLockSet(input);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /apps\/api\/pyproject\.toml: boto3==1\.43\.71/);
});

test("selects colorama on Windows and uvloop on Linux", async () => {
  const result = validatePythonLockSet(await readRepositoryLockSet());
  const devEntries = result.parsedGroups.dev.sourceEntries;

  const windows = selectRequirementsForPlatform(devEntries, "win32");
  const linux = selectRequirementsForPlatform(devEntries, "linux");

  assert.equal(windows.has("colorama"), true);
  assert.equal(windows.has("uvloop"), false);
  assert.equal(linux.has("colorama"), false);
  assert.equal(linux.has("uvloop"), true);
  assert.equal(windows.size, 44);
  assert.equal(linux.size, 44);
});

test("parses only exact pip freeze distributions", () => {
  const parsed = parseFrozenRequirements("fastapi==0.139.1\nPyYAML==6.0.3\n", {
    sourceName: "pip freeze",
  });

  assert.equal(parsed.get("fastapi")?.version, "0.139.1");
  assert.equal(parsed.get("pyyaml")?.version, "6.0.3");
  assert.throws(
    () => parseFrozenRequirements("-e ./apps/api\n", { sourceName: "pip freeze" }),
    /pip freeze:1/,
  );
  assert.throws(
    () => parseFrozenRequirements("pkg @ file:\/\/\/tmp\/pkg\n", { sourceName: "pip freeze" }),
    /pip freeze:1/,
  );
  assert.throws(
    () => parseFrozenRequirements("Pydantic_Core==2.46.4\npydantic-core==2.46.4\n"),
    /duplicate installed package pydantic-core/,
  );
});

test("detects missing, extra, and version-drifted installed distributions", async () => {
  const validated = validatePythonLockSet(await readRepositoryLockSet());
  const result = compareInstalledRequirements({
    devEntries: validated.parsedGroups.dev.sourceEntries,
    installedText: [
      "annotated-doc==0.0.3",
      "annotated-types==0.7.0",
      "unexpected-package==1.0.0",
    ].join("\n"),
    platform: "win32",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /version drift: annotated-doc expected 0\.0\.4/);
  assert.match(result.errors.join("\n"), /missing installed package: anyio==4\.14\.2/);
  assert.match(result.errors.join("\n"), /unlocked installed package: unexpected-package==1\.0\.0/);
});

test("passes only when the selected dev set exactly matches installed distributions", async () => {
  const validated = validatePythonLockSet(await readRepositoryLockSet());
  const selected = selectRequirementsForPlatform(
    validated.parsedGroups.dev.sourceEntries,
    "win32",
  );
  const installedText = [...selected.values()]
    .reverse()
    .map((entry) => `${entry.name}==${entry.version}`)
    .join("\n");

  const result = compareInstalledRequirements({
    devEntries: validated.parsedGroups.dev.sourceEntries,
    installedText,
    platform: "win32",
  });

  assert.deepEqual(result, {
    ok: true,
    errors: [],
    expectedCount: 44,
    installedCount: 44,
  });
});

test("installer runs hashed third-party and dependency-free editable steps", () => {
  const calls = [];
  const result = installPythonDependencies({
    rootDir: "C:\\checked-out-webdiag",
    pythonPath: "C:\\checked-out-webdiag\\.venv\\Scripts\\python.exe",
    environment: {
      PATH: "C:\\Windows",
      PIP_INDEX_URL: "https://secret-index.invalid/simple",
      pip_trusted_host: "secret-index.invalid",
    },
    spawnProcess(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0 };
    },
  });

  assert.equal(result.status, 0);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].args, [
    "-m",
    "pip",
    "--isolated",
    "install",
    "--index-url",
    "https://pypi.org/simple",
    "--require-hashes",
    "--only-binary=:all:",
    "-r",
    "requirements/python-dev.lock.txt",
  ]);
  assert.deepEqual(calls[1].args, [
    "-m",
    "pip",
    "--isolated",
    "install",
    "--no-deps",
    "--no-build-isolation",
    "-e",
    "./apps/api[dev]",
    "-e",
    "./apps/worker[dev,rabbitmq]",
  ]);
  for (const call of calls) {
    assert.equal(call.command, "C:\\checked-out-webdiag\\.venv\\Scripts\\python.exe");
    assert.equal(call.options.cwd, "C:\\checked-out-webdiag");
    assert.equal(call.options.shell, false);
    assert.equal(call.options.env.PATH, "C:\\Windows");
    assert.equal(
      Object.keys(call.options.env).some((name) => name.toUpperCase().startsWith("PIP_")),
      false,
    );
  }
});

test("installer stops before editable install when hashed installation fails", () => {
  let calls = 0;
  const result = installPythonDependencies({
    rootDir: "C:\\checked-out-webdiag",
    pythonPath: "python.exe",
    environment: {},
    spawnProcess() {
      calls += 1;
      return { status: 23 };
    },
  });

  assert.equal(result.status, 23);
  assert.equal(calls, 1);
});
