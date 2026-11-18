import { test, expect, goToSpace } from "./navigation.js";

test("el ejercicio 24 mantiene la traza en pasos elegidos, escritorio y móvil",async({page})=>{
  const sizes=[
    {name:"desktop",width:1920,height:1080},
    {name:"mobile",width:390,height:844}
  ];
  for(const size of sizes){
    await page.setViewportSize({width:size.width,height:size.height});
    await page.goto("/");
    await goToSpace(page, "simulator");
    await page.locator("#simulator-controls-toggle").click();
    await page.locator("#sim-exercise-select").selectOption("24");
    await expect(page.locator("#flow-svg")).toBeVisible();
    if(size.name==="mobile"){
      await page.locator('#simulator-mobile-tabs [data-mobile-panel="diagram"]').click();
      await expect(page.locator("#flow-diagram-container")).toBeVisible();
    }
    for(const step of [1,3,7]){
      await page.locator("#simulator-timeline").evaluate((input,value)=>{
        input.value=String(value);
        input.dispatchEvent(new Event("input",{bubbles:true}));
      },step);
      await expect(page.locator("#timeline-count")).toContainText("/");
      await expect(page.locator("#flow-svg")).toBeVisible();
    }
  }
});
