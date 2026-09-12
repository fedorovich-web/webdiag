import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const compose = readFileSync(new URL("docker-compose.yml", root), "utf8");
const envExample = readFileSync(new URL(".env.example", root), "utf8");

test("Compose connects the auth BFF to API, PostgreSQL, Redis, and Resend", () => {
  for (const variable of [
    "WEBDIAG_DATABASE_URL",
    "WEBDIAG_REDIS_URL",
    "WEBDIAG_PUBLIC_APP_URL",
    "WEBDIAG_RESEND_API_KEY",
    "WEBDIAG_SESSION_COOKIE_SECURE",
    "WEBDIAG_RATE_LIMIT_ENABLED",
  ]) {
    assert.match(compose, new RegExp(`${variable}:`));
    assert.match(envExample, new RegExp(`^${variable}=`, "m"));
  }
  assert.match(compose, /WEBDIAG_API_INTERNAL_URL:\s*http:\/\/api:8000/u);
  assert.match(compose, /api:[\s\S]*depends_on:[\s\S]*postgres:[\s\S]*valkey:/u);
  assert.doesNotMatch(envExample, /re_[A-Za-z0-9]{16,}/u);
});
