import { test, expect, goToSpace } from "./navigation.js";

test("las cuatro ventanas tienen controles de visibilidad y no botones de minimizar",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page, "simulator");
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeVisible();
  await expect(page.locator("[data-window-minimize]")).toHaveCount(0);
  await expect(page.locator("[data-window-pin]")).toHaveCount(0);
  await page.locator("#simulator-controls-toggle").click();
  await page.locator('[data-window-toggle="variables"]').uncheck();
  await expect(page.locator("#PR")).toBeHidden();
  await page.locator('[data-window-toggle="variables"]').check();
  await expect(page.locator("#PR")).toBeVisible();
  await page.locator("[data-hide-all-windows]").click();
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeHidden();
  await page.locator('[data-window-toggle="context"]').check();
  await expect(page.locator("#sim-window-context")).toBeVisible();
  await expect(page.locator("#flow-svg")).toBeVisible();
});

test("la ficha contextual aparece asociada al paso y se mantiene dentro del escenario",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("24");
  await page.locator("#simulator-timeline").evaluate(input=>{
    input.value="7";input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  const card=page.locator("#vf");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-anchor-node",/.+/);
  const geometry=await page.evaluate(()=>{
    const box=document.querySelector("#vf").getBoundingClientRect();
    const stage=document.querySelector("#diagram-stage").getBoundingClientRect();
    return {inside:box.left>=stage.left&&box.right<=stage.right&&box.top>=stage.top&&box.bottom<=stage.bottom,
      width:box.width,height:box.height};
  });
  expect(geometry.inside).toBe(true);
  expect(geometry.width).toBeGreaterThan(100);
  expect(geometry.height).toBeGreaterThan(30);
});

test("las ventanas del simulador ocupan zonas separadas en alturas de portátil y escritorio",async({page})=>{
  for(const size of [{width:1366,height:768},{width:1920,height:1080}]){
    await page.setViewportSize(size);
    await page.goto("/");
    await goToSpace(page,"simulator");
    const boxes=await page.evaluate(()=>{
      const grid=document.querySelector(".simulator-grid-four");
      return ["#simulator-exercise-nav","#PL",".diagram-panel.sim-world-panel","#RC","#dock"].map(selector=>({selector,element:document.querySelector(selector)})).map(({selector,element})=>{
      const {left,top,right,bottom}=element.getBoundingClientRect(),style=getComputedStyle(element);
      return {selector,left,top,right,bottom,height:style.height,position:style.position,margin:style.margin,rows:grid?getComputedStyle(grid).gridTemplateRows:""};
    });
    });
    for(let first=0;first<boxes.length;first++)for(let second=first+1;second<boxes.length;second++){
      const a=boxes[first],b=boxes[second];
      const overlaps=a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
      expect(overlaps,`${a.selector} ${JSON.stringify(a)} no debe montarse sobre ${b.selector} ${JSON.stringify(b)} en ${size.width}×${size.height}`).toBe(false);
    }
    const inspector=await page.locator("#RC").boundingBox();
    for(const panel of ["#PV","#PR"]){
      const box=await page.locator(panel).boundingBox();
      const panelLayout=await page.locator("#RC").evaluate(node=>({rows:getComputedStyle(node).gridTemplateRows,children:[...node.children].map(child=>({id:child.id,rect:child.getBoundingClientRect().toJSON(),height:getComputedStyle(child).height,minHeight:getComputedStyle(child).minHeight}))}));
      expect(box.x).toBeGreaterThanOrEqual(inspector.x);
      expect(box.y).toBeGreaterThanOrEqual(inspector.y);
      expect(box.x+box.width).toBeLessThanOrEqual(inspector.x+inspector.width+1);
      expect(box.y+box.height,`${panel} ${JSON.stringify(box)} debe caber en inspector ${JSON.stringify(inspector)} a ${size.width}×${size.height}; ${JSON.stringify(panelLayout)}`).toBeLessThanOrEqual(inspector.y+inspector.height+1);
    }
  }
});
