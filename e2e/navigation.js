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

export async function goToSpace(page, space, options = {}) {
  if (space === "simulator" && options.dismissSimulatorIntro !== false) {
    await page.evaluate(() => {
      try {
        let preference = { skip: false, seen: [] };
        preference = JSON.parse(localStorage.getItem("traza:v1:simulator-intro") || "null") || preference;
        localStorage.setItem("traza:v1:simulator-intro", JSON.stringify({ ...preference, skip: true }));
      }
      catch { /* La preferencia de pruebas parte de un valor válido. */ }
    });
  }
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
  if (space === "simulator" && options.dismissSimulatorIntro !== false) {
    const reveal = page.locator("#simulator-reveal");
    if (await reveal.isVisible()) await reveal.click();
  }
}

export async function dismissSimulatorIntro(page) {
  const reveal = page.locator("#simulator-reveal");
  if (await reveal.isVisible()) await reveal.click();
}

export async function openDiagramLessons(page) {
  await goToSpace(page, "learn");
  const card = page.locator('[data-topic-open="diagramas-flujo"]');
  if (await card.isVisible()) await card.click();
}
