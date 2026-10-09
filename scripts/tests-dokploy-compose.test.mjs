import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

for (const [label, script, args] of [
  ["Dokploy", "verify-production-compose.mjs", ["--dokploy"]],
  ["production core", "verify-production-compose.mjs", []],
  ["broker overlay", "verify-production-ai-compose.mjs", []],
]) {
  test(`${label} requires only the selected AI provider credentials`, () => {
    const env = {
      ...process.env,
      WEBDIAG_AI_RUNTIME_ENABLED: "true",
      WEBDIAG_MONITORING_INTERNAL_TOKEN: "M".repeat(40),
      WEBDIAG_CRAWLER_INTERNAL_TOKEN: "C".repeat(40),
      WEBDIAG_ACCOUNT_INTERNAL_TOKEN: "B".repeat(40),
      WEBDIAG_AI_INTERNAL_TOKEN: "A".repeat(40),
      WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET: "S".repeat(40),
      RABBITMQ_DEFAULT_PASS: "R".repeat(40),
      WEBDIAG_AI_TEXT_PROVIDER: "cloudflare",
      WEBDIAG_AI_IMAGE_PROVIDER: "cloudflare",
      CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
      CLOUDFLARE_API_TOKEN: "T".repeat(40),
      AI_GATEWAY_API_KEY: "",
    };
    const run = (changes) => spawnSync(process.execPath, ["scripts/" + script, ...args], {
      cwd: root, env: { ...env, ...changes }, encoding: "utf8", windowsHide: true,
    });
    assert.equal(run({}).status, 0, "Cloudflare-only policy must not require a Vercel key");
    assert.notEqual(run({ CLOUDFLARE_API_TOKEN: "" }).status, 0, "Cloudflare credential is required");
    assert.notEqual(run({ WEBDIAG_AI_TEXT_PROVIDER: "vercel" }).status, 0, "Mixed policy still requires Vercel credential");
  });
}

function render(files, env) {
  const args = ["compose", ...files.flatMap((file) => ["-f", file]), "config"];
  if (!env) args.push("--no-interpolate");
  args.push("--format", "json");
  const result = spawnSync("docker", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
    env: env ?? process.env,
  });
  assert.equal(result.status, 0, `Compose could not render ${files.join(", ")}`);
  return JSON.parse(result.stdout);
}

test("Dokploy resolves its API through a private network alias", () => {
  const model = render(["docker-compose.dokploy.yml"]);
  assert.equal(model.networks.backend.driver, "bridge");
  for (const service of Object.values(model.services)) {
    assert.deepEqual(Object.keys(service.networks), ["backend"]);
  }
  assert.deepEqual(model.services.api.networks.backend.aliases, ["webdiag-api"]);
  assert.equal(model.services.web.environment.WEBDIAG_API_INTERNAL_URL, "http://webdiag-api:8000");
  for (const key of ["WEBDIAG_MONITORING_API_INTERNAL_URL", "WEBDIAG_CRAWLER_API_INTERNAL_URL", "WEBDIAG_AI_API_INTERNAL_URL"]) {
    assert.equal(model.services.monitoring_scheduler.environment[key], "http://webdiag-api:8000");
  }
});

