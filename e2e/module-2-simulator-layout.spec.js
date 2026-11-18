import { test, expect, goToSpace } from "./navigation.js";

for(const viewport of [
 {name:"pantalla amplia",width:1920,height:1080,mobile:false},
 {name:"referencia",width:1649,height:928,mobile:false},
 {name:"escritorio",width:1440,height:900,mobile:false},
 {name:"tableta",width:1024,height:768,mobile:false},
 {name:"móvil ancho",width:900,height:800,mobile:true},
 {name:"móvil",width:390,height:844,mobile:true}
]){
 test("Simulador sin desbordamiento y con cuatro espacios en "+viewport.name,async({page})=>{
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await expect(page.locator("#flow-svg")).toBeVisible();
  await expect(page.locator("#diagram-stage")).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const stage=await page.locator("#diagram-stage").boundingBox(),dock=await page.locator("#dock").boundingBox();
  expect(stage?.width??0).toBeGreaterThan(viewport.mobile?250:360);
  expect(stage?.height??0).toBeGreaterThan(viewport.mobile?160:300);
  expect(dock).not.toBeNull();
  expect(dock.x).toBeGreaterThanOrEqual(0);
  expect(dock.x+dock.width).toBeLessThanOrEqual(viewport.width+1);
  if(viewport.mobile){
   await expect(page.locator("#simulator-mobile-tabs [data-mobile-panel]")).toHaveCount(4);
   for(const panel of ["problem","scene","variables","diagram"]){
    await page.locator('#simulator-mobile-tabs [data-mobile-panel="'+panel+'"]').click();
    await expect(page.locator("body")).toHaveAttribute("data-simulator-mobile-panel",panel);
    if(panel==="problem"){
     await expect(page.locator("#PL")).toBeVisible();
     await expect(page.locator("#sim-window-context")).toBeVisible();
     await expect(page.locator("#RC")).toBeHidden();
    }
    if(panel==="scene"){
     await expect(page.locator("#PV")).toBeVisible();
     await expect(page.locator("#PR")).toBeHidden();
     await expect(page.locator("#PL")).toBeHidden();
    }
    if(panel==="variables"){
     await expect(page.locator("#PR")).toBeVisible();
     await expect(page.locator("#PV")).toBeHidden();
     await expect(page.locator("#PL")).toBeHidden();
    }
    if(panel==="diagram"){
     await expect(page.locator("#PL")).toBeHidden();
     await expect(page.locator("#RC")).toBeHidden();
    }
    const xOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(xOverflow).toBeLessThanOrEqual(1);
   }
  }else{
   for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeVisible();
   const columns=await page.evaluate(()=>{
    const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:b.left,right:b.right,width:b.width}};
    return {problem:r("#PL"),diagram:r(".diagram-panel"),inspector:r("#RC")};
   });
   expect(columns.problem.right).toBeLessThanOrEqual(columns.diagram.left+2);
   expect(columns.diagram.right).toBeLessThanOrEqual(columns.inspector.left+2);
   expect(columns.diagram.width).toBeGreaterThan(columns.problem.width*1.5);
   expect(columns.diagram.width).toBeGreaterThan(columns.inspector.width*1.15);
  }
 });
}

test("la cámara centra el primer nodo al entrar y al cambiar ejercicio o método",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/");
 await goToSpace(page, "simulator");
 await page.locator("#simulator-next").click();
 const centered=async()=>{
  const activeId=await expect.poll(()=>page.evaluate(()=>document.querySelector("#flow-svg .diagram-node.is-active")?.id??"")).not.toBe("");
  const nodeId=String(await page.locator("#flow-svg .diagram-node.is-active").getAttribute("id")).replace("flow-node-","");
  await expect.poll(()=>page.locator("#diagram-stage").getAttribute("data-camera-target")).toBe(nodeId);
  await expect.poll(()=>page.evaluate(()=>{
   const stage=document.querySelector("#diagram-stage").getBoundingClientRect();
   const node=document.querySelector("#flow-svg .diagram-node.is-active")?.getBoundingClientRect();
   if(!node)return false;
   return Math.abs(node.left+node.width/2-(stage.left+stage.width/2))<stage.width*.12&&
     Math.abs(node.top+node.height/2-(stage.top+stage.height/2))<stage.height*.16;
  })).toBe(true);
 };
 await centered();
 await page.locator("#simulator-controls-toggle").click();
 await page.locator("#sim-exercise-select").selectOption("24");
 await page.locator("#simulator-next").click();
 await centered();
 const methods=page.locator("#simulator-method-tabs [data-method-index]");
 if(await methods.count()>1){
  await methods.nth(1).click();
  await page.locator("#simulator-next").click();
  await centered();
 }
});

