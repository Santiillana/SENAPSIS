import { test, expect } from "@playwright/test";
export { test, expect };

const FICHA_SPACES = new Set(["hoy", "clases", "actividades", "biblioteca"]);

async function activate(locator) {
  if (await locator.isVisible()) {
    await locator.click();
  } else {
    await locator.evaluate(element => element.click());
  }
}

export async function goToSpace(page, space) {
  const brand = page.locator('.brand[data-go="home"]');
  if (space === "home") {
    await activate(brand);
    return;
  }

  const section = FICHA_SPACES.has(space) ? "ficha" : "aprende";
  const current = await page.locator("html").getAttribute("data-section");
  const switcher = page.locator('[data-section-switch="' + section + '"]');

  if (current !== section) {
    if (!(await switcher.isVisible())) await activate(brand);
    await activate(switcher);
  }

  const target = page.locator('#primary-nav [data-space="' + space + '"]');
  await activate(target);
}

export async function openDiagramLessons(page) {
  await goToSpace(page, "learn");
  const card = page.locator('[data-topic-open="diagramas-flujo"]');
  if (await card.isVisible()) await card.click();
}
