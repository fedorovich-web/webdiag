import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { getVenvPythonPath, requireVenvPython } from "./python-runtime.mjs";

const root = path.resolve("project-root");

test("resolves the project virtualenv interpreter on Windows", () => {
  assert.equal(
    getVenvPythonPath(root, "win32"),
    path.join(root, ".venv", "Scripts", "python.exe"),
  );
});

test("resolves the project virtualenv interpreter on POSIX", () => {
  assert.equal(
    getVenvPythonPath(root, "linux"),
    path.join(root, ".venv", "bin", "python"),
  );
});

test("returns the local interpreter only when it exists", () => {
  const expected = getVenvPythonPath(root, "win32");
  assert.equal(
    requireVenvPython(root, {
      platform: "win32",
      fileExists: (candidate) => candidate === expected,
    }),
    expected,
  );
});

test("fails with actionable setup instructions when .venv is missing", () => {
  assert.throws(
    () => requireVenvPython(root, { platform: "win32", fileExists: () => false }),
    /py -3\.14 -m venv \.venv[\s\S]*npm run python:install/,
  );
});
