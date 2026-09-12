import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [
  "docker-compose.yml",
  "docker-compose.account.override.yml",
  "docker-compose.production.yml",
];
const extraArguments = process.argv.slice(2);

function fail(label) {
  console.error(`production Compose preflight failed: ${label}`);
  process.exit(1);
}

if (
  extraArguments.length !== 0 &&
  !(extraArguments.length === 2 && extraArguments[0] === "--env-file" && extraArguments[1].trim())
) fail("usage is [--env-file PATH]");

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
  expect(service(name).restart === "unless-stopped", `service ${name} restart policy differs`);
  for (const port of service(name).ports ?? []) {
    expect(port.host_ip === "127.0.0.1", `service ${name} exposes a non-loopback port`);
  }
}

const api = environment("api");
const scheduler = environment("monitoring_scheduler");
const web = environment("web");
expect(api.WEBDIAG_ENVIRONMENT === "production", "API environment is not production");
expect(scheduler.WEBDIAG_ENVIRONMENT === "production", "scheduler environment is not production");
expect(api.WEBDIAG_ACCOUNT_COOKIE_SECURE === "true", "secure account cookies are disabled");
expect(api.WEBDIAG_PUBLIC_RELEASE === "true", "API public release flag is disabled");
expect(api.WEBDIAG_AI_RUNTIME_ENABLED === "false", "AI runtime is not disabled");
expect(web.PUBLIC_RELEASE === "true", "web runtime public release flag is disabled");
expect(service("web").build?.args?.PUBLIC_RELEASE === "true", "web build public release flag is disabled");
expect(web.WEBDIAG_API_INTERNAL_URL === "http://api:8000", "web API origin differs");
expect(
  scheduler.WEBDIAG_MONITORING_API_INTERNAL_URL === "http://api:8000" &&
    scheduler.WEBDIAG_CRAWLER_API_INTERNAL_URL === "http://api:8000",
  "scheduler internal API origins differ",
);

const forbiddenCoreNames =
  /RABBITMQ|BROKER|OPENROUTER|AI_GATEWAY|WEBDIAG_AI_(?!RUNTIME_ENABLED)/u;
for (const name of expectedServices) {
  for (const key of Object.keys(environment(name))) {
    expect(!forbiddenCoreNames.test(key), `service ${name} received optional AI setting ${key}`);
  }
}

const allowedEnvironmentPlacements = new Map([
  ["WEBDIAG_MONITORING_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_CRAWLER_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
]);
const distinctSecrets = [];
for (const [name, allowedServices] of allowedEnvironmentPlacements) {
  const values = [];
  for (const serviceName of expectedServices) {
    const env = environment(serviceName);
    const present = Object.hasOwn(env, name);
    expect(present === allowedServices.includes(serviceName), `service ${serviceName} received ${name} outside its allowlist`);
    if (present) values.push(env[name]);
  }
  const value = values[0];
  expect(typeof value === "string" && /^[\x21-\x7E]{32,256}$/u.test(value), `${name} is not bounded`);
  expect(values.every((item) => item === value), `${name} propagation differs`);
  distinctSecrets.push(value);
}
expect(new Set(distinctSecrets).size === distinctSecrets.length, "internal secrets are not distinct");

const apiVolumes = service("api").volumes ?? [];
expect(
  apiVolumes.length === 1 && apiVolumes[0].source === "account_data" &&
    apiVolumes[0].target === "/data" && apiVolumes[0].read_only !== true,
  "API volume topology differs",
);
expect(
  JSON.stringify(Object.keys(model?.volumes ?? {}).sort()) === JSON.stringify(["account_data"]),
  "named volume inventory differs",
);

const forbiddenValues = new Set([
  "change-me",
  "development",
  "replace-with-at-least-32-random-characters",
  "replace-with-a-distinct-32-character-random-token",
]);
for (const name of expectedServices) {
  for (const value of Object.values(environment(name))) {
    expect(!forbiddenValues.has(value), `service ${name} contains a development placeholder`);
  }
}

console.log(`production Compose preflight passed: services=${expectedServices.length}`);
