import { expect, test } from "@playwright/test";

const variants = [
  {
    name: "RU",
    path: "/tools/image-format-converter",
    formatLabel: "Формат результата",
    convertLabel: "Конвертировать",
    downloadLabel: "Скачать изображение",
    error: "Этот браузер не поддерживает кодирование AVIF.",
  },
  {
    name: "EN",
    path: "/en/tools/image-format-converter",
    formatLabel: "Output format",
    convertLabel: "Convert",
    downloadLabel: "Download image",
    error: "This browser cannot encode AVIF.",
  },
] as const;

for (const variant of variants) {
  test(`${variant.name} does not present a Canvas PNG fallback as AVIF`, async ({ page }) => {
    await page.addInitScript(() => {
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function patchedToBlob(
        callback: BlobCallback,
        type?: string,
        quality?: number,
      ): void {
        originalToBlob.call(
          this,
          callback,
          type === "image/avif" ? "image/png" : type,
          quality,
        );
      };
    });

    await page.goto(variant.path);
    await page.locator('input[type="file"]').setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: variant.convertLabel }).click();
    await expect(page.getByRole("link", { name: variant.downloadLabel })).toBeVisible();

    await page.getByLabel(variant.formatLabel).selectOption("image/avif");
    await page.getByRole("button", { name: variant.convertLabel }).click();

    await expect(page.locator(".form-error")).toContainText(variant.error);
    await expect(page.getByRole("link", { name: variant.downloadLabel })).toHaveCount(0);
  });
}
