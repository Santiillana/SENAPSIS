import { test, expect, goToSpace } from "./navigation.js";

const spaces = [
  "home",
  "hoy",
  "clases",
  "actividades",
  "biblioteca",
  "learn",
  "exercises",
  "simulator",
  "lab"
];

test("auditoría integral: los nueve espacios abren sin errores JavaScript ni fallos de recursos", async ({ page }) => {
  await page.route("**/api/v1/version",route=>route.fulfill({json:{version:0,updatedAt:null}}));
  const pageErrors = [];
  const consoleErrors = [];
  const failedAssets = [];

  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", response => {
    const type = response.request().resourceType();
    if (["script", "stylesheet"].includes(type) && response.status() >= 400) {
      failedAssets.push(response.status() + " " + response.url());
    }
  });

  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  for (const space of spaces) {
    await goToSpace(page, space);
    await expect(page.locator('[data-view="' + space + '"]')).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedAssets).toEqual([]);
});

test("los nueve espacios no generan desbordamiento horizontal en los cuatro breakpoints", async ({ page }) => {
  test.setTimeout(60000);
  const widths = [390, 768, 1366, 1920];

  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 768 ? 844 : 900 });
    await page.goto("/");

    for (const space of spaces) {
      await goToSpace(page, space);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, space + " en viewport " + width + "px").toBeLessThanOrEqual(1);
    }
  }
});

test("la navegación por teclado recorre los espacios visibles sin activar los ocultos", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "learn");

  const learn = page.locator('#primary-nav [data-space="learn"]');
  await learn.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('#primary-nav [data-space="exercises"]')).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("End");
  await expect(page.locator('#primary-nav [data-space="simulator"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
});

test("la aplicación mantiene navegación y preferencias cuando el almacenamiento local está bloqueado", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked by browser policy", "SecurityError");
      }
    });
  });

  await page.goto("/");
  await goToSpace(page, "learn");
  await page.locator('[data-action="toggle-theme"]').click();
  await page.locator('[data-action="toggle-motion"]').click();
  await goToSpace(page, "exercises");
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
  expect(pageErrors).toEqual([]);
});
