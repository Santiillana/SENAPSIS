import { test, expect, goToSpace } from "./navigation.js";
import { FICHA } from "../src/content/ficha.js";

const snapshot=()=>{
  const payload=structuredClone(FICHA);
  payload.meta.esDemostracion=false;
  payload.meta.fuente="Publicación de prueba";
  return payload;
};

test("una nueva publicación se descarga, se conserva localmente y muestra su versión",async({page})=>{
  const payload=snapshot();
  await page.setViewportSize({width:390,height:844});
  await page.route("**/api/v1/version",route=>route.fulfill({json:{version:2,updatedAt:"2026-11-19T18:05:00Z"}}));
  await page.route("**/api/v1/state",route=>route.fulfill({json:{version:2,updatedAt:"2026-11-19T18:05:00Z",payload}}));
  await page.goto("/");await goToSpace(page,"hoy");
  await expect(page.locator("#ficha-sync-indicator")).toContainText("Actualizado hoy");
  await expect(page.locator("#ficha-sync-indicator")).toBeVisible();
  await expect(page.locator(".ficha-demo-notice")).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("senapsis:v1:ficha-publicada")||"null")?.version)).toBe(2);
});

test("la última ficha guardada sigue disponible cuando falla la API",async({page})=>{
  const payload=snapshot();
  await page.addInitScript(value=>localStorage.setItem("senapsis:v1:ficha-publicada",JSON.stringify({version:4,updatedAt:"2026-11-18T18:05:00Z",payload:value})),payload);
  await page.route("**/api/v1/version",route=>route.abort());
  await page.goto("/");await goToSpace(page,"hoy");
  await expect(page.locator("#ficha-sync-indicator")).toContainText("Sin conexión");
  await expect(page.locator(".ficha-demo-notice")).toHaveCount(0);
});
