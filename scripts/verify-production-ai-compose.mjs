import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [
  "docker-compose.yml",
  "docker-compose.account.override.yml",
  "docker-compose.production.yml",
  "docker-compose.production.ai.yml",
];
const extraArguments = process.argv.slice(2);

function fail(label) {
  console.error(`production AI Compose preflight failed: ${label}`);
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

const expectedServices = ["api", "monitoring_scheduler", "rabbitmq", "web", "worker"];
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
const rabbitmq = environment("rabbitmq");
const worker = environment("worker");
const web = environment("web");
expect(api.WEBDIAG_ENVIRONMENT === "production", "API environment is not production");
expect(worker.WEBDIAG_ENVIRONMENT === "production", "worker environment is not production");
expect(scheduler.WEBDIAG_ENVIRONMENT === "production", "scheduler environment is not production");
expect(api.WEBDIAG_AI_RUNTIME_ENABLED === "true", "API AI runtime is disabled");
expect(api.WEBDIAG_ACCOUNT_COOKIE_SECURE === "true", "secure account cookies are disabled");
expect(api.WEBDIAG_PUBLIC_RELEASE === "true" && web.PUBLIC_RELEASE === "true", "public release flag is disabled");
expect(service("web").build?.args?.PUBLIC_RELEASE === "true", "web build public release flag is disabled");
expect(web.WEBDIAG_API_INTERNAL_URL === "http://api:8000", "web API origin differs");
expect(worker.WEBDIAG_AI_API_INTERNAL_URL === "http://api:8000", "worker AI API origin differs");
expect(
  scheduler.WEBDIAG_AI_API_INTERNAL_URL === "http://api:8000" &&
    scheduler.WEBDIAG_MONITORING_API_INTERNAL_URL === "http://api:8000" &&
    scheduler.WEBDIAG_CRAWLER_API_INTERNAL_URL === "http://api:8000",
  "scheduler internal API origins differ",
);

expect(/^[A-Za-z0-9._~-]{1,64}$/u.test(rabbitmq.RABBITMQ_DEFAULT_USER), "RabbitMQ user is invalid");
expect(/^[A-Za-z0-9._~-]{24,128}$/u.test(rabbitmq.RABBITMQ_DEFAULT_PASS), "RabbitMQ password is invalid");
expect(
  worker.WEBDIAG_BROKER_URL ===
    `amqp://${rabbitmq.RABBITMQ_DEFAULT_USER}:${rabbitmq.RABBITMQ_DEFAULT_PASS}@rabbitmq:5672/`,
  "worker broker credential propagation differs",
);

const allowedEnvironmentPlacements = new Map([
  ["RABBITMQ_DEFAULT_USER", ["rabbitmq"]],
  ["RABBITMQ_DEFAULT_PASS", ["rabbitmq"]],
  ["WEBDIAG_BROKER_URL", ["worker"]],
  ["WEBDIAG_MONITORING_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_CRAWLER_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_AI_INTERNAL_TOKEN", ["api", "monitoring_scheduler", "worker"]],
  ["WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET", ["api"]],
  ["WEBDIAG_OPENROUTER_API_KEY", ["worker"]],
  ["WEBDIAG_AI_ARTIFACT_S3_ENDPOINT_URL", ["api", "worker"]],
  ["WEBDIAG_AI_ARTIFACT_S3_REGION", ["api", "worker"]],
  ["WEBDIAG_AI_ARTIFACT_S3_BUCKET", ["api", "worker"]],
  ["WEBDIAG_AI_ARTIFACT_PREFIX", ["api", "worker"]],
  ["WEBDIAG_AI_ARTIFACT_S3_ACCESS_KEY_ID", ["api", "worker"]],
  ["WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY", ["api", "worker"]],
  ["WEBDIAG_AI_ARTIFACT_S3_SESSION_TOKEN", ["api", "worker"]],
]);
for (const [name, allowedServices] of allowedEnvironmentPlacements) {
  for (const serviceName of expectedServices) {
    const present = Object.hasOwn(environment(serviceName), name);
    expect(present === allowedServices.includes(serviceName), `service ${serviceName} received ${name} outside its allowlist`);
  }
}

const propagatedSecrets = new Map([
  ["WEBDIAG_MONITORING_INTERNAL_TOKEN", [api, scheduler]],
  ["WEBDIAG_CRAWLER_INTERNAL_TOKEN", [api, scheduler]],
  ["WEBDIAG_AI_INTERNAL_TOKEN", [api, scheduler, worker]],
  ["WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET", [api]],
]);
const distinctSecrets = [];
for (const [name, destinations] of propagatedSecrets) {
  const value = destinations[0][name];
  expect(typeof value === "string" && /^[\x21-\x7E]{32,256}$/u.test(value), `${name} is not bounded`);
  expect(destinations.every((item) => item[name] === value), `${name} propagation differs`);
  distinctSecrets.push(value);
}
expect(new Set(distinctSecrets).size === distinctSecrets.length, "internal secrets are not distinct");
expect(typeof worker.WEBDIAG_OPENROUTER_API_KEY === "string" && worker.WEBDIAG_OPENROUTER_API_KEY.length >= 32, "worker OpenRouter key is missing");

const apiVolumes = service("api").volumes ?? [];
expect(apiVolumes.length === 1 && apiVolumes[0].source === "account_data" && apiVolumes[0].target === "/data", "API volume topology differs");
expect((service("worker").volumes ?? []).length === 0, "worker retains a volume mount");
expect(JSON.stringify(Object.keys(model?.volumes ?? {}).sort()) === JSON.stringify(["account_data"]), "named volume inventory differs");

const s3Fields = [
  "WEBDIAG_AI_ARTIFACT_S3_ENDPOINT_URL",
  "WEBDIAG_AI_ARTIFACT_S3_REGION",
  "WEBDIAG_AI_ARTIFACT_S3_BUCKET",
  "WEBDIAG_AI_ARTIFACT_PREFIX",
  "WEBDIAG_AI_ARTIFACT_S3_ACCESS_KEY_ID",
  "WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY",
  "WEBDIAG_AI_ARTIFACT_S3_SESSION_TOKEN",
];
expect(api.WEBDIAG_AI_ARTIFACT_STORAGE === "s3" && worker.WEBDIAG_AI_ARTIFACT_STORAGE === "s3", "artifact storage is not S3");
for (const name of s3Fields) expect(api[name] === worker[name], `${name} differs between API and worker`);
expect(api.WEBDIAG_AI_ARTIFACT_LOCAL_ROOT === undefined && worker.WEBDIAG_AI_ARTIFACT_LOCAL_ROOT === undefined, "local artifact storage is present");
try {
  const endpoint = new URL(api.WEBDIAG_AI_ARTIFACT_S3_ENDPOINT_URL);
  expect(endpoint.protocol === "https:" && !endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash, "S3 endpoint is not private HTTPS configuration");
} catch {
  fail("S3 endpoint is invalid");
}

console.log(`production AI Compose preflight passed: services=${expectedServices.length}`);
