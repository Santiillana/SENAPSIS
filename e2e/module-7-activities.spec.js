import { test, expect } from "@playwright/test";
import { goToSpace } from "./navigation.js";

test("Actividades permite consultar, filtrar y registrar seguimiento personal", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "actividades");
  await expect(page.locator("#view-actividades #actividades-title")).toHaveText("Actividades");
  await expect(page.locator("#ficha-activity-list [data-activity-select]")).toHaveCount(4);
  await expect(page.locator("#ficha-activity-detail")).toContainText("Contenidos relacionados");
  await expect(page.locator("#ficha-activity-detail [data-go=learn]")).toBeVisible();
  await page.locator("#activity-search").fill("ciclos");
  await expect(page.locator("#ficha-activity-list [data-activity-select]")).toHaveCount(1);
  await expect(page.locator("#ficha-activity-detail")).toContainText("Practicar ciclos");
  await page.locator("[data-activity-clear]").click();

  await page.locator('[data-activity-select="actividad-comparaciones"]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("Aplicar operadores de comparación");
  for (const field of ["subida", "enviada", "confirmada"]) {
    await page.locator('[data-checklist-field="' + field + '"]').check();
  }
  await expect(page.locator("#ficha-activity-detail .ficha-state")).toContainText("Entregada");

  await page.locator("#activity-notes").fill("Revisar los ejemplos antes de enviar.");
  await page.locator("#activity-notes-form button[type=submit]").click();
  await expect(page.locator("#activity-notes")).toHaveValue("Revisar los ejemplos antes de enviar.");

  await page.locator('#activity-result-form select[name="juicio"]').selectOption("no_aprobado");
  await page.locator('#activity-result-form textarea[name="correccion"]').fill("Corregir la condición del ejercicio.");
  await page.locator('#activity-result-form button[type=submit]').click();
  await page.locator('[data-activity-view="culminadas"]').click();
  await page.locator('[data-activity-select="actividad-comparaciones"]').click();
  await expect(page.locator("#ficha-activity-detail .ficha-state")).toContainText("Por corregir");
  await expect(page.locator("#activity-result-form button[type=submit]")).toBeDisabled();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("traza:v4:ficha")));
  expect(saved.actividades["actividad-comparaciones"].intentos).toHaveLength(1);
  expect(saved.actividades["actividad-comparaciones"].notas).toBe("Revisar los ejemplos antes de enviar.");
});

test("Actividades permite registrar una aprobación y bloquea el checklist", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "actividades");
  await page.locator('[data-activity-select="actividad-comparaciones"]').click();
  await page.locator('[data-checklist-field="confirmada"]').check();
  await expect(page.locator('#activity-result-form button[type=submit]')).toBeEnabled();
  await page.locator('#activity-result-form select[name="juicio"]').selectOption("aprobado");
  await page.locator('#activity-result-form button[type=submit]').click();
  await page.locator('[data-activity-view="culminadas"]').click();
  await page.locator('[data-activity-select="actividad-comparaciones"]').click();
  await expect(page.locator("#ficha-activity-detail .ficha-state")).toContainText("Aprobada");
  await expect(page.locator('[data-checklist-field="confirmada"]')).toBeDisabled();
});

test("Actividades muestra el aviso de demostración y la sección de documentos sin fingir archivos", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "actividades");
  await expect(page.locator("#view-actividades .ficha-demo-notice")).toContainText("Contenido de demostración");
  await expect(page.locator("#ficha-activity-detail")).toContainText("Documentos y materiales");
  await expect(page.locator("#ficha-activity-detail")).toContainText("Sin documentos publicados");
});

test("Actividades se adapta a móvil y no sobrescribe almacenamiento dañado", async ({ page }) => {
  for (const width of [760, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await goToSpace(page, "actividades");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "desbordamiento de Actividades en " + width).toBeLessThanOrEqual(1);
  }
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("traza:v4:ficha", "{dañado"));
  await page.reload();
  await goToSpace(page, "actividades");
  await expect(page.locator("#ficha-activity-detail .ficha-storage-error")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("traza:v4:ficha"))).toBe("{dañado");
});
