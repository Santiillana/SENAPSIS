import { test, expect, goToSpace, openDiagramLessons, dismissSimulatorIntro } from "./navigation.js";

test("Aprende conserva las 17 lecciones y cada escena tiene identidad visual",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await expect(page.locator("#lesson-catalog [data-lesson-id]")).toHaveCount(17);
  await page.locator('#lesson-catalog [data-lesson-id="variables"]').click();
  await expect(page.locator("#lesson-detail h3")).toHaveText("Variables y asignación");
  await expect(page.locator(".lesson-visual")).toBeVisible();
  await expect(page.locator(".lesson-visual .lesson-scene-host")).toBeVisible();
  await expect(page.locator(".lesson-visual [data-visual-next]")).toBeVisible();
});

test("la escena de Aprende permite retroceder, avanzar y reproducir",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="variables"]').click();
  const initial=Number((await page.locator(".visual-step-count").innerText()).match(/\d+/)?.[0]??1);
  await page.locator("[data-visual-next]").click();
  await expect(page.locator(".visual-step-count")).toContainText(String(initial+1));
  await page.locator("[data-visual-prev]").click();
  await expect(page.locator(".visual-step-count")).toContainText(String(initial));
  await page.locator("[data-visual-play]").click();
  await expect(page.locator("[data-visual-play]")).toHaveAttribute("aria-pressed","true");
  await page.locator("[data-visual-play]").click();
});

test("las 17 lecciones presentan fases visuales y una escena vinculada a eventos",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  const lessons=page.locator("#lesson-catalog [data-lesson-id]");
  await expect(lessons).toHaveCount(17);
  for(let index=0;index<17;index++){
    await lessons.nth(index).click();
    const visual=page.locator(".lesson-visual");
    await expect(visual).toBeVisible();
    await expect(visual.locator(".lesson-phase")).not.toHaveCount(0);
    await expect(visual.locator(".lesson-scene-host")).toBeVisible();
    const source=await visual.getAttribute("data-phase-source");
    expect(["lesson","events"]).toContain(source);
  }
});
 
test("el catálogo filtra ejercicios por dificultad y búsqueda",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "exercises");
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
  await page.locator('[data-exercise-difficulty="4"]').click();
  await expect(page.locator("[data-select-exercise]")).toHaveCount(5);
  await page.locator('[data-exercise-difficulty="4"]').click();
  await expect(page.locator("#exercise-concept-details")).toHaveCount(0);
  await page.locator("#exercise-search").fill("ciclo");
  await expect(page.locator("[data-select-exercise]")).not.toHaveCount(0);
  await page.locator("#exercise-search").fill("");
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
});

test("la ficha del ejercicio protege la solución y abre su ejecución",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "exercises");
  await page.locator("#exercise-search").fill("23");
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator("#exercise-detail")).not.toContainText("PSEUDOCÓDIGO");
  await page.locator("[data-start-exercise]").click();
  await dismissSimulatorIntro(page);
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Fibonacci");
  await expect(page.locator("#pseudocode-lines")).toContainText("mientras");
});

test("Ejercicios se mantiene dentro del ancho en móvil",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await goToSpace(page, "exercises");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
