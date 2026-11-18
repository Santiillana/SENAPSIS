import { test, expect, goToSpace } from "./navigation.js";

async function openBuilder(page) {
  await page.goto("/");
  await goToSpace(page, "simulator");
  await goToSpace(page, "lab");
  await page.locator('[data-lab-activity="build-diagram"]').click();
  await page.locator("#lab-prepare-play").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
}

test("Mi progreso refleja el catálogo completo y conserva el avance después de recargar", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("traza:v2:learn", JSON.stringify({
      version: 2,
      completed: ["algorithm", "reading"],
      current: "terminals",
      screen: 0
    }));
  });
  await page.reload();
  await goToSpace(page, "learn");
  await page.locator("#learn-open-progress").click();

  await expect(page.locator("#learn-progress-total")).toHaveText("2 de 40 lecciones completadas");
  await expect(page.locator("#learn-progress-percent")).toHaveText("5%");
  await expect(page.locator("#learn-progress-ring")).toHaveAttribute("aria-valuemax", "40");
  await expect(page.locator("#learn-progress-ring")).toHaveAttribute("aria-valuenow", "2");

  await page.reload();
  await goToSpace(page, "learn");
  await page.locator("#learn-open-progress").click();
  await expect(page.locator("#learn-progress-total")).toHaveText("2 de 40 lecciones completadas");
});

test("Inicio abre Mi ficha y Aprende, y la navegación compartida ofrece sus espacios", async ({ page }) => {
  await page.goto("/");
  await page.locator('.home-card[data-home-section="ficha"]').click();
  await expect(page.locator('[data-view="hoy"]')).toBeVisible();
  await page.locator('.brand[data-go="home"]').click();
  await page.locator('.home-card[data-home-section="aprende"]').click();
  await expect(page.locator('[data-view="learn"]')).toBeVisible();
  for (const space of ["exercises", "simulator", "lab"]) {
    await goToSpace(page, space);
    await expect(page.locator('[data-view="' + space + '"]')).toBeVisible();
  }
});

test("el Constructor deshace y rehace con atajos y elimina la rama futura al crear un cambio nuevo", async ({ page }) => {
  await openBuilder(page);
  await page.locator('[data-builder-preset="empty"]').click();

  const cards = page.locator("#builder-canvas-list .builder-node-card");
  const baseline = await cards.count();
  const undo = page.locator("#builder-undo");
  const redo = page.locator("#builder-redo");
  const addProcess = page.locator('#lab-builder-stage [data-add-node="process"]');

  await expect(redo).toBeDisabled();
  await expect(undo).toHaveAttribute("aria-keyshortcuts", "Control+Z Meta+Z");
  await expect(redo).toHaveAttribute("aria-keyshortcuts", "Control+Shift+Z Control+Y Meta+Shift+Z Meta+Y");

  await addProcess.click();
  await expect(cards).toHaveCount(baseline + 1);
  await expect(undo).toBeEnabled();

  await page.locator("#lab-builder-stage").press("Control+z");
  await expect(cards).toHaveCount(baseline);
  await expect(redo).toBeEnabled();

  await addProcess.click();
  await expect(cards).toHaveCount(baseline + 1);
  await expect(redo).toBeDisabled();

  await page.locator("#lab-builder-stage").press("Control+z");
  await expect(cards).toHaveCount(baseline);
  await page.locator("#lab-builder-stage").press("Control+Shift+z");
  await expect(cards).toHaveCount(baseline + 1);
});

test("el historial del Constructor conserva exactamente los últimos 60 estados y permite recorrerlos", async ({ page }) => {
  test.setTimeout(90000);
  await openBuilder(page);
  await page.locator('[data-builder-preset="empty"]').click();

  const cards = page.locator("#builder-canvas-list .builder-node-card");
  const baseline = await cards.count();
  const undo = page.locator("#builder-undo");
  const redo = page.locator("#builder-redo");
  const addProcess = page.locator('#lab-builder-stage [data-add-node="process"]');

  for (let index = 0; index < 65; index++) {
    await addProcess.click();
  }
  await expect(cards).toHaveCount(baseline + 65);
  await expect(undo).toBeEnabled();

  for (let index = 0; index < 59; index++) {
    await undo.click();
  }

  // El historial guarda 60 snapshots: el más antiguo aún alcanzable es el sexto agregado.
  await expect(cards).toHaveCount(baseline + 6);
  await expect(undo).toBeDisabled();
  await expect(redo).toBeEnabled();

  for (let index = 0; index < 59; index++) {
    await redo.click();
  }

  await expect(cards).toHaveCount(baseline + 65);
  await expect(redo).toBeDisabled();
});
