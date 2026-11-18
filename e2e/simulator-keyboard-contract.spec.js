import { test, expect, goToSpace } from "./navigation.js";
import { checkView } from "./ui-layout.js";

test("la vista del Simulador cabe en los tamaños y temas de la fase", async ({ page }) => {
  test.setTimeout(60_000);
  const passes = [
    ["dark", { width: 390, height: 844 }],
    ["dark", { width: 1366, height: 768 }],
    ["dark", { width: 1920, height: 1080 }],
    ["light", { width: 390, height: 844 }],
    ["light", { width: 1366, height: 768 }]
  ];
  for (const [theme, size] of passes) {
    await page.setViewportSize(size);
    await page.goto("/");
    await goToSpace(page, "simulator");
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await checkView(page, `simulator ${theme} ${size.width}×${size.height}`, {
      noSolapar: [["#hd", "#main-content"]],
      sinCorte: ["#hd"]
    });
  }
});

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
