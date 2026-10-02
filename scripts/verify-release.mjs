import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function isReleaseRegistryReady(tools) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return false;
  }

  const ids = new Set();
  const slugs = new Set();

  for (const tool of tools) {
    if (
      tool === null ||
      typeof tool !== "object" ||
      typeof tool.id !== "string" ||
      tool.id.trim() === "" ||
      typeof tool.slug !== "string" ||
      tool.slug.trim() === "" ||
      ids.has(tool.id) ||
      slugs.has(tool.slug)
    ) {
      return false;
    }

    if (tool.state === "ready") {
      if (tool.supersededBy !== undefined) return false;
    } else if (tool.state === "internal") {
      if (typeof tool.supersededBy !== "string" || tool.supersededBy.trim() === "") {
        return false;
      }
    } else {
      return false;
    }

    ids.add(tool.id);
    slugs.add(tool.slug);
  }

  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  return tools.every((tool) => {
    if (tool.state === "ready") return true;
    const replacement = bySlug.get(tool.supersededBy);
    return replacement?.state === "ready" && replacement.slug !== tool.slug;
  });
}

async function verifyRelease() {
  const publicRelease = process.env.PUBLIC_RELEASE === "true";
  if (!publicRelease) {
    console.log("PUBLIC_RELEASE is not enabled; internal build gate passed.");
    return;
  }

  const registryUrl = new URL("../packages/tool-registry/registry/tools.json", import.meta.url);
  const tools = JSON.parse(await readFile(registryUrl, "utf8"));
  const superseded = tools.filter((tool) => tool.state === "internal" && tool.supersededBy);
  const blocked = tools.filter((tool) => tool.state === "internal" && !tool.supersededBy);

  if (!isReleaseRegistryReady(tools)) {
    console.error(
      `Public release blocked: registry=${tools.length}, ready=${tools.length - superseded.length - blocked.length}, superseded=${superseded.length}, blocked=${blocked.length}.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Public release registry gate passed: ready=${tools.length - superseded.length}, superseded=${superseded.length}.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await verifyRelease();
}
