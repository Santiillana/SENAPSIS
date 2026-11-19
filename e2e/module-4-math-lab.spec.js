import { test, expect, goToSpace } from "./navigation.js";
import { buildMathLabChallenge } from "../src/math/lab-engine.js";

async function openMathLab(page,topic){
  await page.goto("/");await goToSpace(page,"learn");
  const catalog=page.locator('[data-learn-competence="matematicas"]');
  if(!(await catalog.isVisible()))await page.locator("#learn-topic-space [data-learn-back]").click();
  await catalog.click();
  await page.locator('[data-topic-open="'+topic+'"]').click();
  await goToSpace(page,"lab");
  if(await page.locator("#lab-topic-heading").isVisible())await page.locator("#lab-topic-back").click();
  await page.locator('[data-lab-topic="'+topic+'"]').click();
  await expect(page.locator("#view-lab")).toBeVisible();
}

test("cada tema matemático ofrece cuatro o más mecánicas generadas",async({page})=>{
  for(const topic of ["enteros","racionales","regla-de-tres"]){
    await openMathLab(page,topic);
    await expect(page.locator("#lab-mode-cards [data-lab-math-mechanic]").first()).toBeVisible();
    expect(await page.locator("#lab-mode-cards [data-lab-math-mechanic]").count()).toBeGreaterThanOrEqual(4);
  }
});

test("un reto de enteros registra una partida y permite completar cinco rondas",async({page})=>{
  await openMathLab(page,"enteros");
  await page.locator('[data-lab-math-mechanic="predict"]').click();
  await expect(page.locator("#math-lab-feedback")).toBeHidden();
  for(let round=0;round<5;round++){
    await page.locator('.math-lab-option[data-correct="true"]').click();
    await expect(page.locator("#math-lab-feedback")).toContainText("¡Correcto!");
    await page.locator("[data-math-lab-next]").click();
  }
  await expect(page.locator("#lab-task-content .lab-session-finish")).toContainText("5 de 5");
  await page.locator('[data-math-lab-back]').click();
  await expect(page.locator('#lab-mode-cards [data-lab-math-mechanic="predict"]')).toContainText("★★★");
  await page.locator("#lab-topic-back").click();
  await expect(page.locator('[data-lab-topic="enteros"] .exercise-theme-progress')).toContainText("3 / 18 estrellas");
  await goToSpace(page,"learn");
  await page.locator("#learn-open-progress").click();
  await expect(page.locator("#learn-progress-page")).toContainText("3 estrellas del Laboratorio");
});

test("la recta numérica, la barra y el orden ofrecen controles accesibles",async({page})=>{
  await openMathLab(page,"enteros");
  await page.locator('[data-lab-math-mechanic="number-line"]').click();
  const numberLine=page.locator(".math-lab-number-line button");
  await expect(numberLine).toHaveCount(5);
  await numberLine.first().focus();await page.keyboard.press("ArrowRight");
  await expect(numberLine.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#math-lab-feedback")).toBeVisible();
  await page.locator("[data-math-lab-back]").click();
  await page.locator('[data-lab-math-mechanic="order"]').click();
  await expect(page.locator(".math-lab-order-list li").first().locator("button")).toHaveCount(2);
  await page.locator("[data-math-lab-back]").click();
  await goToSpace(page,"learn");
  await page.locator("#learn-topic-space [data-learn-back]").click();
  await page.locator('[data-learn-competence="matematicas"]').click();
  await page.locator('[data-topic-open="racionales"]').click();
  await goToSpace(page,"lab");
  await page.locator("#lab-topic-back").click();
  await page.locator('[data-lab-topic="racionales"]').click();
  await page.locator('[data-lab-math-mechanic="fraction-bar"]').click();
  await expect(page.locator(".math-lab-fraction-bar button").first()).toHaveAttribute("aria-pressed","false");
  await page.locator(".math-lab-fraction-bar button").first().click();
  await expect(page.locator(".math-lab-fraction-bar button").first()).toHaveAttribute("aria-pressed","true");
});

test("completa un hueco con formato exacto y depura el tipo de proporción",async({page})=>{
  await openMathLab(page,"racionales");
  await page.locator('[data-lab-math-mechanic="fill-gap"]').click();
  const challenge=buildMathLabChallenge("racionales","fill-gap",1,"racionales:fill-gap:1:session-0",0);
  await expect(page.locator(".math-lab-prompt")).toContainText("Completa el resultado");
  await page.locator("#math-lab-answer").fill(challenge.answer);
  await page.locator(".math-lab-answer-form button").click();
  await expect(page.locator("#math-lab-feedback")).toContainText("¡Correcto!");
  await page.locator("[data-math-lab-back]").click();
  await goToSpace(page,"learn");await page.locator("#learn-topic-space [data-learn-back]").click();
  await page.locator('[data-learn-competence="matematicas"]').click();
  await page.locator('[data-topic-open="regla-de-tres"]').click();await goToSpace(page,"lab");
  await page.locator("#lab-topic-back").click();await page.locator('[data-lab-topic="regla-de-tres"]').click();
  await page.locator('[data-lab-math-mechanic="error"]').click();
  await page.locator('.math-lab-option[data-correct="true"]').click();
  await expect(page.locator("#math-lab-feedback")).toContainText("¡Correcto!");
});
