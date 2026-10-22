import { afterEach, expect, it, vi } from "vitest";
import { writeClipboardText } from "./clipboard";

afterEach(() => vi.unstubAllGlobals());

it("reports failure when clipboard is missing or denies a write", async () => {
  vi.stubGlobal("navigator", {});
  expect(await writeClipboardText("example")).toBe(false);
  vi.stubGlobal("navigator", { clipboard: { writeText: async () => { throw new DOMException("Denied", "NotAllowedError"); } } });
  expect(await writeClipboardText("example")).toBe(false);
});

it("reports success only after the requested text is written", async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let copied = "";
  vi.stubGlobal("navigator", { clipboard: { writeText: async (value: string) => { await pending; copied = value; } } });
  let completed = false;
  const attempt = writeClipboardText("exact source text").then((result) => { completed = true; return result; });
  await Promise.resolve();
  expect(completed).toBe(false);
  release();
  expect(await attempt).toBe(true);
  expect(copied).toBe("exact source text");
});
