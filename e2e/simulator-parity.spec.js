import { test, expect, goToSpace } from "./navigation.js";

test("la referencia conserva su archivo y Senapsis conserva el significado del ejercicio",async({page})=>{
  const response=await page.request.get("/reference/diagramas_de_flujo_original.html");
  expect(response.ok()).toBeTruthy();
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("24");
  await expect(page.locator("#simulator-exercise-title")).toContainText("Encontrar el mayor de diez números");
  await expect(page.locator("#simulator-exercise-statement")).not.toBeEmpty();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).not.toBeEmpty();
  await expect(page.locator("#flow-svg .diagram-node")).not.toHaveCount(0);
  await expect(page.locator("#scene-content .scene-symbol-explanation")).toBeVisible();
});

test("el escenario ocupa el espacio central sin scroll interno",async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.goto("/");
  await goToSpace(page, "simulator");
  const state=await page.evaluate(()=>{
    const stage=document.querySelector("#wrap").getBoundingClientRect();
    const app=document.querySelector(".page-shell").getBoundingClientRect();
    const header=document.querySelector("#hd").getBoundingClientRect();
    const grid=getComputedStyle(document.querySelector(".simulator-grid-four"));
    return {stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},
      headerHeight:header.height,app:{x:app.x,y:app.y,width:app.width,height:app.height},
      overflowX:grid.overflowX,overflowY:grid.overflowY};
  });
  expect(state.stage.x).toBeGreaterThan(0);
  expect(state.stage.y).toBeGreaterThanOrEqual(state.headerHeight-1);
  expect(state.stage.width).toBeGreaterThan(400);
  expect(state.stage.x+state.stage.width).toBeLessThan(1100);
  expect(state.stage.height).toBeGreaterThan(500);
  expect(state.overflowX).toBe("hidden");
});
