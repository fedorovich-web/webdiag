import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const coreFiles = [
  "docker-compose.yml",
  "docker-compose.account.override.yml",
  "docker-compose.production.yml",
];
const dokploy = process.argv[2] === "--dokploy";
const files = dokploy ? ["docker-compose.dokploy.yml"] : coreFiles;
const extraArguments = process.argv.slice(dokploy ? 3 : 2);

function fail(label) {
  console.error(`production Compose preflight failed: ${label}`);
  process.exit(1);
}

if (
  extraArguments.length !== 0 &&
  !(extraArguments.length === 2 && extraArguments[0] === "--env-file" && extraArguments[1].trim())
) fail("usage is [--dokploy] [--env-file PATH]");

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
  if (dokploy) {
    expect((service(name).ports ?? []).length === 0, `service ${name} publishes a host port`);
    expect(
      JSON.stringify(service(name).expose ?? []) === JSON.stringify(name === "web" ? ["3000"] : []),
      `service ${name} internal ports differ`,
    );
  } else {
    for (const port of service(name).ports ?? []) {
      expect(port.host_ip === "127.0.0.1", `service ${name} exposes a non-loopback port`);
    }
  }
}

const api = environment("api");
const scheduler = environment("monitoring_scheduler");
const web = environment("web");
expect(api.WEBDIAG_ENVIRONMENT === "production", "API environment is not production");
expect(scheduler.WEBDIAG_ENVIRONMENT === "production", "scheduler environment is not production");
expect(api.WEBDIAG_ACCOUNT_COOKIE_SECURE === "true", "secure account cookies are disabled");
expect(api.WEBDIAG_ACCOUNT_REGISTRATION_REQUEST_LIMIT === "30", "registration request limit differs");
expect(api.WEBDIAG_ACCOUNT_REGISTRATION_WINDOW_SECONDS === "60", "registration window differs");
expect(api.WEBDIAG_ACCOUNT_REGISTRATION_CONCURRENCY_LIMIT === "2", "registration concurrency differs");
expect(api.WEBDIAG_ACCOUNT_REGISTRATION_LEASE_SECONDS === "30", "registration lease differs");
expect(api.WEBDIAG_PUBLIC_RELEASE === "true", "API public release flag is disabled");
const aiEnabled = api.WEBDIAG_AI_RUNTIME_ENABLED === "true";
expect(["true", "false"].includes(api.WEBDIAG_AI_RUNTIME_ENABLED), "AI runtime flag is invalid");
expect(scheduler.WEBDIAG_AI_RUNTIME_ENABLED === api.WEBDIAG_AI_RUNTIME_ENABLED, "AI runtime propagation differs");
expect(
  (service("api").healthcheck?.test ?? []).some(
    (item) => typeof item === "string" && item.includes("127.0.0.1:8000/ready"),
  ),
  "API healthcheck does not use persistent-storage readiness",
);
expect(api.WEBDIAG_CRAWLER_PAGE_LIMIT === "100", "crawler page budget differs");
expect(api.WEBDIAG_CRAWLER_DEADLINE_SECONDS === "240", "crawler deadline differs");
expect(api.WEBDIAG_CRAWLER_LEASE_SECONDS === "300", "crawler lease differs");
expect(api.WEBDIAG_CRAWLER_ACTIVE_JOB_LIMIT_PER_USER === "2", "crawler user limit differs");
expect(api.WEBDIAG_CRAWLER_ACTIVE_JOB_LIMIT_GLOBAL === "25", "crawler queue limit differs");
expect(
  scheduler.WEBDIAG_CRAWLER_WORKER_TIMEOUT_SECONDS === "270",
  "crawler worker timeout differs",
);
expect(web.PUBLIC_RELEASE === "true", "web runtime public release flag is disabled");
expect(web.HOSTNAME === "0.0.0.0", "web is not bound to the container network");
expect(service("web").build?.args?.PUBLIC_RELEASE === "true", "web build public release flag is disabled");
const internalApiOrigin = dokploy ? "http://webdiag-api:8000" : "http://api:8000";
expect(web.WEBDIAG_API_INTERNAL_URL === internalApiOrigin, "web API origin differs");
expect(
  scheduler.WEBDIAG_MONITORING_API_INTERNAL_URL === internalApiOrigin &&
    scheduler.WEBDIAG_CRAWLER_API_INTERNAL_URL === internalApiOrigin,
  "scheduler internal API origins differ",
);

