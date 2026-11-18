import { test, expect, goToSpace } from "./navigation.js";

const spaces = ["learn", "exercises", "simulator", "lab", "hoy", "clases", "biblioteca"];

test("la cabecera compartida conserva su posición y navegación en todas las vistas", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  let reference;
  for (const space of spaces) {
    await goToSpace(page, space);
    await expect(page.locator("#hd .section-switch")).toBeVisible();
    await expect(page.locator('#primary-nav [data-space="' + space + '"]')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height };
      };
      return { switcher: rect(".section-switch"), subnav: rect("#primary-nav") };
    });
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
