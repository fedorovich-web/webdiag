import { describe, expect, it } from "vitest";
import { publicReleaseEnabled } from "./release";
describe("release setting", () => { it("is disabled by default", () => { expect(publicReleaseEnabled).toBe(false); }); });
