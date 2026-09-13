import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (relativePath) =>
  JSON.parse(await readFile(new URL(relativePath, root), "utf8"));

const rootPackage = await readJson("package.json");
const baseTsconfig = await readJson("tsconfig.base.json");
const corePackage = await readJson("packages/tool-core/package.json");
const registryPackage = await readJson("packages/tool-registry/package.json");

test("TypeScript quality gates reject unused locals and parameters", () => {
  assert.equal(baseTsconfig.compilerOptions.noUnusedLocals, true);
  assert.equal(baseTsconfig.compilerOptions.noUnusedParameters, true);
});

test("shared TypeScript packages expose dedicated typecheck scripts", () => {
  assert.equal(corePackage.scripts.typecheck, "tsc --noEmit");
  assert.equal(registryPackage.scripts.typecheck, "tsc --noEmit");
});

test("root typecheck covers every TypeScript workspace", () => {
  const command = rootPackage.scripts.typecheck;
  for (const workspace of [
    "@webdiag/tool-core",
    "@webdiag/tool-registry",
    "@webdiag/web",
  ]) {
    assert.match(command, new RegExp(`npm --workspace ${workspace.replace("/", "\\/")} run typecheck`));
  }
});
