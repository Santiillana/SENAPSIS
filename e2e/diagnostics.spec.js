import { test, expect, goToSpace } from "./navigation.js";

test("la aplicación completa inicia sin excepciones JavaScript",async({page})=>{
  const pageErrors=[];
  const consoleErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack??error.message));
  page.on("console",message=>{
    if(message.type()==="error")consoleErrors.push(message.text());
  });
  const response=await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await goToSpace(page,"exercises");
  await expect(page.locator("#primary-nav [data-space='exercises']")).toBeVisible();
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
  await goToSpace(page, "learn");
  await expect(page.locator('[data-view="learn"]')).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
