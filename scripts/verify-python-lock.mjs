import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireVenvPython } from "./python-runtime.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lockfilePath = path.join(rootDir, "requirements-dev.lock.txt");

const WINDOWS_SKIPPED_LOCKED_PACKAGES = new Set(["uvloop"]);
const WINDOWS_ALLOWED_INSTALLED_PACKAGES = new Map([["colorama", "0.4.6"]]);
const OPTIONAL_PROJECT_INSTALLED_PACKAGES = new Map([["pika", "1.4.1"]]);

function isWindowsPlatform(platform) {
  return platform === "win32";
}

function isSkippableMissingLockedPackage(name, platform) {
  return isWindowsPlatform(platform) && WINDOWS_SKIPPED_LOCKED_PACKAGES.has(name);
}

function allowedInstalledPackageVersion(name, platform) {
  if (isWindowsPlatform(platform) && WINDOWS_ALLOWED_INSTALLED_PACKAGES.has(name)) {
    return WINDOWS_ALLOWED_INSTALLED_PACKAGES.get(name);
  }
  return OPTIONAL_PROJECT_INSTALLED_PACKAGES.get(name);
}

export function normalizePackageName(value) {
  return value.trim().toLowerCase().replace(/[_.]+/g, "-");
}

export function parseFrozenRequirements(rawText, { sourceName = "requirements" } = {}) {
  const requirements = new Map();
  const invalidLines = [];

  for (const [index, rawLine] of rawText.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("-e ") || line.startsWith("--editable ")) continue;

    const match = /^([A-Za-z0-9_.-]+)==([^\s#]+)$/.exec(line);
    if (!match) {
      invalidLines.push(`${sourceName}:${index + 1}: ${line}`);
      continue;
    }

    const name = normalizePackageName(match[1]);
    const version = match[2];
    if (requirements.has(name)) {
      invalidLines.push(`${sourceName}:${index + 1}: duplicate package ${match[1]}`);
      continue;
    }
    requirements.set(name, { name: match[1], version, line });
  }

  return { requirements, invalidLines };
}

export function compareLockedRequirements({ lockedText, installedText, platform = process.platform }) {
  const locked = parseFrozenRequirements(lockedText, { sourceName: "requirements-dev.lock.txt" });
  const installed = parseFrozenRequirements(installedText, { sourceName: "pip freeze" });
  const errors = [...locked.invalidLines, ...installed.invalidLines];

  for (const [name, expected] of locked.requirements.entries()) {
    const actual = installed.requirements.get(name);
    if (!actual) {
      if (!isSkippableMissingLockedPackage(name, platform)) {
        errors.push(`missing installed package: ${expected.name}==${expected.version}`);
      }
      continue;
    }
    if (actual.version !== expected.version) {
      errors.push(
        `version drift: ${expected.name} expected ${expected.version}, installed ${actual.version}`,
      );
    }
  }

  for (const [name, actual] of installed.requirements.entries()) {
    if (!locked.requirements.has(name)) {
      const allowedVersion = allowedInstalledPackageVersion(name, platform);
      if (allowedVersion === actual.version) continue;
      if (allowedVersion) {
        errors.push(
          `unlocked installed package version drift: ${actual.name} expected ${allowedVersion}, installed ${actual.version}`,
        );
      } else {
        errors.push(`unlocked installed package: ${actual.name}==${actual.version}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    lockedCount: locked.requirements.size,
    installedCount: installed.requirements.size,
  };
}

async function run() {
  let pythonPath;
  try {
    pythonPath = requireVenvPython(rootDir);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const freeze = spawnSync(pythonPath, ["-m", "pip", "freeze", "--exclude-editable"], {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    shell: false,
  });

  if (freeze.error) {
    console.error(`Failed to start pip freeze: ${freeze.error.message}`);
    process.exit(1);
  }
  if ((freeze.status ?? 1) !== 0) {
    if (freeze.stdout) process.stdout.write(freeze.stdout);
    if (freeze.stderr) process.stderr.write(freeze.stderr);
    process.exit(freeze.status ?? 1);
  }

  const lockedText = await readFile(lockfilePath, "utf8");
  const result = compareLockedRequirements({ lockedText, installedText: freeze.stdout });

  if (!result.ok) {
    console.error("Python lock verification failed:");
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Python lock verification passed: ${result.lockedCount} locked packages match installed packages for ${process.platform}.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
