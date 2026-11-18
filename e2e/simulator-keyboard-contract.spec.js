import { test, expect, goToSpace } from "./navigation.js";

test("los atajos del simulador funcionan sin clic previo y respetan el foco", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.evaluate(() => document.activeElement?.blur());
  const count = page.locator("#timeline-count");
  await expect(count).toHaveText(/1 \/ \d+/);

  await page.keyboard.press("ArrowRight");
  await expect(count).toHaveText(/2 \/ \d+/);
  await page.keyboard.press("ArrowDown");
  await expect(count).toHaveText(/3 \/ \d+/);
  await page.keyboard.press("ArrowUp");
  await expect(count).toHaveText(/2 \/ \d+/);

  await page.locator("#simulator-next").click();
  await expect(page.locator("#flow-diagram-container")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(count).toHaveText(/2 \/ \d+/);

  const beforeInput = await count.textContent();
  await page.locator("#simulator-inputs").focus();
  await page.keyboard.press("ArrowRight");
  await expect(count).toHaveText(beforeInput);

  await goToSpace(page, "learn");
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("body")).toHaveAttribute("data-active-space", "learn");
});
