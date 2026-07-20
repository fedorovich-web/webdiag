import { existsSync } from "node:fs";
import path from "node:path";

export function getVenvPythonPath(rootDir, platform = process.platform) {
  return platform === "win32"
    ? path.join(rootDir, ".venv", "Scripts", "python.exe")
    : path.join(rootDir, ".venv", "bin", "python");
}

export function requireVenvPython(
  rootDir,
  { platform = process.platform, fileExists = existsSync } = {},
) {
  const pythonPath = getVenvPythonPath(rootDir, platform);
  if (!fileExists(pythonPath)) {
    const createCommand =
      platform === "win32"
        ? "py -3.14 -m venv .venv"
        : "python3 -m venv .venv";
    throw new Error(
      [
        `Project Python environment was not found: ${pythonPath}`,
        `Create it from the repository root with: ${createCommand}`,
        "Then install dependencies with: npm run python:install",
      ].join("\n"),
    );
  }
  return pythonPath;
}
