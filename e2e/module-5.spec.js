import { test, expect, goToSpace } from "./navigation.js";

test("restaurar ejemplo recupera los datos originales del método",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-inputs").fill("2,3");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("5");
  await page.locator("#simulator-restore-inputs").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-inputs")).toHaveValue("8, 5");
  await expect(page.locator("#simulator-output")).toContainText("13");
});

test("las variables se muestran como cajitas y su historial se reconstruye por traza",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-last").click();
  const card=page.locator('#variables-content [data-variable-history="a"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("8");
  const sum=page.locator('#variables-content [data-variable-history="s"]');
  await expect(sum).toBeVisible();
  await expect(sum).toContainText("13");
  await card.click();
  await page.locator(".variable-history-details summary").click();
  await expect(page.locator("#variable-history")).toContainText("Historial · a");
  await expect(page.locator("#variable-history [data-variable-step]")).not.toHaveCount(0);
  await page.locator("#variable-history [data-variable-step]").first().click();
  await expect(page.locator("#timeline-count")).toContainText("/");
});

test("cámara automática, tamaño de texto y modo Concentración funcionan",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  const camera=page.locator("#diagram-camera-toggle");
  await expect(camera).toHaveAttribute("aria-pressed","true");
  await camera.click();
  await expect(camera).toHaveAttribute("aria-pressed","false");
  await camera.click();
  await expect(camera).toHaveAttribute("aria-pressed","true");
  const code=page.locator(".pseudocode-lines li").first();
  const before=await code.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  await page.locator("#simulator-text-larger").click();
  const after=await code.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  expect(after).toBeGreaterThan(before);
  await page.locator("#simulator-text-reset").click();
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await expect(page.locator("#hd")).toBeHidden();
  await expect(page.locator("#diagram-stage")).toHaveCSS("width","1440px");
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
});

test("arrastrar el escenario libera la cámara y avanzar la reactiva",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
  await page.locator("#simulator-controls-toggle").click();
  const stage=page.locator("#diagram-stage"),rect=await page.locator("#diagram-pan-hit").boundingBox();
  await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.5);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width*.5-80,rect.y+rect.height*.5+40,{steps:4});
  await page.mouse.up();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
  await page.locator("#simulator-next").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
});

test("tema y movimiento reducido no alteran la traza",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-next").click();
  const before=await page.locator("#timeline-count").textContent();
  await page.locator('[data-action="toggle-theme"]').click();
  await page.locator('[data-action="toggle-motion"]').click();
  await expect(page.locator("#timeline-count")).toHaveText(before);
  expect(errors).toEqual([]);
});

test("el token sigue una conexión y la rama activa corresponde a la decisión",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("7");
  await page.locator("#simulator-history-details").evaluate(el=>el.open=true);
  const decision=page.locator("#trace-history li").filter({hasText:"DECISIÓN"}).first();
  await decision.click();
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
  await expect(page.locator("#flow-diagram-container .diagram-edge.is-route-active")).toHaveCount(1);
});

test("la escena desglosa una operación y explica el símbolo activo",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-history-details").evaluate(el=>el.open=true);
  const assignment=page.locator("#trace-history li").filter({hasText:"ASIGNACIÓN"}).first();
  await assignment.click();
  await expect(page.locator("#scene-content .scene-operation-breakdown")).toContainText("8 + 5 = 13");
  await expect(page.locator("#scene-content .scene-symbol-explanation")).toContainText("Rectángulo · Proceso");
  expect(errors).toEqual([]);
});

test("en móvil se cambia entre Problema, Diagrama, En escena y Variables sin reiniciar",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-last").click();
  const finalStep=await page.locator("#timeline-count").textContent();
  for(const panel of ["problem","diagram","scene","variables"]){
    await page.locator('#simulator-mobile-tabs [data-mobile-panel="'+panel+'"]').click();
    await expect(page.locator("#timeline-count")).toHaveText(finalStep);
  }
});

test("Ejercicios sigue mostrando todos los 45 retos en su catálogo",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "exercises");
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
  await page.locator("#exercise-search").fill("Fibonacci");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
  await page.locator("#exercise-search").fill("");
  await expect(page.locator("[data-select-exercise]")).not.toHaveCount(0);
});
