import { describe, expect, it } from "vitest";
import { themeStorageKey } from "../lib/theme";
import { getThemeBootstrapScript } from "./theme-bootstrap-script";

type StorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function executeBootstrap(stored: string | null, failStorage = false) {
  const writes: Array<[string, string]> = [];
  const localStorage: StorageMock = {
    getItem(key) {
      if (failStorage) throw new Error("storage blocked");
      expect(key).toBe(themeStorageKey);
      return stored;
    },
    setItem(key, value) {
      if (failStorage) throw new Error("storage blocked");
      writes.push([key, value]);
    },
  };
  const document = { body: { dataset: {} as Record<string, string> } };
  const run = new Function("localStorage", "document", getThemeBootstrapScript());
  run(localStorage, document);
  return { theme: document.body.dataset.theme, writes };
}

describe("theme bootstrap", () => {
  it("uses light on a first visit without writing storage", () => {
    expect(executeBootstrap(null)).toEqual({ theme: "light", writes: [] });
  });

  it("applies a stored dark theme before hydration", () => {
    expect(executeBootstrap("dark")).toEqual({ theme: "dark", writes: [] });
  });

  it("migrates legacy and invalid values to light", () => {
    expect(executeBootstrap("automatic")).toEqual({
      theme: "light",
      writes: [[themeStorageKey, "light"]],
    });
    expect(executeBootstrap("sepia")).toEqual({
      theme: "light",
      writes: [[themeStorageKey, "light"]],
    });
  });

  it("falls back to light when storage is unavailable", () => {
    expect(executeBootstrap("dark", true)).toEqual({ theme: "light", writes: [] });
  });

  it("does not consult operating-system color preferences", () => {
    expect(getThemeBootstrapScript()).not.toContain("matchMedia");
    expect(getThemeBootstrapScript()).not.toContain("prefers-color-scheme");
  });
});
