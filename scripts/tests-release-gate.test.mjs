import assert from "node:assert/strict";
import test from "node:test";

import { isReleaseRegistryReady } from "./verify-release.mjs";

function readyTool(index) {
  const sequence = String(index).padStart(3, "0");

  return {
    id: `WD-${sequence}`,
    slug: `tool-${sequence}`,
    title: {
      ru: `Инструмент ${index}`,
      en: `Tool ${index}`,
    },
    category: "seo-audit",
    executorClass: "browser",
    riskTier: "R0",
    access: "none",
    implementationWave: "W1",
    state: "ready",
    description: {
      ru: "Готовый инструмент для проверки release gate.",
      en: "Ready tool for the release gate check.",
    },
  };
}

test("accepts a 125-entry registry when every entry is unique and ready", () => {
  const registry = Array.from({ length: 125 }, (_, index) => readyTool(index + 1));

  assert.equal(isReleaseRegistryReady(registry), true);
});

test("accepts a three-entry registry when every entry is unique and ready", () => {
  const registry = [readyTool(1), readyTool(2), readyTool(3)];

  assert.equal(isReleaseRegistryReady(registry), true);
});

test("rejects a registry with duplicate IDs", () => {
  const registry = [readyTool(1), { ...readyTool(2), id: "WD-001" }];

  assert.equal(isReleaseRegistryReady(registry), false);
});

test("rejects a registry with duplicate slugs", () => {
  const registry = [readyTool(1), { ...readyTool(2), slug: "tool-001" }];

  assert.equal(isReleaseRegistryReady(registry), false);
});

test("rejects a registry with a missing ID", () => {
  const registry = [readyTool(1), { ...readyTool(2), id: undefined }];

  assert.equal(isReleaseRegistryReady(registry), false);
});

test("rejects a registry with an empty ID", () => {
  const registry = [readyTool(1), { ...readyTool(2), id: "" }];

  assert.equal(isReleaseRegistryReady(registry), false);
});

test("rejects a registry with a missing slug", () => {
  const registry = [readyTool(1), { ...readyTool(2), slug: undefined }];

  assert.equal(isReleaseRegistryReady(registry), false);
});

test("rejects a registry with an empty slug", () => {
  const registry = [readyTool(1), { ...readyTool(2), slug: "" }];

  assert.equal(isReleaseRegistryReady(registry), false);
});

test("rejects an empty registry", () => {
  assert.equal(isReleaseRegistryReady([]), false);
});

test("rejects a registry with an entry that is not ready", () => {
  const registry = [readyTool(1), { ...readyTool(2), state: "internal" }];

  assert.equal(isReleaseRegistryReady(registry), false);
});
