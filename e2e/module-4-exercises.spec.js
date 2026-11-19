import { test, expect, goToSpace, dismissSimulatorIntro, openExerciseTheme } from "./navigation.js";
import { checkView } from "./ui-layout.js";

async function openExercises(page,theme="diagramas-flujo"){await page.goto("/");await goToSpace(page,"exercises",{exerciseTheme:false});await openExerciseTheme(page,theme);}

test("Ejercicios empieza en competencias y temas sin mostrar filtros ni retos",async({page})=>{
  for(const size of [{width:390,height:844},{width:1366,height:768},{width:1920,height:1080}]){
    await page.setViewportSize(size);await page.goto("/");
    await page.evaluate(()=>{document.documentElement.dataset.theme="dark";});
    await goToSpace(page,"exercises",{exerciseTheme:false});
    await checkView(page,"Ejercicios nivel tema "+size.width+"×"+size.height,{noSolapar:[["#hd","#main-content"]],sinCorte:["#hd"]});
  }
  await expect(page.locator("#exercise-catalog-home")).toBeVisible();
  await expect(page.locator("#exercise-theme-grid [data-exercise-theme]")).toHaveCount(5);
  await expect(page.locator(".exercise-filter-panel")).toBeHidden();
  await expect(page.locator("#exercise-grid")).toBeHidden();
  await expect(page.locator("#exercise-topic-workspace")).toBeHidden();
});

test("elegir un tema abre solo sus ejercicios y permite volver a las competencias",async({page})=>{
  await page.goto("/");await goToSpace(page,"exercises",{exerciseTheme:false});await openExerciseTheme(page,"racionales");
  await expect(page.locator("#exercise-topic-title")).toHaveText("Números racionales");
  await expect(page.locator("#exercise-grid [data-select-math-exercise]")).toHaveCount(9);
  await expect(page.locator("#exercise-math-topic-wrap")).toBeHidden();
  await page.locator("#exercise-topic-back").click();
  await expect(page.locator("#exercise-catalog-home")).toBeVisible();
  await expect(page.locator("#exercise-grid")).toBeHidden();
});

test("el catálogo es compacto y ordena las tarjetas por dificultad y número",async({page})=>{
  await openExercises(page);
  await expect(page.locator("#exercise-count")).toHaveCount(0);
  await expect(page.locator("#exercise-level-shortcuts")).toHaveCount(0);
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
  const ids=await page.locator("#exercise-grid [data-select-exercise]").evaluateAll(cards=>cards.map(card=>Number(card.dataset.selectExercise)));
  expect(ids).toHaveLength(45);expect(new Set(ids).size).toBe(45);
  await expect(page.locator("#exercise-grid .exercise-card-concepts i").first()).toBeVisible();
  await expect(page.locator("[data-exercise-view=grid]")).toHaveAttribute("aria-pressed","true");
});

test("dificultad, conceptos, clase y búsqueda se combinan y se limpian",async({page})=>{
  await openExercises(page);
  await page.locator('[data-exercise-difficulty="2"]').click();
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(10);
  await page.locator('[data-exercise-difficulty="2"]').click();
  await page.locator("#exercise-class-only").check();
  const ids=await page.locator("#exercise-grid [data-select-exercise]").evaluateAll(cards=>cards.map(card=>Number(card.dataset.selectExercise)).sort((a,b)=>a-b));
  expect(ids).toEqual([22,23,24,28]);
  await page.locator("#exercise-concept-details > summary").click();
  await page.locator('[data-concept-filter="Ciclo Para"]').click();
  await expect(page.locator("#exercise-active-filters")).toContainText("Ciclo Para");
  await page.locator("#exercise-search").fill("no existe");
  await expect(page.getByText("Ningún ejercicio coincide")).toBeVisible();
  await page.locator("#exercise-empty-clear").click();
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
});

test("el detalle guía el intento y revela el pseudocódigo solo al pedirlo",async({page})=>{
  await openExercises(page);
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator("#exercise-detail")).toContainText("DATOS DE EJEMPLO");
  await expect(page.locator("#exercise-detail .exercise-guide li")).toHaveCount(3);
  await expect(page.locator("#exercise-detail svg")).toBeVisible();
  await expect(page.locator("#exercise-detail pre")).toHaveCount(0);
  await page.locator("[data-reveal-solution]").click();
  await expect(page.locator("#exercise-detail .exercise-solution pre")).toBeVisible();
  await page.locator("[data-start-exercise]").click();
  await dismissSimulatorIntro(page);
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Fibonacci");
});

