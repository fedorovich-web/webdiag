import { expect, type Page, type TestInfo } from "@playwright/test";

export function installBrowserGuard(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      errors.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "unknown";
    if (reason.includes("ERR_ABORTED") || reason.includes("NS_BINDING_ABORTED")) return;
    errors.push(`requestfailed: ${request.method()} ${request.url()} — ${reason}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });

  return async (testInfo: TestInfo) => {
    if (errors.length > 0) {
      await testInfo.attach("browser-errors", {
        body: Buffer.from(errors.join("\n")),
        contentType: "text/plain",
      });
    }
    expect(errors, "Browser console, runtime, request, and HTTP errors").toEqual([]);
  };
}
