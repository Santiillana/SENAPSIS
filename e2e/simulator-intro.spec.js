import { test, expect, goToSpace } from "./navigation.js";
import { checkView } from "./ui-layout.js";

test("la pantalla Intenta primero acompaña el ejercicio y respeta el modo presentación", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "simulator", { dismissSimulatorIntro: false });
  const intro = page.locator("#simulator-intro");
  await expect(intro).toBeVisible();
  await expect(intro).toContainText("Intenta primero");
  await expect(intro.locator("li")).toHaveCount(3);
  await expect(page.locator("#simulator-intro-data")).toContainText("Datos de ejemplo");
  for (const size of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(size);
    const bounds = await intro.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(size.width + 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(size.height + 1);
  }
  await page.locator("#simulator-reveal").click();
  await expect(intro).not.toBeVisible();

  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#simulator-controls-panel [data-exercise-shortcut='2']").evaluate(button => button.click());
  await expect(intro).toBeVisible();
  await page.locator("#simulator-intro-skip-checkbox").check();
  await page.locator("#simulator-reveal").click();
  await page.reload();
  await goToSpace(page, "simulator", { dismissSimulatorIntro: false });
  await expect(intro).not.toBeVisible();
});
