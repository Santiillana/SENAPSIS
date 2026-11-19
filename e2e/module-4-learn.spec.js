import { test, expect, openDiagramLessons, goToSpace } from "./navigation.js";

test("Aprende organiza las 17 lecciones en una lista ligera y una ruta lateral",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await expect(page.locator("#lesson-catalog [data-lesson-id]")).toHaveCount(17);
  await expect(page.locator(".lesson-catalog-group-title")).toHaveCount(0);
  await expect(page.locator("#lesson-route-count")).toHaveText("0 de 17 completadas");
  await expect(page.locator("#lesson-catalog .lesson-list-difficulty i")).toHaveCount(51);
  await expect(page.locator('#lesson-catalog [data-lesson-id="algorithm"]')).toHaveAttribute("aria-label",/dificultad 1 de 3/i);
  await expect(page.locator(".lesson-glossary summary")).toHaveText("Glosario del tema");
  await expect(page.locator("#lesson-detail .lesson-reading-section")).toHaveCount(6);
  await expect(page.locator(".lesson-completion")).toHaveCount(0);
});

test("el progreso de lectura permite marcar y desmarcar una lección manualmente",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="algorithm"]').click();
  await expect(page.locator(".lesson-reading-progress")).toBeVisible();
  await expect(page.locator("#lesson-idea")).toBeVisible();
  await expect(page.locator("#lesson-concept")).toBeVisible();
  await expect(page.locator("#lesson-term")).toBeVisible();
  await expect(page.locator("#lesson-example")).toBeVisible();
  await expect(page.locator("#lesson-practice")).toBeVisible();
  const done=page.locator("[data-lesson-complete]");
  await expect(done).toHaveText("Marcar como completada");
  await done.click();
  await expect(page.locator("[data-lesson-complete]")).toHaveText("✓ Lección completada · Desmarcar");
  await expect(page.locator("[data-lesson-next]")).toBeVisible();
  await expect(page.locator("#lesson-route-count")).toHaveText("1 de 17 completadas");
  await page.locator("[data-lesson-complete]").click();
  await expect(page.locator("[data-lesson-complete]")).toHaveText("Marcar como completada");
  await expect(page.locator("[data-lesson-next]")).toHaveCount(0);
  await expect(page.locator("#lesson-route-count")).toHaveText("0 de 17 completadas");
});

test("cada lección conserva escena, ejemplo ejecutable y comprobación inmediata",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  const ids=["algorithm","reading","terminals","input","process","output","variables","arithmetic","comparisons","decisions","nested-decisions","counters-accumulators","for","while","do-while","nested-loops","validation-sentinel"];
  const recipes={algorithm:"R02-algorithm",reading:"R02-sequence",terminals:"R01-figures",input:"R05-input",process:"R08-process",output:"R06-output",variables:"R03-variables",arithmetic:"R08-arithmetic",comparisons:"R09-comparisons",decisions:"R09-decisions","nested-decisions":"R09-nested-decisions","counters-accumulators":"R11-counters",for:"R12-for",while:"R13-while","do-while":"R13-do-while","nested-loops":"R16-nested-loops","validation-sentinel":"R17-validation"};
  for(const id of ids){
    await page.locator('#lesson-catalog [data-lesson-id="'+id+'"]').click();
    const reader=page.locator("#lesson-detail");
    await expect(reader.locator("#lesson-concept .lesson-scene-host")).toBeVisible();
    await expect(reader.locator("#lesson-example .lesson-worked-steps li").first()).toBeVisible();
    await expect(reader.locator("#lesson-practice .lesson-option")).toHaveCount(3);
    await expect(reader.locator("[data-visual-player]")).toBeVisible();
    if(recipes[id])await expect(reader.locator(".lesson-visual")).toHaveAttribute("data-recipe-id",recipes[id]);
  }
});

test("la escena avanza con controles y muestra su secuencia estática",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="while"]').click();
  const first=await page.locator(".visual-step-count").innerText();
  await page.locator("[data-visual-next]").click();
  await expect(page.locator(".visual-step-count")).not.toHaveText(first);
  await page.locator("[data-visual-prev]").click();
  await page.locator("[data-visual-reset]").click();
  await page.locator(".lesson-static-sequence summary").click();
  await expect(page.locator(".lesson-static-sequence li")).not.toHaveCount(0);
});

test("el movimiento reducido abre la secuencia estática y evita reproducir",async({page})=>{
  await page.addInitScript(()=>localStorage.setItem("traza:v2:motion","reduced"));
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="while"]').click();
  await expect(page.locator(".lesson-static-sequence")).toHaveAttribute("open","");
  await page.locator("[data-visual-play]").click();
  await expect(page.locator("[data-visual-play]")).toHaveAttribute("aria-pressed","false");
});