const forbiddenCoreNames = /RABBITMQ|BROKER|OPENROUTER/u;
const aiPlacements = new Map([
  ["WEBDIAG_AI_RUNTIME_ENABLED", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_AI_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET", ["api"]],
  ["WEBDIAG_AI_API_INTERNAL_URL", ["monitoring_scheduler"]],
  ["AI_GATEWAY_API_KEY", ["monitoring_scheduler"]],
  ["AI_GATEWAY_BASE_URL", ["monitoring_scheduler"]],
  ["AI_MODEL", ["monitoring_scheduler"]],
  ["AI_PROVIDER", ["monitoring_scheduler"]],
  ["AI_REASONING_EFFORT", ["monitoring_scheduler"]],
  ["WEBDIAG_AI_REQUIRE_ZDR", ["monitoring_scheduler"]],
  ["WEBDIAG_AI_IMAGE_PROVIDER", ["api", "monitoring_scheduler"]],
  ["CLOUDFLARE_ACCOUNT_ID", ["monitoring_scheduler"]],
  ["CLOUDFLARE_API_TOKEN", ["monitoring_scheduler"]],
  ["WEBDIAG_AI_ARTIFACT_STORAGE", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_AI_ARTIFACT_LOCAL_ROOT", ["api", "monitoring_scheduler"]],
]);
for (const name of expectedServices) {
  for (const key of Object.keys(environment(name))) {
    expect(!forbiddenCoreNames.test(key), `service ${name} received forbidden setting ${key}`);
    if (key.startsWith("AI_") || key.startsWith("WEBDIAG_AI_")) {
      expect(aiPlacements.get(key)?.includes(name), `service ${name} received AI setting outside its allowlist`);
    }
  }
}
expect(scheduler.AI_PROVIDER === "vercel", "AI provider policy differs");
expect(scheduler.AI_GATEWAY_BASE_URL === "https://ai-gateway.vercel.sh/v1", "AI gateway policy differs");
expect(scheduler.AI_MODEL === "openai/gpt-6-luna", "AI model policy differs");
expect(scheduler.AI_REASONING_EFFORT === "medium", "AI reasoning policy differs");
expect(["true", "false"].includes(scheduler.WEBDIAG_AI_REQUIRE_ZDR), "AI retention policy must be explicit");
expect(["vercel", "cloudflare"].includes(api.WEBDIAG_AI_IMAGE_PROVIDER), "AI image provider policy is invalid");
expect(scheduler.WEBDIAG_AI_IMAGE_PROVIDER === api.WEBDIAG_AI_IMAGE_PROVIDER, "API and executor image policies differ");
if (api.WEBDIAG_AI_IMAGE_PROVIDER === "cloudflare" && api.WEBDIAG_AI_RUNTIME_ENABLED === "true") {
  expect(/^[a-f0-9]{32}$/iu.test(scheduler.CLOUDFLARE_ACCOUNT_ID), "Cloudflare account ID is invalid");
  expect(/^[\x21-\x7e]{16,512}$/u.test(scheduler.CLOUDFLARE_API_TOKEN), "Cloudflare API token is invalid");
}

expect(scheduler.WEBDIAG_AI_API_INTERNAL_URL === internalApiOrigin, "AI internal origin differs");
if (dokploy) {
  expect(model.networks?.backend?.driver === "bridge", "private backend network is missing");
  for (const name of expectedServices) {
    expect(JSON.stringify(Object.keys(service(name).networks ?? {})) === JSON.stringify(["backend"]), `service ${name} is outside the backend network`);
  }
  expect(JSON.stringify(service("api").networks.backend.aliases) === JSON.stringify(["webdiag-api"]), "private API alias differs");
}
expect(!Object.hasOwn(web, "WEBDIAG_YANDEX_CLIENT_SECRET"), "web received the Yandex client secret");
expect(api.WEBDIAG_ACCOUNT_PUBLIC_ORIGIN === web.WEBDIAG_ACCOUNT_PUBLIC_ORIGIN, "account public origin propagation differs");
expect(api.WEBDIAG_ACCOUNT_INTERNAL_TOKEN === web.WEBDIAG_ACCOUNT_INTERNAL_TOKEN, "account bridge token propagation differs");
expect(!Object.hasOwn(scheduler, "WEBDIAG_ACCOUNT_INTERNAL_TOKEN"), "scheduler received account bridge token");

const allowedEnvironmentPlacements = new Map([
  ["WEBDIAG_MONITORING_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
  ["WEBDIAG_CRAWLER_INTERNAL_TOKEN", ["api", "monitoring_scheduler"]],
]);
const distinctSecrets = [];
if (api.WEBDIAG_ACCOUNT_INTERNAL_TOKEN) {
  expect(/^[\x21-\x7E]{32,256}$/u.test(api.WEBDIAG_ACCOUNT_INTERNAL_TOKEN), "account bridge token is not bounded");
  distinctSecrets.push(api.WEBDIAG_ACCOUNT_INTERNAL_TOKEN);
}
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
if (aiEnabled) {
  for (const value of [api.WEBDIAG_AI_INTERNAL_TOKEN, api.WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET]) {
    expect(typeof value === "string" && /^[\x21-\x7E]{32,256}$/u.test(value), "AI internal secret is not bounded");
    distinctSecrets.push(value);
  }
  expect(api.WEBDIAG_AI_INTERNAL_TOKEN === scheduler.WEBDIAG_AI_INTERNAL_TOKEN, "AI token propagation differs");
  expect(typeof scheduler.AI_GATEWAY_API_KEY === "string" && /^[\x21-\x7E]{16,512}$/u.test(scheduler.AI_GATEWAY_API_KEY), "AI gateway credential is missing");
}
expect(new Set(distinctSecrets).size === distinctSecrets.length, "internal secrets are not distinct");

const apiVolumes = service("api").volumes ?? [];
expect(
  apiVolumes.length === 2 && apiVolumes.some(v => v.source === "account_data" &&
    v.target === "/data" && v.read_only !== true) && apiVolumes.some(v =>
    v.source === "ai_artifacts" && v.target === "/var/lib/webdiag-ai-artifacts" && v.read_only !== true),
  "API volume topology differs",
);
expect(
  JSON.stringify(Object.keys(model?.volumes ?? {}).sort()) === JSON.stringify(["account_data", "ai_artifacts"]),
  "named volume inventory differs",
);
for (const name of ["api", "monitoring_scheduler"]) {
  expect(environment(name).WEBDIAG_AI_ARTIFACT_STORAGE === "local", `${name} artifact storage differs`);
  expect(environment(name).WEBDIAG_AI_ARTIFACT_LOCAL_ROOT === "/var/lib/webdiag-ai-artifacts", `${name} artifact root differs`);
}
const schedulerVolumes = service("monitoring_scheduler").volumes ?? [];
expect(schedulerVolumes.length === 1 && schedulerVolumes[0].source === "ai_artifacts" && schedulerVolumes[0].target === "/var/lib/webdiag-ai-artifacts", "worker artifact volume differs");
expect(!(service("web").volumes ?? []).some(v => v.source === "ai_artifacts"), "web must not mount private image artifacts");

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
