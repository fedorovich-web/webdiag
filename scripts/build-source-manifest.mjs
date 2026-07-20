import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const excludedDirectories = new Set(["node_modules", ".next", ".venv", "__pycache__", ".pytest_cache", ".ruff_cache", ".git"]);
const excludedFiles = new Set(["SHA256SUMS.txt", "tsconfig.tsbuildinfo"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = [];
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    if (entry.isFile() && excludedFiles.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) values.push(...await walk(absolute));
    else if (entry.isFile()) values.push(absolute);
  }
  return values;
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const tools = JSON.parse(await readFile(path.join(root, "packages/tool-registry/registry/tools.json"), "utf8"));
const baseFiles = (await walk(root)).filter((file) => path.basename(file) !== "BUILD-MANIFEST.json").sort();
const manifest = {
  version: packageJson.version,
  source_root: "webdiag",
  source_files: baseFiles.length + 1,
  ready_tools: tools.filter((tool) => tool.state === "ready").length,
  registry_tools: tools.length,
  public_release: false,
};
await writeFile(path.join(root, "BUILD-MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const files = (await walk(root)).filter((file) => path.basename(file) !== "SHA256SUMS.txt").sort();
const rows = [];
for (const file of files) {
  const hash = createHash("sha256").update(await readFile(file)).digest("hex");
  rows.push(`${hash}  ${path.relative(root, file).split(path.sep).join("/")}`);
}
await writeFile(path.join(root, "SHA256SUMS.txt"), `${rows.join("\n")}\n`);
console.log(`Source manifest created for ${manifest.version}: ${manifest.source_files} files.`);
