import { readFile } from "node:fs/promises";

const publicRelease = process.env.PUBLIC_RELEASE === "true";
if (!publicRelease) {
  console.log("PUBLIC_RELEASE is not enabled; internal build gate passed.");
  process.exit(0);
}

const registryUrl = new URL("../packages/tool-registry/registry/tools.json", import.meta.url);
const tools = JSON.parse(await readFile(registryUrl, "utf8"));
const blocked = tools.filter((tool) => tool.state !== "ready");

if (tools.length !== 110 || blocked.length > 0) {
  console.error(
    `Public release blocked: registry=${tools.length}, ready=${tools.length - blocked.length}, blocked=${blocked.length}.`,
  );
  process.exit(1);
}

console.log("Public release registry gate passed.");
