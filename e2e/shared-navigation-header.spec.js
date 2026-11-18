import { test, expect, goToSpace } from "./navigation.js";
import { expectPageLayout } from "./ui-layout.js";

const spaces = ["learn", "exercises", "simulator", "lab", "hoy", "clases", "actividades", "biblioteca"];

test("la cabecera compartida conserva su posición y navegación en todas las vistas", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  let reference;
  for (const space of spaces) {
    await goToSpace(page, space);
    await expect(page.locator("#hd .section-switch")).toBeVisible();
    await expect(page.locator('#primary-nav [data-space="' + space + '"]')).toBeVisible();
    if (space === "learn") await expect(page.locator('#primary-nav [data-space="learn"] span:last-child')).toHaveText("Lecciones");

    const geometry = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        header: rect("#hd"),
        headerPosition: getComputedStyle(document.querySelector("#hd")).position,
        switcher: rect(".section-switch"),
        subnav: rect("#primary-nav")
      };
    });
    expect(geometry.header.height).toBeLessThanOrEqual(104);
    expect(geometry.headerPosition).toBe("sticky");
    if (reference) {
      expect(geometry.switcher).toEqual(reference.switcher);
      expect(geometry.subnav.x).toBe(reference.subnav.x);
      expect(geometry.subnav.width).toBe(reference.subnav.width);
      expect(geometry.subnav.height).toBe(reference.subnav.height);
      expect(Math.abs(geometry.subnav.y - reference.subnav.y)).toBeLessThanOrEqual(1);
    }
    else reference = geometry;
  }
});

test("la navegación del Simulador cabe en móvil y permite cambiar de sección", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await goToSpace(page, "simulator");

  await expect(page.locator("#hd .section-switch")).toBeVisible();
  await expect(page.locator('#primary-nav [data-space="simulator"]')).toBeVisible();
  const nav = page.locator("#primary-nav");
  const dimensions = await nav.evaluate(element => ({
    right: element.getBoundingClientRect().right,
    viewport: document.documentElement.clientWidth,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  }));
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.scrollWidth).toBeGreaterThanOrEqual(dimensions.clientWidth);

  await page.locator('[data-section-switch="ficha"]').click();
  await expect(page.locator('#primary-nav [data-space="hoy"]')).toBeVisible();
});

const layoutSizes = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 }
];
const layoutRoutes = ["home", "hoy", "clases", "actividades", "biblioteca", "learn", "exercises", "simulator", "lab"];

for (const size of layoutSizes) {
  for (const theme of ["light", "dark"]) {
    test(`layout completo sin desbordamiento: ${size.width}×${size.height}, tema ${theme}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/");
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      for (const route of layoutRoutes) {
        await goToSpace(page, route);
        await expectPageLayout(page, `${route} ${theme} ${size.width}×${size.height}`);
      }
    });
  }
}
