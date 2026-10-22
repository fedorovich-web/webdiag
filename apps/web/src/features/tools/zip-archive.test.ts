import { describe, expect, it } from "vitest";
import { createZipArchive } from "./zip-archive";

describe("createZipArchive", () => {
  it("creates a valid ZIP blob containing provided entries", async () => {
    const encoder = new TextEncoder();
    const blob = createZipArchive([
      { name: "test.txt", data: encoder.encode("Hello world") },
      { name: "sub/sample.json", data: encoder.encode('{"key":"value"}') },
    ]);

    expect(blob.type).toBe("application/zip");
    expect(blob.size).toBeGreaterThan(0);

    const buffer = new Uint8Array(await blob.arrayBuffer());
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });
});
