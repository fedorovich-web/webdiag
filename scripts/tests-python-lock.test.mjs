import assert from "node:assert/strict";
import test from "node:test";
import {
  compareLockedRequirements,
  normalizePackageName,
  parseFrozenRequirements,
} from "./verify-python-lock.mjs";

test("normalizes Python package names for lock comparison", () => {
  assert.equal(normalizePackageName("pydantic_core"), "pydantic-core");
  assert.equal(normalizePackageName("Pydantic.Settings"), "pydantic-settings");
});

test("parses pinned pip freeze style requirements", () => {
  const parsed = parseFrozenRequirements("# comment\nfastapi==0.139.1\n-e ./apps/api\nPyYAML==6.0.3\n");
  assert.equal(parsed.invalidLines.length, 0);
  assert.equal(parsed.requirements.size, 2);
  assert.equal(parsed.requirements.get("pyyaml")?.version, "6.0.3");
});

test("detects missing, extra, and version drift", () => {
  const result = compareLockedRequirements({
    lockedText: "fastapi==0.139.1\nhttpx==0.28.1\n",
    installedText: "fastapi==0.139.2\npytest==9.1.1\n",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /version drift: fastapi expected 0\.139\.1, installed 0\.139\.2/);
  assert.match(result.errors.join("\n"), /missing installed package: httpx==0\.28\.1/);
  assert.match(result.errors.join("\n"), /unlocked installed package: pytest==9\.1\.1/);
});

test("passes when lock and installed package set match", () => {
  const result = compareLockedRequirements({
    lockedText: "fastapi==0.139.1\nwebsockets==16.1.1\n",
    installedText: "websockets==16.1.1\nfastapi==0.139.1\n",
  });

  assert.deepEqual(result, {
    ok: true,
    errors: [],
    lockedCount: 2,
    installedCount: 2,
  });
});
