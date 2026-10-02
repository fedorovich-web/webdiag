import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireVenvPython } from "./python-runtime.mjs";

const THIRD_PARTY_INSTALL_ARGS = [
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
];

const EDITABLE_INSTALL_ARGS = [
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
];

function environmentWithoutPipOverrides(environment) {
  return Object.fromEntries(
    Object.entries(environment).filter(([name]) => !name.toUpperCase().startsWith("PIP_")),
  );
}

export function installPythonDependencies({
  rootDir,
  pythonPath = requireVenvPython(rootDir),
  environment = process.env,
  spawnProcess = spawnSync,
}) {
  const childEnvironment = environmentWithoutPipOverrides(environment);
  for (const args of [THIRD_PARTY_INSTALL_ARGS, EDITABLE_INSTALL_ARGS]) {
    const result = spawnProcess(pythonPath, args, {
      cwd: rootDir,
      env: childEnvironment,
      stdio: "inherit",
      shell: false,
    });
    if (result.error) {
      throw new Error("Failed to start project Python dependency installation");
    }
    const status = result.status ?? 1;
    if (status !== 0) return { status };
  }
  return { status: 0 };
}

function run() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let result;
  try {
    result = installPythonDependencies({ rootDir });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  process.exit(result.status);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run();
}
