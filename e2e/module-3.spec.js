import { test, expect, goToSpace, dismissSimulatorIntro } from "./navigation.js";

test("el simulador ejecuta la suma y sincroniza diagrama, salida y variables",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await goToSpace(page, "simulator");
  await expect(page.locator("#simulator-exercise-title")).toHaveText("Suma de dos números");
  await expect(page.locator("#simulator-status")).toContainText("Simulación lista");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("13");
  await expect(page.locator("#variables-content")).toContainText("a");
  await expect(page.locator("#variables-content")).toContainText("13");
  await expect(page.locator("#flow-svg")).toBeVisible();
  await expect(page.locator(".diagram-node")).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test("avanzar y retroceder reconstruye el estado del paso",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  const first=await page.locator("#dock-step-title").textContent();
  await expect(page.locator("body")).toHaveAttribute("data-simulator-step","0");
  await page.locator("#simulator-next").click();
  await expect(page.locator("body")).toHaveAttribute("data-simulator-step","1");
  await expect(page.locator("#dock-step-title")).not.toHaveText(first);
  await page.locator("#simulator-previous").click();
  await expect(page.locator("body")).toHaveAttribute("data-simulator-step","0");
  await expect(page.locator("#dock-step-title")).toHaveText(first);
});

test("el catálogo abre el ejercicio seleccionado en el simulador",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "exercises");
  await page.locator("#exercise-search").fill("14");
  await page.locator('[data-select-exercise="14"]').click();
  await page.locator("[data-start-exercise]").click();
  await dismissSimulatorIntro(page);
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("#simulator-exercise-title")).toHaveText("Sumar los números de 1 hasta N");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("10");
  await page.locator("#simulator-inputs").fill("6");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("21");
  await expect(page.locator("#simulator-status")).toContainText("Simulación lista");
});

test("el motor detiene entradas incompletas sin inventar valores",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-inputs").fill("8");
  await page.locator("#simulator-run").click();
  await expect(page.locator("#simulator-status")).toContainText("Ejecución detenida");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#scene-content")).toContainText("Falta un dato");
});

test("el simulador permite abrir las cuatro vistas en móvil sin reiniciar la traza",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-last").click();
  const finalStep=await page.locator("#timeline-count").textContent();
  for(const panel of ["problem","scene","variables","diagram"]){
    await page.locator('#simulator-mobile-tabs [data-mobile-panel="'+panel+'"]').click();
    await expect(page.locator("#timeline-count")).toHaveText(finalStep);
  }
});
