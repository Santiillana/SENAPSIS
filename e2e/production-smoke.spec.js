import { test, expect, goToSpace } from "./navigation.js";

test("humo de producción: Factorial, Mayor de 10 números, Concentración y Predice",async({page},testInfo)=>{
  // Medido: 10.9 s aislado y 20.7 s con dos workers mientras se ejecuta el recorrido de hasta 50 pasos.
  test.setTimeout(35_000);
  await page.route("**/api/v1/version",route=>route.fulfill({json:{version:0,updatedAt:null}}));
  const consoleErrors=[];
  page.on("console",message=>{if(message.type()==="error")consoleErrors.push(message.text());});
  page.on("pageerror",error=>consoleErrors.push(error.message));
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await expect(page.locator('meta[name="senapsis-release"]')).toHaveAttribute("content",/^senapsis-v1-/);
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await expect(page.locator("#flow-svg")).toBeVisible();

  await page.locator("#sim-exercise-select").selectOption("21");
  await expect(page.locator("#simulator-exercise-title")).toContainText("Factorial de un número");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-next").click();
  await page.locator("#simulator-next").click();
  await page.screenshot({path:testInfo.outputPath("production-factorial-normal-1920.png"),animations:"disabled"});

  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await page.keyboard.press("ArrowRight");
  await page.screenshot({path:testInfo.outputPath("production-factorial-focus-1920.png"),animations:"disabled"});
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
  await page.locator("#simulator-controls-toggle").click();

  await page.locator("#sim-exercise-select").selectOption("24");
  await expect(page.locator("#simulator-exercise-title")).toContainText("Encontrar el mayor de diez números");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#simulator-predict").click();
  for(let i=0;i<50;i++){
    if(await page.locator("#simulator-question").isVisible())break;
    await page.locator("#simulator-next").click();
  }
  await expect(page.locator("#simulator-question")).toBeVisible();
  await page.locator("#simulator-question [data-prediction-answer]").first().click();
  await page.locator("#simulator-question-reveal").click();

  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("21");
  await page.screenshot({path:testInfo.outputPath("production-mobile-normal-390.png"),fullPage:true,animations:"disabled"});
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await page.screenshot({path:testInfo.outputPath("production-mobile-focus-390.png"),animations:"disabled"});
  await page.keyboard.press("Escape");
  expect(consoleErrors).toEqual([]);
});
