import {test,expect,goToSpace} from "./navigation.js";

async function openSourceExercises(page){
  await page.goto("/");
  await goToSpace(page,"learn");
  await page.locator('[data-learn-competence="establecer-requisitos"]').click();
  await page.locator('[data-topic-open="fuentes-informacion"]').click();
  await goToSpace(page,"exercises");
  await expect(page.locator("#view-exercises")).toBeVisible();
}

test("24 ejercicios aparecen por nivel, aceptan una respuesta y explican por qué",async({page})=>{
  await openSourceExercises(page);
  await expect(page.locator("#exercise-bank")).toHaveValue("fuentes");
  await expect(page.locator("#exercise-grid [data-select-source-exercise]")).toHaveCount(24);
  for(const level of [1,2,3,4])await expect(page.locator('#exercise-grid [data-source-level="'+level+'"]')).toHaveCount(6);
  await page.locator('[data-select-source-exercise="REQ-FUE-01"]').click();
  await page.locator('[data-source-exercise-answer="1"]').click();
  await expect(page.locator(".source-exercise-feedback")).toContainText("Revisa la respuesta");
  await expect(page.locator(".source-exercise-feedback")).toContainText("La información se obtiene directamente");
  await page.locator('[data-source-exercise-answer="0"]').click();
  await expect(page.locator(".source-exercise-feedback")).toContainText("Correcto");
  await page.locator("[data-start-source-simulator]").click();
  await expect(page.locator("#source-simulator")).toBeVisible();
});

test("la Mesa recorre fuentes, calcula cobertura y Predice tipo y requisito",async({page})=>{
  await openSourceExercises(page);
  await page.locator('[data-select-source-exercise="REQ-FUE-01"]').click();
  await page.locator("[data-start-source-simulator]").click();
  await expect(page.locator("#source-simulator")).toBeVisible();
  await expect(page.locator(".source-sim-lane-P [data-source-sim-select]")).toHaveCount(3);
  await expect(page.locator(".source-sim-requirement.is-known")).toHaveCount(1);
  await page.locator("[data-source-sim-predict]").click();
  await page.locator('[data-source-predict-answer="P"]').click();
  await expect(page.locator(".source-sim-predict h3")).toContainText("¿Qué requisito");
  await page.locator('[data-source-predict-answer][data-source-predict-correct="true"]').click();
  await expect(page.locator(".source-sim-predict")).toContainText(/completado/i);
  await page.locator('[data-source-sim-scenario]').selectOption("matricula-colegio");
  await expect(page.locator(".source-sim-toolbar h2")).toContainText("Matrícula");
  await page.locator("[data-source-sim-last]").click();
  await expect(page.locator(".source-sim-completion")).toContainText("5/5 áreas cubiertas");
  await expect(page.locator(".source-sim-completion")).toContainText("Por verificar con una fuente primaria");
  await page.locator('[data-source-sim-scenario]').selectOption("citas-consultorio");
  await expect(page.locator(".source-sim-toolbar h2")).toContainText("consultorio");
  await page.locator("[data-source-sim-last]").click();
  await expect(page.locator(".source-sim-completion")).toContainText("5/5 áreas cubiertas");
});

test("la tarjeta terciaria termina sin requisito directo y activa verificación primaria",async({page})=>{
  await openSourceExercises(page);
  await page.locator('[data-select-source-exercise="REQ-FUE-01"]').click();
  await page.locator("[data-start-source-simulator]").click();
  await page.locator("[data-source-sim-last]").click();
  await expect(page.locator(".source-sim-no-requirement")).toContainText("no produce un requisito directo");
  await expect(page.locator(".source-sim-completion")).toContainText("4/4 áreas cubiertas");
  await expect(page.locator(".source-sim-completion")).toContainText("2/4 verificadas");
});

test("la Mesa ofrece controles de paso y se adapta a móvil",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await goToSpace(page,"simulator");
  await page.locator('#simulator-entry [data-sim-competence="establecer-requisitos"]').click();
  await page.locator('#simulator-entry [data-sim-theme="fuentes-informacion"]').click();
  await page.locator('#simulator-entry [data-sim-exercise]').first().click();
  await expect(page.locator("#source-simulator")).toBeVisible();
  await expect(page.locator("[data-source-sim-next]")).toBeEnabled();
  await page.locator("[data-source-sim-next]").click();
  await expect(page.locator(".source-sim-center>header")).toContainText("PASO 02");
  await page.locator("[data-source-sim-play]").click();
  await expect(page.locator("[data-source-sim-play]")).toContainText("Pausar");
  await expect(page.locator(".source-sim-center>header")).toContainText("PASO 03",{timeout:5000});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.locator("[data-source-sim-exit]").click();
  await expect(page.locator("#view-learn")).toBeVisible();
  await goToSpace(page,"simulator");
  await expect(page.locator("#simulator-entry")).toBeVisible();
});
