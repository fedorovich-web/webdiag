import { describe, expect, it } from "vitest";
import {
  jsonToYaml,
  validateAndFormatXml,
  validateJsonSchema,
  yamlToJson,
} from "./structured-data-utilities";

describe("JSON Schema bounded validator", () => {
  it("validates object properties, required values, and local refs", () => {
    const schema = JSON.stringify({
      $defs: { name: { type: "string", minLength: 2 } },
      type: "object",
      required: ["name"],
      properties: { name: { $ref: "#/$defs/name" }, active: { type: "boolean" } },
      additionalProperties: false,
    });
    const valid = validateJsonSchema('{"name":"WebDiag","active":true}', schema);
    expect(valid.valid).toBe(true);
    const invalid = validateJsonSchema('{"name":"W","extra":1}', schema);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.map((issue) => issue.keyword)).toEqual(expect.arrayContaining(["minLength", "additionalProperties"]));
  });

  it("reports unsupported keywords and rejects remote refs", () => {
    const unsupported = validateJsonSchema('{"name":"x"}', '{"type":"object","patternProperties":{"^x":{}},"format":"custom-format"}');
    expect(unsupported.unsupportedKeywords).toEqual(expect.arrayContaining(["patternProperties", "format:custom-format"]));
    const remote = validateJsonSchema('1', '{"$ref":"https://example.com/schema.json"}');
    expect(remote.valid).toBe(false);
    expect(remote.errors[0]?.keyword).toBe("$ref");
  });

  it("detects invalid schema keyword values", () => {
    const result = validateJsonSchema('[]', '{"type":"array","minItems":-1,"multipleOf":0}');
    expect(result.valid).toBe(false);
    expect(result.schemaErrors.map((issue) => issue.keyword)).toEqual(expect.arrayContaining(["minItems", "multipleOf"]));
  });

  it("checks supported IP formats conservatively", () => {
    expect(validateJsonSchema('"2001:db8::1"', '{"type":"string","format":"ipv6"}').valid).toBe(true);
    expect(validateJsonSchema('":"', '{"type":"string","format":"ipv6"}').valid).toBe(false);
  });
});

describe("safe YAML and JSON conversion", () => {
  it("parses mappings, sequences, nested objects, and scalars", () => {
    const result = yamlToJson("name: WebDiag\nfeatures:\n  - DNS\n  - RDAP\nconfig:\n  enabled: true\n  retries: 3");
    expect(JSON.parse(result.output)).toEqual({
      name: "WebDiag",
      features: ["DNS", "RDAP"],
      config: { enabled: true, retries: 3 },
    });
  });

  it("rejects duplicate keys and dangerous YAML features", () => {
    expect(() => yamlToJson("name: one\nname: two")).toThrow(/duplicate mapping key/u);
    expect(() => yamlToJson("base: &base value\ncopy: *base")).toThrow(/anchors, aliases, tags/u);
    expect(() => yamlToJson("message: |\n  line")).toThrow(/block scalar/u);
    expect(() => yamlToJson("---\nname: one\n---\nname: two")).toThrow(/multiple YAML documents/u);
  });

  it("emits safe YAML and round-trips through the supported parser", () => {
    const yaml = jsonToYaml('{"name":"true","items":[{"id":1,"label":"A: B"}],"empty":null}');
    expect(yaml.output).toContain('name: "true"');
    expect(JSON.parse(yamlToJson(yaml.output).output)).toEqual({
      name: "true",
      items: [{ id: 1, label: "A: B" }],
      empty: null,
    });
  });
});

describe("XML formatter and validator", () => {
  it("formats a well-formed XML document", () => {
    const result = validateAndFormatXml('<?xml version="1.0"?><root><item id="1">Text</item><empty/></root>', 2);
    expect(result.valid).toBe(true);
    expect(result.formatted).toContain("  <item id=\"1\">Text</item>");
    expect(result.elementCount).toBe(3);
    expect(result.attributeCount).toBe(1);
  });

  it("rejects mismatched tags, duplicate attributes, and DTD declarations", () => {
    expect(validateAndFormatXml("<root><item></root>").valid).toBe(false);
    expect(validateAndFormatXml('<root id="1" id="2"/>').errors.some((issue) => issue.message.includes("Duplicate attribute"))).toBe(true);
    const dtd = validateAndFormatXml('<!DOCTYPE root [<!ENTITY x "value">]><root>&x;</root>');
    expect(dtd.valid).toBe(false);
    expect(dtd.errors[0]?.keyword).toBe("doctype");
    expect(validateAndFormatXml('<![CDATA[outside]]><root/>').valid).toBe(false);
    expect(validateAndFormatXml('<root value="a<b"/>').valid).toBe(false);
    expect(validateAndFormatXml('<root>&#0;</root>').valid).toBe(false);
    expect(validateAndFormatXml('\uFEFF<?xml version="1.0"?><root/>').valid).toBe(true);
  });

  it("preserves mixed content compactly instead of injecting whitespace", () => {
    const result = validateAndFormatXml("<p>Hello <strong>world</strong>!</p>");
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe("<p>Hello <strong>world</strong>!</p>");
    expect(result.warnings).toContain("mixed-content-preserved-compactly");
  });
});
