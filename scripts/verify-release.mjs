import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function isReleaseRegistryReady(tools) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return false;
  }

  const ids = new Set();
  const slugs = new Set();

  return tools.every((tool) => {
    if (tool.state !== "ready" || ids.has(tool.id) || slugs.has(tool.slug)) {
      return false;
    }

    ids.add(tool.id);
    slugs.add(tool.slug);
    return true;
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
  const blocked = tools.filter((tool) => tool.state !== "ready");

  if (!isReleaseRegistryReady(tools)) {
    console.error(
      `Public release blocked: registry=${tools.length}, ready=${tools.length - blocked.length}, blocked=${blocked.length}.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log("Public release registry gate passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await verifyRelease();
}
