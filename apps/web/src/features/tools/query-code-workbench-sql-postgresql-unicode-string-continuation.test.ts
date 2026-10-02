import { describe, expect, it } from "vitest";
import { formatSql } from "./query-code-workbench";

describe("PostgreSQL Unicode string continuation", () => {
  it.each([
    ["Unicode escape string", "select U&'d\\0061'\n'ta';", "SELECT U&'d\\0061'\n'ta';"],
    ["lowercase Unicode escape prefix", "select u&'d\\0061'\n'ta';", "SELECT u&'d\\0061'\n'ta';"],
    ["CRLF with horizontal whitespace", "select U&'d\\0061'  \r\n   'ta';", "SELECT U&'d\\0061'\n'ta';"],
    ["UESCAPE clause", "select U&'d!0061'\n'ta' UESCAPE '!';", "SELECT U&'d!0061'\n'ta' UESCAPE '!';"],
  ])("preserves the significant line break for %s", (_label, input, expected) => {
    expect(formatSql(input).output).toBe(expected);
  });

  it("does not invent a continuation for same-line adjacent Unicode strings", () => {
    expect(formatSql("select U&'d\\0061'   'ta';").output).toBe("SELECT U&'d\\0061' 'ta';");
  });

  it("does not treat Unicode quoted identifiers as string continuation candidates", () => {
    expect(formatSql('select U&"d\\0061"\n"ta";').output).toBe('SELECT U&"d\\0061" "ta";');
  });

  it("does not apply PostgreSQL Unicode continuation preservation in MySQL mode", () => {
    expect(formatSql("select U&'d\\0061'\n'ta';", { sqlDialect: "mysql" }).output).toBe("SELECT U&'d\\0061' 'ta';");
  });
});