test("la vista de lista y los filtros se adaptan a móvil sin desbordar",async({page})=>{
  await page.setViewportSize({width:390,height:844});await openExercises(page);
  await page.locator('[data-exercise-view="list"]').click();
  await expect(page.locator("#exercise-grid")).toHaveClass(/is-list/);
  await page.locator('[data-select-exercise="1"]').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator("#exercise-detail")).toContainText("ANTES DE EMPEZAR");
});

test("el banco matemático verifica respuestas exactas y abre el reproductor dedicado",async({page})=>{
  await openExercises(page,"enteros");
  await expect(page.locator("#exercise-grid [data-select-math-exercise]")).toHaveCount(15);
  await expect(page.locator("#exercise-concept-details")).toBeHidden();
  await page.locator('[data-select-math-exercise="MAT-ENT-01"]').click();
  await expect(page.locator("#exercise-detail .math-exercise-expression")).toContainText("15−8(2)+24÷6");
  await expect(page.locator("#exercise-detail .exercise-solution")).toHaveCount(0);
  await page.locator("#math-answer").fill("3");
  await page.locator("#exercise-detail [type=submit]").click();
  await expect(page.locator("#math-answer-feedback")).toContainText("Correcto");
  await expect(page.locator("#exercise-detail .exercise-solution")).toHaveCount(0);
  await page.locator("[data-reveal-math-solution]").click();
  await expect(page.locator("#exercise-detail .math-exercise-solution")).toContainText("Resultado: 3");
  await page.locator("[data-start-math-exercise]").click();
  await expect(page.locator("#view-simulator")).toBeVisible();
  await expect(page.locator("#math-player")).toBeVisible();
  await expect(page.locator("#math-player h2")).toHaveText("Enteros · Ejercicio 01");
  await page.locator('#math-player [data-math-predict="16"]').click();
  await expect(page.locator(".math-predict-feedback")).toContainText("Correcto");
  await page.locator('#math-player [data-math-player-action="next"]').click();
  await expect(page.locator("#math-player .math-player-progress")).toContainText("PASO 2");
});

test("la fracción equivalente se acepta y el ejercicio pendiente permanece sin resolver",async({page})=>{
  await openExercises(page,"racionales");
  await page.locator('[data-select-math-exercise="MAT-RAC-01"]').click();
  await page.locator("#math-answer").fill("3/6");
  await page.locator("#exercise-detail [type=submit]").click();
  await expect(page.locator("#math-answer-feedback")).toContainText("se puede simplificar a 1/2");
  await expect(page.locator("#exercise-detail .exercise-solution")).toHaveCount(0);
  await page.locator("#exercise-topic-back").click();await openExerciseTheme(page,"enteros");
  await page.locator('[data-select-math-exercise="MAT-ENT-15"]').click();
  await expect(page.locator("#exercise-detail")).toContainText("no se calcula ni se corrige");
  await expect(page.locator("#exercise-detail [data-start-math-exercise]")).toHaveCount(0);
});

test("la ruta de tres niveles abre directamente el banco de matemáticas del tema",async({page})=>{
  await page.goto("/");await goToSpace(page,"learn");
  await page.locator('[data-learn-competence="matematicas"]').click();
  await page.locator('[data-topic-open="racionales"]').click();
  await goToSpace(page,"exercises");
  await openExerciseTheme(page,"racionales");
  await expect(page.locator('[data-view="exercises"]')).toBeVisible();
  await expect(page.locator("#exercise-grid [data-select-math-exercise]")).toHaveCount(9);
});

test("la regla de tres inversa verifica el producto constante en el simulador",async({page})=>{
  await openExercises(page,"regla-de-tres");
  await page.locator('[data-select-math-exercise="MAT-R3-01"]').click();
  await expect(page.locator("#exercise-detail")).toContainText("Proporción inversa");
  await page.locator("#math-answer").fill("10");
  await page.locator("#exercise-detail [type=submit]").click();
  await expect(page.locator("#math-answer-feedback")).toContainText("Correcto");
  await page.locator("[data-start-math-exercise]").click();
  await expect(page.locator("#math-player .math-player-area")).toBeVisible();
  await expect(page.locator("#math-player .math-player-area")).toContainText("120");
  await page.locator('#math-player [data-math-predict="inversa"]').click();
  await expect(page.locator(".math-predict-feedback")).toContainText("Correcto");
});
