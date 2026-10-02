import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function render(files) {
  const args = ["compose", ...files.flatMap((file) => ["-f", file]), "config", "--no-interpolate", "--format", "json"];
  const result = spawnSync("docker", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.status, 0, `Compose could not render ${files.join(", ")}`);
  return JSON.parse(result.stdout);
}

test("Dokploy core matches the production core without host-published ports", () => {
  const core = render([
    "docker-compose.yml",
    "docker-compose.account.override.yml",
    "docker-compose.production.yml",
  ]);
  const dokploy = render(["docker-compose.dokploy.yml"]);

  assert.deepEqual(Object.keys(dokploy.services).sort(), ["api", "monitoring_scheduler", "web"]);
  assert.deepEqual(Object.keys(dokploy.volumes), ["account_data"]);
  assert.deepEqual(dokploy.volumes, core.volumes);
  assert.equal(core.services.web.environment.HOSTNAME, "0.0.0.0");
  assert.equal(dokploy.services.web.environment.HOSTNAME, "0.0.0.0");

  for (const name of Object.keys(dokploy.services)) {
    const expected = structuredClone(core.services[name]);
    delete expected.ports;
    if (name === "web") expected.expose = ["3000"];
    assert.deepEqual(dokploy.services[name], expected, `${name} differs from production core`);
    assert.equal(Object.hasOwn(dokploy.services[name], "ports"), false, `${name} publishes a host port`);
  }
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
