import { test, expect, goToSpace } from "./navigation.js";

test("el zoom se controla con botones, no con la rueda del ratón",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await goToSpace(page, "simulator");
  const canvas=page.locator("#flow-diagram-container");
  await expect.poll(async()=>Number(await canvas.getAttribute("data-camera-zoom"))).toBeGreaterThan(0);
  const initial=Number(await canvas.getAttribute("data-camera-zoom"));
  const stage=await page.locator("#diagram-pan-hit").boundingBox();
  await page.mouse.move(stage.x+stage.width*.5,stage.y+stage.height*.5);
  await page.mouse.wheel(0,180);
  await expect.poll(async()=>Number(await canvas.getAttribute("data-camera-zoom"))).toBe(initial);
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#diagram-zoom-in").click();
  const enlarged=Number(await canvas.getAttribute("data-camera-zoom"));
  expect(enlarged).toBeGreaterThan(initial);
  await page.locator("#diagram-zoom-out").click();
  expect(Number(await canvas.getAttribute("data-camera-zoom"))).toBeLessThan(enlarged);
  await page.locator("#diagram-fit").click();
  await expect.poll(async()=>Number(await canvas.getAttribute("data-camera-zoom"))).toBeCloseTo(1,4);
});

test("arrastrar libera la cámara y el siguiente paso reanuda el seguimiento",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
  await page.locator("#simulator-controls-toggle").click();
  const stage=page.locator("#diagram-stage");
  const rect=await stage.boundingBox();
  await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.5);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width*.5-90,rect.y+rect.height*.5+40,{steps:5});
  await page.mouse.up();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
  await expect(stage).toHaveAttribute("data-pan-start",/[1-9]/);
  await expect(stage).toHaveAttribute("data-pan-moved",/[1-9]/);
  await page.locator("#simulator-next").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
  const target=await stage.getAttribute("data-camera-target");
  expect(target).not.toBeNull();
});

test("la ficha animada deja rastro sobre las conexiones reales del SVG",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await goToSpace(page, "simulator");
  for(let i=0;i<4;i++)await page.locator("#simulator-next").click();
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
  await expect(page.locator("#flow-diagram-container #flow-active-trail")).toBeAttached();
  await expect(page.locator("#flow-diagram-container #flow-trail")).toBeAttached();
  await expect.poll(async()=>(await page.locator("#flow-diagram-container #flow-active-trail").getAttribute("points")??"").trim().split(/\s+/).length).toBeGreaterThan(1);
  await expect(page.locator("#flow-svg .diagram-edge.is-token-route")).not.toHaveCount(0);
});
