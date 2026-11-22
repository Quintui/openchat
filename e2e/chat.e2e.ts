import { expect, test } from "@playwright/test";

test("chat loads and renders the composer", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What can I help with?" })).toBeVisible();

  const composer = page.getByPlaceholder("Ask anything");
  await expect(composer).toBeEditable();
  await composer.click();
  await composer.fill("Hello from the CI smoke test");
  await expect(composer).toHaveValue("Hello from the CI smoke test");

  const path = testInfo.outputPath("chat.png");
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach("chat", { path, contentType: "image/png" });
});
