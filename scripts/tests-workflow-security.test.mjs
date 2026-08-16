import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDir = path.join(rootDir, ".github", "workflows");

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
