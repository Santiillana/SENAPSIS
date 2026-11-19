import {test,expect,goToSpace} from "./navigation.js";

async function openSourceLab(page){
  await page.goto("/");await page.evaluate(()=>localStorage.removeItem("traza:v2:learn"));await page.reload();await goToSpace(page,"learn");
  await page.locator('[data-learn-competence="establecer-requisitos"]').click();
  await page.locator('[data-topic-open="fuentes-informacion"]').click();
  await goToSpace(page,"lab");
  await expect(page.locator("#view-lab")).toBeVisible();
}

test("el catálogo muestra seis mecánicas y completa una partida con progreso",async({page})=>{
  await openSourceLab(page);
  await expect(page.locator("[data-lab-source-mechanic]")).toHaveCount(6);
  await page.locator('[data-lab-source-mechanic="classify"]').click();
  for(let round=0;round<5;round++){
    await page.locator("#lab-task-content [data-source-correct=true]").click();
    await expect(page.locator("#source-lab-feedback")).toContainText("¡Correcto!");
    if(round<4)await page.locator("[data-source-lab-next]").click();
    else await page.locator("[data-source-lab-next]").click();
  }
  await expect(page.locator(".lab-session-finish")).toContainText("5 de 5");
  await expect(page.locator(".lab-finish-stars span.is-earned")).toHaveCount(3);
  await page.locator("[data-source-lab-back]").click();
  await expect(page.locator('[data-lab-source-mechanic="classify"]')).toContainText("★★★");
});

test("la mecánica de orden ofrece controles accesibles y feedback",async({page})=>{
  await openSourceLab(page);await page.locator('[data-lab-source-mechanic="order"]').click();
  await expect(page.locator("#source-lab-order [data-source-order-move]")).toHaveCount(8);
  const list=page.locator("#source-lab-order");
  for(let target=0;target<4;target++){
    const desired=["question","source","collect","verify"][target];
    while(await list.locator("li").nth(target).getAttribute("data-order-id")!==desired){
      const desiredIndex=await list.locator("li").evaluateAll((items,id)=>items.findIndex(item=>item.dataset.orderId===id),desired);
      if(desiredIndex<target)break;
      await list.locator("li").nth(desiredIndex).locator('[data-source-order-move="up"]').click();
    }
  }
  await page.locator("[data-source-order-check]").click();
  await expect(page.locator("#source-lab-feedback")).toContainText("¡Correcto!");
});

test("el catálogo de fuentes se adapta a 375, 768 y 1280 píxeles",async({page})=>{
  for(const width of [375,768,1280]){
    await page.setViewportSize({width,height:900});await openSourceLab(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});
