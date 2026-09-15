import { describe, expect, it } from "vitest";
import { formatGraphql } from "./query-code-workbench";

describe("GraphQL source character validation", () => {
  it("rejects unpaired UTF-16 surrogates while accepting supplementary scalar values", () => {
    const supplementaryScalar = String.fromCodePoint(0x1F4A9);
    expect(() => formatGraphql(`query Q { field(value: "${supplementaryScalar}") } # ${supplementaryScalar}`)).not.toThrow();

    const leadingSurrogate = String.fromCharCode(0xD800);
    const trailingSurrogate = String.fromCharCode(0xDFFF);
    for (const invalidSource of [
      `query Q { field(value: "${leadingSurrogate}") }`,
      `query Q { field(value: """${trailingSurrogate}""") }`,
      `# ${leadingSurrogate}\nquery Q { field }`,
    ]) {
      expect(() => formatGraphql(invalidSource)).toThrow(/Unicode scalar value/iu);
    }
  });
});
