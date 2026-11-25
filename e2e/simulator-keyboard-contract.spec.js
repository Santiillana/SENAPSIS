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

test("tras entrar por la pestaña Simulador, las flechas recorren el algoritmo y no cambian de sección",async({page})=>{
  await page.goto("/");
  await goToSpace(page,"simulator");
  await expect(page.locator("#flow-diagram-container")).toBeFocused();
  await expect(page.locator("body")).toHaveAttribute("data-active-space","simulator");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#timeline-count")).toHaveText(/2 \/ \d+/);
  await expect(page.locator("body")).toHaveAttribute("data-active-space","simulator");
  await expect(page.locator('#primary-nav [data-space="simulator"]')).toHaveAttribute("aria-current","page");
});

test("el diagrama encuadra la figura inicial al entrar y al cerrar la pantalla previa", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");
  await goToSpace(page, "simulator", { dismissSimulatorIntro: false });
  await expect(page.locator("#simulator-intro")).toBeVisible();
  await page.locator("#simulator-reveal").click();
  const geometry = await page.evaluate(() => {
    const node = document.querySelector("#flow-diagram-container .diagram-node.is-active");
    const stage = document.querySelector("#diagram-stage");
    const free = () => {
      const stageBox = stage.getBoundingClientRect();
      const leftPanel = document.querySelector("#PL").getBoundingClientRect();
      const rightPanel = document.querySelector("#RC").getBoundingClientRect();
      const dock = document.querySelector("#dock").getBoundingClientRect();
      return {
        left: Math.max(stageBox.left + 18, leftPanel.right + 16),
        right: Math.min(stageBox.right - 18, rightPanel.left - 16),
        top: stageBox.top + 12,
        bottom: Math.min(stageBox.bottom - 18, dock.top - 14)
      };
    };
    const nodeBox = node.getBoundingClientRect(), area = free();
    return {
      nodeX: nodeBox.left + nodeBox.width / 2,
      nodeY: nodeBox.top + nodeBox.height / 2,
      areaX: (area.left + area.right) / 2,
      areaY: (area.top + area.bottom) / 2,
      cameraTarget: stage.dataset.cameraTarget
    };
  });
  expect(Math.abs(geometry.nodeX - geometry.areaX)).toBeLessThan(36);
  expect(Math.abs(geometry.nodeY - geometry.areaY)).toBeLessThan(36);
  expect(geometry.cameraTarget).toBeTruthy();
});