test("Dokploy core matches the production core without host-published ports", () => {
  const core = render([
    "docker-compose.yml",
    "docker-compose.account.override.yml",
    "docker-compose.production.yml",
  ]);
  const dokploy = render(["docker-compose.dokploy.yml"]);

  assert.deepEqual(Object.keys(dokploy.services).sort(), ["api", "monitoring_scheduler", "web"]);
  assert.deepEqual(Object.keys(dokploy.volumes).sort(), ["account_data", "ai_artifacts"]);
  assert.deepEqual(dokploy.volumes, core.volumes);
  assert.equal(core.services.web.environment.HOSTNAME, "0.0.0.0");
  assert.equal(dokploy.services.web.environment.HOSTNAME, "0.0.0.0");

  for (const name of Object.keys(dokploy.services)) {
    const expected = structuredClone(core.services[name]);
    delete expected.ports;
    expected.networks = name === "api" ? { backend: { aliases: ["webdiag-api"] } } : { backend: {} };
    for (const key of ["WEBDIAG_API_INTERNAL_URL", "WEBDIAG_MONITORING_API_INTERNAL_URL", "WEBDIAG_CRAWLER_API_INTERNAL_URL", "WEBDIAG_AI_API_INTERNAL_URL"]) {
      if (Object.hasOwn(expected.environment, key)) expected.environment[key] = "http://webdiag-api:8000";
    }
    if (name === "web") expected.expose = ["3000"];
    assert.deepEqual(dokploy.services[name], expected, `${name} differs from production core`);
    assert.equal(Object.hasOwn(dokploy.services[name], "ports"), false, `${name} publishes a host port`);
  }
});

test("server image artifacts persist privately across API and worker containers", () => {
  const model = render(["docker-compose.dokploy.yml"]);
  for (const name of ["api", "monitoring_scheduler"]) {
    const service = model.services[name];
    assert.equal(service.environment.WEBDIAG_AI_ARTIFACT_STORAGE, "local");
    assert.equal(service.environment.WEBDIAG_AI_ARTIFACT_LOCAL_ROOT, "/var/lib/webdiag-ai-artifacts");
    assert.equal(service.volumes.filter(v => v.source === "ai_artifacts" && v.target === "/var/lib/webdiag-ai-artifacts" && !v.read_only).length, 1);
  }
  assert.equal(model.services.web.volumes?.some(v => v.source === "ai_artifacts") ?? false, false);
  assert.equal(model.services.monitoring_scheduler.volumes.some(v => v.source === "account_data"), false);
});

test("Dokploy preflight fails closed without production credentials", () => {
  const env = { ...process.env };
  delete env.WEBDIAG_MONITORING_INTERNAL_TOKEN;
  delete env.WEBDIAG_CRAWLER_INTERNAL_TOKEN;
  const result = spawnSync("node", ["scripts/verify-production-compose.mjs", "--dokploy"], {
    cwd: root,
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /preflight failed: Compose configuration is invalid/u);
  assert.doesNotMatch(result.stderr, /\$\{WEBDIAG_/u);
});

test("the broker overlay keeps provider credentials on its dedicated worker", () => {
  const model = render([
    "docker-compose.yml", "docker-compose.account.override.yml",
    "docker-compose.production.yml", "docker-compose.production.ai.yml",
  ], {
    ...process.env,
    WEBDIAG_MONITORING_INTERNAL_TOKEN: "M123456789012345678901234567890123456789",
    WEBDIAG_CRAWLER_INTERNAL_TOKEN: "C123456789012345678901234567890123456789",
    WEBDIAG_AI_INTERNAL_TOKEN: "A123456789012345678901234567890123456789",
    WEBDIAG_AI_SAFETY_IDENTIFIER_SECRET: "S123456789012345678901234567890123456789",
    RABBITMQ_DEFAULT_PASS: "test-rabbit-password-1234567890",
    AI_GATEWAY_API_KEY: "test-gateway-key-1234567890",
  });
  assert.equal(model.services.api.environment.WEBDIAG_AI_RUNTIME_ENABLED, "true");
  assert.equal(model.services.monitoring_scheduler.environment.WEBDIAG_AI_RUNTIME_ENABLED, "false");
  for (const key of ["AI_PROVIDER", "AI_GATEWAY_API_KEY", "AI_GATEWAY_BASE_URL", "AI_MODEL", "AI_REASONING_EFFORT"]) {
    assert.equal(Object.hasOwn(model.services.monitoring_scheduler.environment, key), false, key);
    assert.equal(Object.hasOwn(model.services.worker.environment, key), true, key);
  }
});
