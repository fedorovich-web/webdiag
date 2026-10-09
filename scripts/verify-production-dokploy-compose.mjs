import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const coreVerifier = fileURLToPath(
  new URL("./verify-production-compose.mjs", import.meta.url),
);
const files = ["docker-compose.dokploy.yml"];
const extraArguments = process.argv.slice(2);

function fail(label) {
  console.error(`Dokploy production Compose preflight failed: ${label}`);
  process.exit(1);
}

if (
  extraArguments.length !== 0 &&
  !(extraArguments.length === 2 && extraArguments[0] === "--env-file" && extraArguments[1].trim())
) fail("usage is [--env-file PATH]");

const core = spawnSync(process.execPath, [coreVerifier, ...extraArguments], {
  cwd: root,
  encoding: "utf8",
  env: process.env,
  maxBuffer: 4 * 1024 * 1024,
  windowsHide: true,
});
if (core.error || core.status !== 0) fail("core production preflight failed");

const composeArguments = ["compose"];
if (extraArguments.length === 2) composeArguments.push(...extraArguments);
for (const file of files) composeArguments.push("-f", file);
composeArguments.push("config", "--format", "json");
const rendered = spawnSync("docker", composeArguments, {
  cwd: root,
  encoding: "utf8",
  env: process.env,
  maxBuffer: 4 * 1024 * 1024,
  windowsHide: true,
});
if (rendered.error || rendered.status !== 0) fail("Compose configuration is invalid");

let model;
try {
  model = JSON.parse(rendered.stdout);
} catch {
  fail("Compose returned invalid JSON");
}

function expect(condition, label) {
  if (!condition) fail(label);
}
function service(name) {
  const value = model?.services?.[name];
  expect(value !== null && typeof value === "object", `service ${name} is missing`);
  return value;
}
function environment(name) {
  const value = service(name).environment;
  expect(value !== null && typeof value === "object", `service ${name} environment is missing`);
  return value;
}

const expectedServices = ["api", "monitoring_scheduler", "web"];
expect(
  JSON.stringify(Object.keys(model?.services ?? {}).sort()) === JSON.stringify(expectedServices),
  "service inventory differs",
);
for (const name of expectedServices) {
  expect((service(name).ports ?? []).length === 0, `service ${name} publishes a host port`);
  expect(JSON.stringify(Object.keys(service(name).networks ?? {})) === JSON.stringify(["backend"]), `service ${name} is outside the private backend network`);
}
expect(model.networks?.backend?.driver === "bridge", "private backend network is missing");
expect(JSON.stringify(service("api").networks.backend.aliases) === JSON.stringify(["webdiag-api"]), "private API alias differs");
const webExpose = (service("web").expose ?? []).map(String);
expect(webExpose.includes("3000"), "web internal port 3000 is not exposed to the Compose network");
expect(
  environment("web").WEBDIAG_API_INTERNAL_URL === "http://webdiag-api:8000",
  "web API origin differs",
);
expect(
  (service("api").healthcheck?.test ?? []).some(
    (item) => typeof item === "string" && item.includes("127.0.0.1:8000/ready"),
  ),
  "API readiness healthcheck differs",
);
const apiVolumes = service("api").volumes ?? [];
expect(
  apiVolumes.length === 2 && apiVolumes.some(v => v.source === "account_data" && v.target === "/data") &&
    apiVolumes.some(v => v.source === "ai_artifacts" && v.target === "/var/lib/webdiag-ai-artifacts"),
  "API volume topology differs",
);
expect(
  JSON.stringify(Object.keys(model?.volumes ?? {}).sort()) === JSON.stringify(["account_data", "ai_artifacts"]),
  "named volume inventory differs",
);

console.log(`Dokploy production Compose preflight passed: services=${expectedServices.length}`);
