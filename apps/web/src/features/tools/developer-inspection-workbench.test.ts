import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  buildCronExpression,
  createCronPreviewRequest,
  inspectJwt,
  parseCronExpression,
  CRON_PREVIEW_WORKER_PATH,
} from "./developer-inspection-workbench";

function base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

function token(header: unknown, payload: unknown, signature = "signature"): string {
  return `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}.${base64Url(signature)}`;
}

describe("bounded cron workbench", () => {
  it("parses five-field Unix cron values, names, lists, ranges, and steps", () => {
    const parsed = parseCronExpression("*/15 9-17 * JAN,MAR MON-FRI");
    expect(parsed.expression).toBe("*/15 9-17 * JAN,MAR MON-FRI");
    expect(parsed.fields.minute.values).toEqual([0, 15, 30, 45]);
    expect(parsed.fields.hour.values).toHaveLength(9);
    expect(parsed.fields.month.values).toEqual([1, 3]);
    expect(parsed.fields.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
    expect(parsed.fields.dayOfMonth.unrestricted).toBe(true);
  });

  it("normalizes Sunday 7 without breaking ranges", () => {
    expect(parseCronExpression("0 0 * * 7").fields.dayOfWeek.values).toEqual([0]);
    expect(parseCronExpression("0 0 * * 5-7").fields.dayOfWeek.values).toEqual([0, 5, 6]);
    expect(parseCronExpression("0 0 * * 7").expression).toBe("0 0 * * 0");
  });

  it("builds through the same parser contract and creates a bounded worker request", () => {
    const parsed = buildCronExpression({ minute: "0", hour: "*/6", dayOfMonth: "1", month: "*", dayOfWeek: "*" });
    const request = createCronPreviewRequest(parsed, { requestId: 4, fromTimestamp: Date.UTC(2026, 0, 1), maximumOccurrences: 5, horizonDays: 30 });
    expect(parsed.expression).toBe("0 */6 1 * *");
    expect(request.maximumOccurrences).toBe(5);
    expect(request.horizonMinutes).toBe(43_200);
    expect(request.maximumIterations).toBe(43_200);
    expect(request.schedule.dayOfMonthUnrestricted).toBe(false);
    expect(request.schedule.dayOfWeekUnrestricted).toBe(true);
  });

  it("rejects unsupported dialects, invalid ranges, and unbounded requests", () => {
    expect(() => parseCronExpression("0 0 1 1 * 2026")).toThrow("invalid_cron_field_count");
    expect(() => parseCronExpression("0 0 L * *")).toThrow("unsupported_cron_syntax");
    expect(() => parseCronExpression("0 0 20-10 * *")).toThrow("reversed_cron_range");
    expect(() => parseCronExpression("*/0 * * * *")).toThrow("invalid_cron_step");
    expect(() => parseCronExpression("*/61 * * * *")).toThrow("cron_step_out_of_range");
    expect(() => parseCronExpression("60 * * * *")).toThrow("cron_value_out_of_range");
    const parsed = parseCronExpression("0 0 * * *");
    expect(() => createCronPreviewRequest(parsed, { requestId: 1, fromTimestamp: 0, maximumOccurrences: 11 })).toThrow("invalid_preview_occurrence_limit");
    expect(() => createCronPreviewRequest(parsed, { requestId: 1, fromTimestamp: 0, horizonDays: 367 })).toThrow("invalid_preview_horizon");
  });

  it("ships a same-origin worker with UTC matching limits and no dynamic execution or network", () => {
    expect(CRON_PREVIEW_WORKER_PATH).toBe("/workers/cron-preview-worker.js");
    const source = readFileSync(new URL("../../../public/workers/cron-preview-worker.js", import.meta.url), "utf8");
    expect(source).toContain("getUTCMinutes");
    expect(source).toContain("maximumIterations");
    expect(source).toContain("dayOfMonthUnrestricted");
    expect(source).toContain('self.postMessage({ kind: "ready" })');
    expect(source).not.toMatch(/\beval\s*\(/u);
    expect(source).not.toMatch(/\bFunction\s*\(/u);
    expect(source).not.toMatch(/\bfetch\s*\(/u);
    expect(source).not.toMatch(/XMLHttpRequest|WebSocket|EventSource|importScripts/u);
  });

  it("calculates deterministic UTC occurrences and rejects forged unbounded worker requests", () => {
    const source = readFileSync(new URL("../../../public/workers/cron-preview-worker.js", import.meta.url), "utf8");
    const messages: unknown[] = [];
    const workerSelf: { onmessage?: (event: { readonly data: unknown }) => void; postMessage: (message: unknown) => void } = {
      postMessage(message) { messages.push(message); },
    };
    runInNewContext(source, { self: workerSelf, Date, Set, Number, Error, Array });
    const parsed = parseCronExpression("0 0 * * *");
    const request = createCronPreviewRequest(parsed, { requestId: 8, fromTimestamp: Date.UTC(2026, 0, 1), maximumOccurrences: 2, horizonDays: 3 });
    workerSelf.onmessage?.({ data: request });
    let normalizedMessages = JSON.parse(JSON.stringify(messages)) as unknown[];
    expect(normalizedMessages).toContainEqual({ kind: "ready" });
    expect(normalizedMessages).toContainEqual(expect.objectContaining({
      kind: "result",
      ok: true,
      requestId: 8,
      occurrences: ["2026-01-02T00:00:00.000Z", "2026-01-03T00:00:00.000Z"],
    }));

    workerSelf.onmessage?.({ data: { ...request, requestId: 9, maximumIterations: 99_000_000 } });
    normalizedMessages = JSON.parse(JSON.stringify(messages)) as unknown[];
    expect(normalizedMessages).toContainEqual(expect.objectContaining({ kind: "result", ok: false, requestId: 9, error: "invalid_preview_limits" }));
  });
});

describe("local JWT inspection lab", () => {
  it("strictly decodes JSON and reports temporal claims without claiming verification", () => {
    const value = token(
      { alg: "RS256", typ: "JWT", kid: "key-1" },
      { iss: "https://issuer.example", sub: "user-1", aud: ["webdiag"], iat: 1_700_000_000, nbf: 1_700_000_100, exp: 1_700_003_600 },
    );
    const result = inspectJwt(value, { nowSeconds: 1_700_000_200, clockSkewSeconds: 30 });
    expect(result.header).toMatchObject({ alg: "RS256", typ: "JWT" });
    expect(result.payload).toMatchObject({ sub: "user-1" });
    expect(result.signaturePresent).toBe(true);
    expect(result.temporalClaims.map((claim) => [claim.claim, claim.status])).toEqual([
      ["exp", "active"],
      ["nbf", "active"],
      ["iat", "past"],
    ]);
    expect(result.warnings.map((item) => item.code)).toContain("decode_does_not_verify_signature");
  });

  it("flags alg none, empty signatures, expiry, future nbf, and malformed claims", () => {
    const value = `${base64Url(JSON.stringify({ alg: "none" }))}.${base64Url(JSON.stringify({ exp: 10, nbf: 30, iat: "bad", aud: [] }))}.`;
    const result = inspectJwt(value, { nowSeconds: 20 });
    expect(result.signaturePresent).toBe(false);
    expect(result.warnings.map((item) => item.code)).toEqual(expect.arrayContaining([
      "decode_does_not_verify_signature",
      "alg_none",
      "empty_signature",
      "token_expired_by_browser_clock",
      "token_not_yet_valid_by_browser_clock",
      "invalid_iat",
      "invalid_aud",
    ]));
  });

  it("rejects JWE, invalid Base64URL, invalid UTF-8, non-object JSON, and oversized input", () => {
    expect(() => inspectJwt("a.b.c.d.e")).toThrow("encrypted_jwe_unsupported");
    expect(() => inspectJwt("a.b")).toThrow("invalid_jwt_segment_count");
    expect(() => inspectJwt("@@@.e30.sig")).toThrow("invalid_base64url");
    expect(() => inspectJwt("Zh.e30.sig")).toThrow("invalid_base64url");
    expect(() => inspectJwt("_w.e30.sig")).toThrow("invalid_utf8");
    expect(() => inspectJwt(`${base64Url("{}")}.${base64Url("{}")}.Zh`)).toThrow("invalid_base64url_signature");
    expect(() => inspectJwt(`${base64Url("[]")}.${base64Url("{}")}.sig`)).toThrow("non_object_jwt_header");
    expect(() => inspectJwt("a".repeat(65_537))).toThrow("jwt_too_large");
  });

  it("keeps suspicious JSON keys as data and enforces depth bounds", () => {
    const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":"text","prototype":"text"}') as unknown;
    const result = inspectJwt(token({ alg: "RS256" }, payload), { nowSeconds: 0 });
    expect(Object.prototype.hasOwnProperty.call(result.payload, "__proto__")).toBe(true);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();

    let nested: unknown = "leaf";
    for (let index = 0; index < 65; index += 1) nested = { nested };
    expect(() => inspectJwt(token({ alg: "RS256" }, nested), { nowSeconds: 0 })).toThrow("jwt_json_depth_limit");
    expect(() => inspectJwt(token({ alg: "RS256" }, { values: Array.from({ length: 5_001 }, () => 0) }), { nowSeconds: 0 })).toThrow("jwt_json_node_limit");
  });
});
