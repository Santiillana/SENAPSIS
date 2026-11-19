import { test, expect, goToSpace } from "./navigation.js";

test.beforeEach(async({page})=>{await page.goto("/");});

test("el catálogo muestra los cinco ejercicios expertos sin revelar soluciones",async({page})=>{
  await goToSpace(page, "exercises");
  await page.locator('[data-exercise-difficulty="4"]').click();
  await expect(page.locator("[data-select-exercise]")).toHaveCount(5);
  await page.locator('[data-select-exercise="43"]').click();
  await expect(page.locator("#exercise-detail h3")).toContainText("Cramer");
  await expect(page.locator("#exercise-detail")).not.toContainText("PSEUDOCÓDIGO");
  await expect(page.locator("#exercise-detail [data-start-exercise]")).toBeVisible();
});

test("el filtro por clase se combina con niveles",async({page})=>{
  await goToSpace(page, "exercises");
  await page.locator("#exercise-class-only").click();
  await expect(page.locator("[data-select-exercise]")).toHaveCount(4);
  await page.locator("#exercise-class-only").click();
  await page.locator('[data-exercise-difficulty="3"]').click();
  await expect(page.locator("[data-select-exercise]")).not.toHaveCount(0);
});

test("el constructor se encuentra dentro de Arma el diagrama y permite editar",async({page})=>{
  await goToSpace(page, "simulator");
  await goToSpace(page, "lab");
  await page.locator('[data-lab-activity="build-diagram"]').click();
  await page.locator("#lab-prepare-play").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
  const cards=page.locator("#builder-canvas-list .builder-node-card");
  const initial=await cards.count();
  await page.locator('#lab-builder-stage [data-add-node="process"]').click();
  await expect(cards).toHaveCount(initial+1);
  await page.locator("#builder-undo").click();
  await expect(cards).toHaveCount(initial);
  await page.locator("#builder-redo").click();
  await expect(cards).toHaveCount(initial+1);
});

test("el catálogo busca por número y conserva los filtros sin paginación",async({page})=>{
  await goToSpace(page, "exercises");
  await page.locator("#exercise-search").fill("45");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
  await expect(page.locator('[data-select-exercise="45"]')).toBeVisible();
  await page.locator("#exercise-search").fill("");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(45);
  await page.locator('[data-exercise-difficulty="4"]').click();
  await page.locator("#exercise-search").fill("43");
  await expect(page.locator('[data-select-exercise="43"]')).toBeVisible();
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
});

test("Arma el diagrama ofrece el acceso al Lienzo libre dentro del Laboratorio",async({page})=>{
  await goToSpace(page, "lab");
  await page.locator('[data-lab-activity="build-diagram"]').click();
  await page.locator("#lab-prepare-play").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
  await expect(page.locator("#view-lab")).toBeVisible();
  await expect(page.locator("#view-builder")).toHaveCount(0);
});

test("se puede deshacer y rehacer el diagrama con atajos desde el lienzo libre",async({page})=>{
  await goToSpace(page, "simulator");
  await goToSpace(page, "lab");
  await page.locator('[data-lab-activity="build-diagram"]').click();
  await page.locator("#lab-prepare-play").click();
  await page.locator('[data-builder-preset="decision"]').click();
  const cards=page.locator("#builder-canvas-list .builder-node-card");
  const initial=await cards.count();
  await page.locator('#lab-builder-stage [data-add-node="process"]').click();
  await expect(cards).toHaveCount(initial+1);
  await page.locator("#lab-builder-stage").press("Control+z");
  await expect(cards).toHaveCount(initial);
  await page.locator("#lab-builder-stage").press("Control+Shift+z");
  await expect(cards).toHaveCount(initial+1);
});
