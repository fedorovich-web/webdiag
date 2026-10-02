import { describe, expect, it } from "vitest";
import { AccountClientError } from "./account-client";
import { accountErrorMessage } from "./account-messages";

describe("account error presentation", () => {
  it("maps AI failures to safe localized product copy", () => {
    const error = new AccountClientError("Raw provider message must stay hidden", {
      status: 402,
      code: "ai_insufficient_credits",
    });
    expect(accountErrorMessage("ru", error)).toBe("Недостаточно кредитов для запуска AI-инструмента.");
    expect(accountErrorMessage("en", error)).toBe("There are not enough credits to run this AI tool.");
  });

  it("never displays raw backend text for unknown error codes", () => {
    const error = new AccountClientError("Secret internal upstream detail", {
      status: 500,
      code: "unknown_private_error",
    });
    expect(accountErrorMessage("ru", error)).toBe("Не удалось выполнить запрос. Повторите попытку.");
    expect(accountErrorMessage("en", error)).toBe("The request failed. Try again.");
    expect(accountErrorMessage("en", error)).not.toContain("Secret internal upstream detail");
  });
});
