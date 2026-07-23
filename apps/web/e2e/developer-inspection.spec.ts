import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const sampleJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlci0xMjMiLCJhdWQiOiJ3ZWJkaWFnIiwiZXhwIjoyMDUwMDAwMDAwLCJpYXQiOjE3MDAwMDAwMDB9.c2lnbmF0dXJl";

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

test.describe("local developer inspection workbenches", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("cron workbench validates the dialect and previews bounded UTC occurrences", async ({ page }) => {
    await page.goto("/en/tools/cron-expression-workbench");
    await expect(page.getByRole("heading", { level: 1, name: "Cron Expression Workbench for Five-Field Schedules" })).toBeVisible();

    const inspectButton = page.getByRole("button", { name: "Inspect and preview" });
    expect((await inspectButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await inspectButton.click();
    await expect(page.getByRole("list", { name: "Next UTC occurrences" }).locator("li")).toHaveCount(10);
    await expect(page.getByText("Preview time: UTC", { exact: false })).toBeVisible();

    await page.getByLabel("Five-field expression").fill("0 0 L * *");
    await inspectButton.click();
    await expect(page.locator(".form-error")).toContainText("outside the supported five-field Unix cron dialect");
  });

  test("JWT inspection stays local, warns that decode is not verify, and does not persist user input", async ({ page }) => {
    const sentBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) sentBodies.push(body);
    });

    await page.goto("/tools/jwt-inspection-lab");
    const tokenInput = page.getByLabel("Compact JWT/JWS");
    await expect(tokenInput).toHaveValue(sampleJwt);

    const algNone = `${base64Url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${base64Url(JSON.stringify({ sub: "test", exp: 2_050_000_000 }))}.`;
    await tokenInput.fill(algNone);
    await page.getByRole("button", { name: "Декодировать и проверить claims" }).click();

    await expect(page.getByText("Декодирование не подтверждает подпись", { exact: false })).toBeVisible();
    await expect(page.locator(".metadata-tool-checks").getByText("alg=none", { exact: false })).toBeVisible();
    await expect(page.locator(".result-card").filter({ hasText: "Header" })).toContainText('"alg": "none"');
    expect(sentBodies.join("\n")).not.toContain(algNone);
    expect(page.url()).not.toContain(algNone);

    await page.reload();
    await expect(tokenInput).toHaveValue(sampleJwt);
    await expect(page.locator(".tool-panel").last().locator("pre.output")).toHaveText("—");
  });
});

