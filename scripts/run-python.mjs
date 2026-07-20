import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { requireVenvPython } from "./python-runtime.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let pythonPath;
try {
  pythonPath = requireVenvPython(rootDir);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const result = spawnSync(pythonPath, process.argv.slice(2), {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(`Failed to start project Python: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