test("Ctrl/Meta+rueda no modifica el zoom y el panel flotante evita el nodo activo",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/");
 await goToSpace(page, "simulator");
 const canvas=page.locator("#flow-diagram-container"),stage=page.locator("#diagram-stage");
 await expect(canvas).toHaveAttribute("data-camera-zoom",/.+/);
 const zoom=Number(await canvas.getAttribute("data-camera-zoom"));
 await page.evaluate(()=>{
  const s=document.querySelector("#diagram-stage");
  s.dispatchEvent(new WheelEvent("wheel",{deltaY:180,ctrlKey:true,bubbles:true,cancelable:true}));
 });
 await expect(stage).toHaveAttribute("data-wheel-zoom-blocked","1");
 expect(Number(await canvas.getAttribute("data-camera-zoom"))).toBe(zoom);
 await page.locator("#simulator-controls-toggle").click();
 await expect(page.locator("#simulator-controls-panel")).toHaveAttribute("data-avoids-active-node","true");
 const overlap=await page.evaluate(()=>{
  const p=document.querySelector("#simulator-controls-panel").getBoundingClientRect();
  const n=document.querySelector("#flow-svg .diagram-node.is-active")?.getBoundingClientRect();
  return !!n&&p.left<n.right+10&&p.right>n.left-10&&p.top<n.bottom+10&&p.bottom>n.top-10;
 });
 expect(overlap).toBe(false);
 await page.keyboard.press("Escape");
 await expect(page.locator("#simulator-controls-panel")).toBeHidden();
});

test("la navegación de Aprende conserva cuatro etiquetas legibles a 390 px",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");
 await goToSpace(page,"learn");
 const nav=page.locator("#primary-nav");
 await expect(nav.locator('[data-subnav-section="aprende"] .nav-button')).toHaveCount(4);
 const report=await nav.evaluate(el=>{
  const box=el.getBoundingClientRect();
  const items=[...el.querySelectorAll('[data-subnav-section="aprende"] .nav-button')].map(node=>{
   const r=node.getBoundingClientRect(),style=getComputedStyle(node);
   return {left:r.left,right:r.right,width:r.width,fontSize:parseFloat(style.fontSize),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth};
  });
  return {box:{left:box.left,right:box.right},items};
 });
 expect(report.items.every(item=>item.width>55&&item.fontSize>=11&&item.scrollWidth<=item.clientWidth+1)).toBe(true);
 expect(report.items.every((item,index)=>index===0||item.left>=report.items[index-1].right-1)).toBe(true);
 await goToSpace(page, "simulator");
 await expect(page.locator('#primary-nav [data-subnav-section="aprende"] .nav-button')).toHaveCount(4);
 const dock=page.locator("#dock");
 const transport=dock.locator(".dock-controls .transport-button");
 await expect(transport).toHaveCount(5);
 const geometry=await dock.evaluate(el=>{
  const box=el.getBoundingClientRect();
  const buttons=[...el.querySelectorAll(".dock-controls .transport-button")].map(node=>node.getBoundingClientRect());
  const speed=el.querySelector(".dock-speed>span");
  return {box:{left:box.left,right:box.right},buttons:buttons.map(r=>({left:r.left,right:r.right,width:r.width})),
    speed:speed?{scrollWidth:speed.scrollWidth,clientWidth:speed.clientWidth}:null};
 });
 expect(geometry.buttons.every(button=>button.width>=16&&button.left>=geometry.box.left-1&&button.right<=geometry.box.right+1)).toBe(true);
 expect(geometry.speed===null||geometry.speed.scrollWidth<=geometry.speed.clientWidth+2).toBe(true);
});
