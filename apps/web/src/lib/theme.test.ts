import { describe, expect, it } from "vitest";
import { isThemePreference, normalizeTheme, themes } from "./theme";

describe("theme preference", () => {
  it("exposes only explicit light and dark themes", () => {
    expect(themes).toEqual(["light", "dark"]);
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("automatic")).toBe(false);
    expect(isThemePreference("auto")).toBe(false);
  });

  it.each([
    [undefined, "light"],
    [null, "light"],
    ["", "light"],
    ["automatic", "light"],
    ["sepia", "light"],
    ["light", "light"],
    ["dark", "dark"],
  ] as const)("normalizes %j to %s", (stored, expected) => {
    expect(normalizeTheme(stored)).toBe(expected);
  });
});