test("la cuadrícula de la lección sigue el tema y recuerda su elección",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  const sheet=page.locator("#lesson-detail");
  const pageTheme=await page.locator("html").getAttribute("data-theme");
  await expect(sheet).toHaveAttribute("data-sheet-theme",pageTheme);
  await page.locator('[data-action="toggle-theme"]').click();
  await expect(sheet).toHaveAttribute("data-sheet-theme",await page.locator("html").getAttribute("data-theme"));
  await page.locator("[data-sheet-theme-toggle]").click();
  const chosen=await sheet.getAttribute("data-sheet-theme");
  expect(chosen).not.toBe(await page.locator("html").getAttribute("data-theme"));
  await page.reload();
  await openDiagramLessons(page);
  await expect(page.locator("#lesson-detail")).toHaveAttribute("data-sheet-theme",chosen);
});

test("la escena se reproduce al entrar en pantalla y se pausa al salir",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator("#lesson-detail .lesson-visual").evaluate(element=>element.scrollIntoView({block:"center"}));
  const play=page.locator("#lesson-detail [data-visual-play]");
  await expect(play).toHaveAttribute("aria-pressed","true");
  await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  await expect(play).toHaveAttribute("aria-pressed","false");
});

test("las lecciones se mantienen dentro del ancho en móvil",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator("[data-learn-list]").click();
  await page.locator('#lesson-catalog [data-lesson-id="decisions"]').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.locator("[data-learn-list]").click();
  await expect(page.locator(".lesson-catalog-panel")).toBeVisible();
});

test("Aprende navega competencia, tema y lección sin pestañas internas",async({page})=>{
  await page.goto("/");
  await goToSpace(page,"learn");
  const titles=await page.locator("#learn-competence-filters .learn-competence-card strong").allTextContents();
  expect(titles).toEqual(["Establecer requisitos","Evaluación de requisitos","TICs","Comunicación","Matemáticas"]);
  await expect(page.locator("#learn-competence-filters .learn-competence-card").nth(0)).not.toContainText("Transversal");
  await expect(page.locator("#learn-competence-filters .learn-competence-card").nth(2)).toContainText("Transversal");
  await page.locator('[data-learn-competence="evaluar-requisitos"]').click();
  await expect(page.locator("#learn-catalog-bands [data-topic-open]")).toHaveCount(1);
  await page.locator('[data-topic-open="diagramas-flujo"]').click();
  await expect(page.locator("#learn-topic-space")).toBeVisible();
  await expect(page.locator("#learn-topic-title")).toHaveText("Diagramas de flujo");
  await expect(page.locator("#learn-current-lesson")).toHaveText("Algoritmos y diagramas de flujo");
  await expect(page.locator(".learn-topic-crumb")).toHaveCount(1);
  await expect(page.locator(".lesson-breadcrumb")).toHaveCount(0);
  await expect(page.locator("#learn-topic-tabs, #learn-topic-select, #learn-difficulty")).toHaveCount(0);
});

test("los tres temas de matemáticas abren sus cinco lecciones con escenas recorribles",async({page})=>{
  await page.goto("/");
  await goToSpace(page,"learn");
  await page.locator('[data-learn-competence="matematicas"]').click();
  for(const [id,title] of [["enteros","Números enteros"],["racionales","Números racionales"],["regla-de-tres","Regla de tres"]]){
    await page.locator('[data-topic-open="'+id+'"]').click();
    await expect(page.locator("#learn-topic-title")).toHaveText(title);
    await expect(page.locator("#lesson-catalog [data-lesson-id]")).toHaveCount(5);
    await page.locator("#lesson-catalog [data-lesson-id]").first().click();
    await expect(page.locator("#lesson-detail .lesson-visual .math-scene")).toBeVisible();
    await expect(page.locator("#lesson-detail [data-visual-player]")).toBeVisible();
    await expect(page.locator("#lesson-detail #lesson-term")).toContainText("Glosario del tema");
    const scene=page.locator("#lesson-detail .lesson-visual .math-scene");
    const initial=await scene.getAttribute("data-math-step");
    await page.locator("#lesson-detail [data-visual-next]").click();
    await expect(scene).not.toHaveAttribute("data-math-step",initial);
    await page.locator('#learn-topic-space [data-learn-back]').click();
    await page.locator('[data-learn-competence="matematicas"]').click();
  }
});
