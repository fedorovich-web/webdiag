import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import {
  ToolUserError,
  toolErrorMessage,
} from "./tool-error-presentation";

describe("tool error presentation", () => {
  it("localizes allowlisted API error codes and ignores their raw messages", () => {
    const apiError = Object.assign(new Error("provider host and secret details"), {
      code: "tool_api_timeout",
    });

    expect(toolErrorMessage("ru", apiError)).toBe(
      "Проверка заняла слишком много времени. Повторите попытку.",
    );
    expect(toolErrorMessage("en", apiError)).toBe(
      "The check took too long. Try again.",
    );
  });

  it("uses stable local codes without exposing arbitrary exception messages", () => {
    expect(toolErrorMessage("ru", new ToolUserError("image_open_failed"))).toBe(
      "Не удалось открыть изображение. Проверьте файл и повторите попытку.",
    );
    expect(toolErrorMessage("en", new Error("database password leaked"))).toBe(
      "The tool could not complete the request. Check the input and try again.",
    );
    expect(toolErrorMessage("ru", { code: "unknown_provider_error", message: "secret" })).toBe(
      "Инструмент не смог выполнить запрос. Проверьте данные и повторите попытку.",
    );
  });

  it("uses an explicit safe fallback code for deterministic workbench failures", () => {
    expect(toolErrorMessage("ru", new Error("parser internals"), "sql_format_failed")).toBe(
      "Не удалось отформатировать SQL. Проверьте синтаксис.",
    );
    expect(toolErrorMessage("en", null, "qr_generate_failed")).toBe(
      "Could not generate the QR code. Check the input and try again.",
    );
  });

  it("keeps raw exception messages out of tool component presentation", () => {
    const directory = new URL(".", import.meta.url);
    const offenders = readdirSync(directory)
      .filter((name) => name.endsWith(".tsx"))
      .filter((name) => {
        const source = readFileSync(new URL(name, directory), "utf8");
        return /(?:caught|error|reason) instanceof [A-Za-z]*Error\s*\?\s*(?:caught|error|reason)\.message/u.test(source);
      });

    expect(offenders).toEqual([]);
  });
});
