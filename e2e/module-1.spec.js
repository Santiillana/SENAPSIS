import { test, expect } from "@playwright/test";
import { goToSpace } from "./navigation.js";

test("la portada presenta Mi ficha y Aprende como dos secciones principales", async ({page}) => {
  const errors=[];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('[data-view="home"]')).toBeVisible();
  await expect(page.locator('[data-home-section="ficha"]')).toBeVisible();
  await expect(page.locator('[data-home-section="aprende"]')).toBeVisible();
  await expect(page.locator("#primary-nav [data-space]")).toHaveCount(8);
  await expect(page.locator('[data-space="home"]')).toBeAttached();
  expect(errors).toEqual([]);
});

test("Mi ficha y Aprende conservan sus grupos de navegación y recuerdan su última vista", async ({page}) => {
  await page.goto("/");
  await goToSpace(page,"actividades");
  await expect(page.locator('[data-view="actividades"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-section","ficha");
  await expect(page.locator('[data-section-switch="ficha"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator('#primary-nav [data-subnav-section="ficha"] .nav-button')).toHaveCount(4);

  await goToSpace(page,"simulator");
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-section","aprende");
  await expect(page.locator('#primary-nav [data-subnav-section="aprende"] .nav-button')).toHaveCount(4);
  await expect(page.locator('[data-section-switch="ficha"]')).toBeVisible();

  await goToSpace(page,"home");
  await page.locator('[data-section-switch="ficha"]').click();
  await expect(page.locator('[data-view="actividades"]')).toBeVisible();
  await page.locator('.brand[data-go="home"]').click();
  await page.locator('[data-section-switch="aprende"]').click();
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
});

const viewports=[
  {name:"escritorio",width:1440,height:1000},
  {name:"portátil",width:1080,height:900},
  {name:"tableta",width:760,height:900},
  {name:"móvil",width:440,height:844}
];

for(const viewport of viewports){
  test("la navegación responde sin desbordamiento en "+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto("/");
    await goToSpace(page,"learn");
    const geometry=await page.evaluate(()=>{
      const selectors=[".brand",".section-switch",".topbar-actions"];
      const rects=selectors.map(selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      });
      return {
        topbarOverflow:document.querySelector("#hd").scrollWidth-document.querySelector("#hd").clientWidth,
        pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        navPosition:getComputedStyle(document.querySelector("#primary-nav")).position,
        sameRow:Math.max(...rects.map(r=>r.bottom))-Math.min(...rects.map(r=>r.top))
      };
    });
    expect(geometry.topbarOverflow,viewport.name+" barra superior").toBeLessThanOrEqual(1);
    expect(geometry.pageOverflow,viewport.name+" documento").toBeLessThanOrEqual(1);
    if(viewport.width<=760)expect(geometry.navPosition).toBe("fixed");
    else expect(geometry.navPosition).not.toBe("fixed");
  });
}

test("el simulador conserva sus cuatro ventanas, dock y SVG",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page,"simulator");
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR","#dock","#flow-svg"]){
    await expect(page.locator(selector)).toBeVisible();
  }
  await expect(page.locator("#simulator-output-details")).toBeAttached();
  await expect(page.locator("#simulator-history-details")).toBeAttached();
  const dock=await page.locator("#dock").boundingBox();
  const stage=await page.locator("#diagram-stage").boundingBox();
  expect(dock).not.toBeNull();expect(stage).not.toBeNull();
  expect(dock.y).toBeGreaterThan(stage.y);
});

test("cada sección conserva su tema propio y movimiento reducido sigue funcionando",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-section","home");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion","reduced");

  await page.locator('[data-action="toggle-theme"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");

  await goToSpace(page,"hoy");
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await page.locator('[data-action="toggle-theme"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");

  await goToSpace(page,"learn");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.locator('[data-action="toggle-theme"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");

  await goToSpace(page,"hoy");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await goToSpace(page,"home");
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await page.locator('[data-action="toggle-motion"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-motion","full");
});
