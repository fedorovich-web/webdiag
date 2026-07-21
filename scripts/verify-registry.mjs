import { readFile } from "node:fs/promises";

const registryUrl = new URL("../packages/tool-registry/registry/tools.json", import.meta.url);
const tools = JSON.parse(await readFile(registryUrl, "utf8"));
const ids = new Set(tools.map((tool) => tool.id));
const slugs = new Set(tools.map((tool) => tool.slug));

const failures = [];
if (tools.length !== 111) failures.push(`Expected 111 registry entries, got ${tools.length}.`);
if (ids.size !== tools.length) failures.push("Tool IDs are not unique.");
if (slugs.size !== tools.length) failures.push("Tool slugs are not unique.");
for (const tool of tools) {
  if (!tool.title?.ru || !tool.title?.en) failures.push(`${tool.id}: missing localized title.`);
  if (tool.state === "ready" && (!tool.description?.ru || !tool.description?.en)) {
    failures.push(`${tool.id}: ready tool has no localized public description.`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Registry verified: ${tools.length} unique tools.`);
