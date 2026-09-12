import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIBszCCAVmgAwIBAgIUY2VydGlmaWNhdGUtdGVzdC0wMDAwMDAwCgYIKoZI
zj0EAwIwJjEUMBIGA1UEAwwLZXhhbXBsZS5jb20xDjAMBgNVBAoMBVdlYkRp
YWcwHhcNMjYwMTAxMDAwMDAwWhcNMjcwMTAxMDAwMDAwWjAmMRQwEgYDVQQD
DAtleGFtcGxlLmNvbTEOMAwGA1UECgwFV2ViRGlhZzBZMBMGByqGSM49AgEG
CCqGSM49AwEHA0IABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACjUzBRMB0GA1UdDgQW
BBQAAAAAAAAAAAAAAAAAAAAAAAAAADAfBgNVHSMEGDAWgBQAAAAAAAAAAAAA
AAAAAAAAAAAAADAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUC
IQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiEAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAA=
-----END CERTIFICATE-----`;

test.describe("PEM certificate viewer", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;
  test.beforeEach(async ({ page }) => { assertBrowserClean = installBrowserGuard(page); });
  test.afterEach(async ({}, testInfo) => { await assertBrowserClean(testInfo); });

  test("stays local and rejects private keys", async ({ page }) => {
    const writes: string[] = [];
    page.on("request", request => { if (request.method() !== "GET") writes.push(request.url()); });
    await page.goto("/en/tools/pem-certificate-viewer");
    await expect(page.getByRole("heading", { level: 1, name: "PEM X.509 Certificate Viewer" })).toBeVisible();
    await page.getByLabel("Paste one or more PEM certificates").fill(CERTIFICATE);
    await page.getByRole("button", { name: "Inspect certificates" }).click();
    await expect(page.locator(".pem-certificate-tool .form-error")).toHaveCount(1); // malformed bounded fixture is rejected safely
    await page.getByLabel("Paste one or more PEM certificates").fill("-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----");
    await page.getByRole("button", { name: "Inspect certificates" }).click();
    await expect(page.locator(".pem-certificate-tool .form-error")).toBeVisible();
    expect(writes).toEqual([]);
  });
});
