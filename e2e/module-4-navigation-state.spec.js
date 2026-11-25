import { test, expect, goToSpace } from "./navigation.js";

async function enterApp(page, url = "/") {
  await page.goto(url);
  const enter = page.locator("#brand-enter");
  if (await enter.isVisible()) await enter.click();
  await expect(page.locator("#brand-splash")).toHaveCount(0);
}

test("Lecciones y Ejercicios comparten tema, URL, recarga e historial", async ({ page }) => {
  await enterApp(page);
  await goToSpace(page, "learn");
  await page.locator('[data-learn-competence="evaluar-requisitos"]').click();
  await page.locator('[data-topic-open="diagramas-flujo"]').click();
  await expect(page).toHaveURL(/pestana=lecciones.*competencia=evaluar-requisitos.*tema=diagramas-flujo/);
  const lessonId = await page.locator("#lesson-catalog [data-lesson-id].is-selected").getAttribute("data-lesson-id");

  await page.locator('#primary-nav [data-space="exercises"]').click();
  await expect(page.locator("#exercise-topic-workspace")).toBeVisible();
  await expect(page.locator("#exercise-topic-title")).toHaveText("Diagramas de flujo");
  await expect(page.locator(".exercise-topic-header .learn-topic-crumb")).toContainText("‹ Competencias›Evaluación de requisitos›Diagramas de flujo");
  await expect(page).toHaveURL(/pestana=ejercicios.*tema=diagramas-flujo.*ejercicio=flujo%3A/);

  await page.locator('#primary-nav [data-space="learn"]').click();
  await expect(page.locator("#learn-topic-title")).toHaveText("Diagramas de flujo");
  await expect(page.locator('#lesson-catalog [data-lesson-id="'+lessonId+'"]').first()).toHaveClass(/is-selected/);
  const copiedUrl = page.url();
  await page.reload();
  const enter = page.locator("#brand-enter");
  if (await enter.isVisible()) await enter.click();
  await expect(page.locator("#learn-topic-title")).toHaveText("Diagramas de flujo");
  await expect(page.locator('#lesson-catalog [data-lesson-id="'+lessonId+'"]').first()).toHaveClass(/is-selected/);
  expect(page.url()).toBe(copiedUrl);

  await page.goBack();
  await expect(page.locator("#exercise-topic-title")).toHaveText("Diagramas de flujo");
  await expect(page).toHaveURL(/pestana=ejercicios/);
});

test("un enlace directo abre el tema, pestaña e ítem de ejercicio solicitados", async ({ page }) => {
  await enterApp(page, "/?pestana=ejercicios&competencia=evaluar-requisitos&tema=diagramas-flujo&ejercicio=flujo%3A2");
  await expect(page.locator("#exercise-topic-title")).toHaveText("Diagramas de flujo");
  await expect(page.locator('#exercise-grid [data-select-exercise="2"]')).toHaveClass(/is-selected/);
  await expect(page.locator("#exercise-detail")).toContainText("Resta de dos números");
});
