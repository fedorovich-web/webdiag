import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("SQL line comment termination", () => {
  it.each([
    ["line feed", "\n"],
    ["carriage return", "\r"],
    ["CRLF", "\r\n"],
  ])("terminates -- comments at %s line endings", (_label, lineEnding) => {
    const result = formatSql(`select 1 -- comment${lineEnding}select 2;`);
    expect(result.output).toContain("-- comment");
    expect(result.output).toContain("SELECT 2;");
  });
});
