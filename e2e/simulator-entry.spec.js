import { test, expect, goToSpace } from "./navigation.js";

test("el simulador abre el catálogo y permite llegar al reproductor matemático",async({page})=>{
  await page.goto("/");await goToSpace(page,"simulator");
  await expect(page.locator("#simulator-entry")).toBeVisible();
  await expect(page.locator("#simulator-entry [data-sim-competence]")).toHaveCount(5);
  await expect(page.locator(".simulator-grid")).toBeHidden();
  await page.locator('#simulator-entry [data-sim-competence="matematicas"]').click();
  await expect(page.locator('#simulator-entry [data-sim-theme="racionales"]')).toBeVisible();
  await page.locator('#simulator-entry [data-sim-theme="racionales"]').click();
  await expect(page.locator('#simulator-entry [data-sim-exercise="MAT-RAC-01"]')).toBeVisible();
  await page.locator('#simulator-entry [data-sim-exercise="MAT-RAC-01"]').click();
  await expect(page.locator("#math-player")).toBeVisible();
  await expect(page.locator("#math-player h2")).toContainText("Racionales");
  await expect(page.locator("#simulator-entry")).toBeHidden();
});

test("el catálogo dirige los temas de fuentes y flujo a sus simuladores",async({page})=>{
  await page.goto("/");await goToSpace(page,"simulator");
  await page.locator('#simulator-entry [data-sim-competence="establecer-requisitos"]').click();
  await page.locator('#simulator-entry [data-sim-theme="fuentes-informacion"]').click();
  await page.locator('#simulator-entry [data-sim-exercise]').first().click();
  await expect(page.locator("#source-simulator")).toBeVisible();
  await expect(page.locator("#source-simulator .source-sim-toolbar h2")).toBeVisible();
  await page.locator('#primary-nav [data-space="simulator"]').click();
  await expect(page.locator("#simulator-entry")).toBeVisible();
  await page.locator('#simulator-entry [data-sim-competence="evaluar-requisitos"]').click();
  await page.locator('#simulator-entry [data-sim-theme="diagramas-flujo"]').click();
  await expect(page.locator('#simulator-entry [data-sim-exercise]')).toHaveCount(45);
  await page.locator('#simulator-entry [data-sim-exercise]').nth(22).click();
  await expect(page.locator("#simulator-entry")).toBeHidden();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Fibonacci");
});
