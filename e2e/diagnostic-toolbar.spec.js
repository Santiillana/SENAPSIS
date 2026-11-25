import { test, expect, goToSpace } from "./navigation.js";

test("el panel de controles se adapta a escritorio, tableta y móvil",async({page})=>{
  for(const width of [1920,1440,1280,1024,900,390]){
    await page.setViewportSize({width,height:900});
    await page.goto("/");
    await goToSpace(page, "simulator");
    const data=await page.evaluate(()=>{
      const selectors=["#hd","#primary-nav","#simulator-status","#simulator-controls-toggle","#diagram-stage","#dock","#simulator-mobile-tabs"];
      return Object.fromEntries(selectors.map(selector=>{
        const element=document.querySelector(selector),box=element?.getBoundingClientRect();
        return [selector,box?{x:box.x,right:box.right,width:box.width,height:box.height,display:getComputedStyle(element).display}:null];
      }));
    });
    console.log("SENAPSIS_LAYOUT "+width+" "+JSON.stringify(data));
    expect(data["#diagram-stage"].width).toBeGreaterThan(0);
    expect(data["#dock"].right).toBeLessThanOrEqual(width+1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,"desbordamiento en "+width+"px").toBeLessThanOrEqual(1);
    if(width<=900)await expect(page.locator("#simulator-mobile-tabs")).toBeVisible();
    else await expect(page.locator("#simulator-mobile-tabs")).toBeHidden();
  }
});
