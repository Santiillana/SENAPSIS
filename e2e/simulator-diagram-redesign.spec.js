import { test, expect, goToSpace } from "./navigation.js";

test("las figuras y bifurcaciones se leen sin recortes en móvil, tableta y escritorio",async({page})=>{
  for(const width of [375,768,1280]){
    await page.setViewportSize({width,height:860});
    await page.goto("/");
    await goToSpace(page,"simulator");
    await page.locator("#simulator-controls-toggle").click();
    await page.locator("#sim-exercise-select").selectOption("7");
    await expect(page.locator("#flow-diagram-container #flow-node-2 text")).toContainText("¿n≥3?");
    const labels=page.locator("#flow-diagram-container .diagram-edge-label-wrap");
    await expect(labels.filter({hasText:"Sí ✓"}).first()).toBeVisible();
    await expect(labels.filter({hasText:"No ✗"}).first()).toBeVisible();
    await page.locator("#sim-exercise-select").selectOption("10");
    await expect(page.locator("#flow-diagram-container .diagram-node.node-for .for-label")).toContainText("i = 1; i≤n; i++");
    await page.locator("#simulator-next").click();
    await page.locator("#simulator-next").click();
    await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-init");
    await expect(page.locator("#flow-diagram-container .for-part-0")).toHaveClass(/is-active-part/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("la cámara fija conserva encuadre al avanzar y el zoom respeta sus límites",async({page})=>{
  await page.setViewportSize({width:1280,height:860});
  await page.goto("/");
  await goToSpace(page,"simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#diagram-zoom-in").click();
  const before=await page.locator("#flow-diagram-container").evaluate(node=>({
    x:node.dataset.cameraX,y:node.dataset.cameraY,zoom:node.dataset.cameraZoom
  }));
  await page.locator("#simulator-next").click();
  const after=await page.locator("#flow-diagram-container").evaluate(node=>({
    x:node.dataset.cameraX,y:node.dataset.cameraY,zoom:node.dataset.cameraZoom
  }));
  expect(after).toEqual(before);
  await page.keyboard.press("+");
  for(let index=0;index<20;index++)await page.keyboard.press("+");
  let zoom=await page.locator("#flow-diagram-container").evaluate(node=>Number(node.dataset.cameraZoom));
  expect(zoom).toBeLessThanOrEqual(2.5);
  for(let index=0;index<40;index++)await page.keyboard.press("-");
  zoom=await page.locator("#flow-diagram-container").evaluate(node=>Number(node.dataset.cameraZoom));
  expect(zoom).toBeGreaterThanOrEqual(.4);
});

test("la reproducción avanza por pasos y se puede pausar",async({page})=>{
  await page.goto("/");
  await goToSpace(page,"simulator");
  await page.locator("#simulator-speed").selectOption("0.75");
  const initial=await page.locator("#timeline-count").textContent();
  await page.locator("#simulator-play").click();
  await expect.poll(()=>page.locator("#timeline-count").textContent(),{timeout:5000}).not.toBe(initial);
  await page.locator("#simulator-play").click();
  const paused=await page.locator("#timeline-count").textContent();
  await page.waitForTimeout(250);
  await expect(page.locator("#timeline-count")).toHaveText(paused);
});
