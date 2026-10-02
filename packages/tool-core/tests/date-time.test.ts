import { describe, expect, it } from "vitest";
import { isoToUnixSeconds } from "../src";

describe("ISO 8601 to Unix seconds", () => {
  it("accepts timestamps with an explicit UTC offset", () => {
    expect(isoToUnixSeconds("1970-01-01T00:00:00.000Z")).toBe(0);
    expect(isoToUnixSeconds("1970-01-01T01:00:00+01:00")).toBe(0);
    expect(isoToUnixSeconds("1969-12-31T23:59:59.999Z")).toBe(-1);
  });

  it("rejects local-time and non-ISO date strings", () => {
    expect(() => isoToUnixSeconds("1970-01-01T00:00:00")).toThrow(/ISO 8601/u);
    expect(() => isoToUnixSeconds("04 Dec 1995 00:12:00 GMT")).toThrow(/ISO 8601/u);
  });

  it("rejects impossible calendar dates instead of normalizing them", () => {
    expect(() => isoToUnixSeconds("2026-02-30T00:00:00Z")).toThrow(/ISO 8601/u);
    expect(() => isoToUnixSeconds("2025-02-29T00:00:00Z")).toThrow(/ISO 8601/u);
    expect(isoToUnixSeconds("2024-02-29T00:00:00Z")).toBe(1709164800);
  });
});
