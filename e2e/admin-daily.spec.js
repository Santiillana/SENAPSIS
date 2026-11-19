import { test, expect } from "./navigation.js";
import { FICHA } from "../src/content/ficha.js";

test("Administrar guarda el registro diario, publica y permite deshacer",async({page})=>{
  let savedPayload=null,publishedVersion=2;
  await page.route("**/api/v1/admin/session",route=>route.fulfill({json:{authenticated:true,email:"moderator@example.edu"}}));
  await page.route("**/api/v1/admin/draft",async route=>{
    if(route.request().method()==="GET")return route.fulfill({json:{baseVersion:2,updatedAt:null,updatedBy:null,payload:null}});
    savedPayload=route.request().postDataJSON();return route.fulfill({json:{saved:true,baseVersion:2,updatedAt:"2026-11-19T18:05:00Z"}});
  });
  await page.route("**/api/v1/state",route=>route.fulfill({json:{version:publishedVersion,updatedAt:"2026-11-19T18:00:00Z",payload:FICHA}}));
  await page.route("**/api/v1/admin/publish",route=>{publishedVersion++;return route.fulfill({json:{published:true,version:publishedVersion,updatedAt:"2026-11-19T18:06:00Z"}});});
  await page.route("**/api/v1/admin/undo",route=>{publishedVersion++;return route.fulfill({json:{undone:true,version:publishedVersion,restoredVersion:2,updatedAt:"2026-11-19T18:07:00Z"}});});
  await page.setViewportSize({width:390,height:844});await page.goto("/administrar.html");
  await expect(page.locator("#admin-session")).toContainText("moderator@example.edu");
  await page.locator('[name="titulo"]').fill("Práctica de validación");
  await page.locator('[name="temas"]').fill("Condiciones\nValidación de entradas");
  await page.locator('[name="documentos"]').fill("Guía de práctica | https://example.edu/guia.pdf");
  await page.locator('[name="evidenciaTitulo"]').fill("Resolver ejercicio aplicado");
  await page.locator('[name="evidenciaLimite"]').fill("2026-11-25");
  await expect(page.locator("#admin-feedback")).toContainText("Borrador guardado",{timeout:5000});
  expect(savedPayload.clases.at(-1).titulo).toBe("Práctica de validación");
  expect(savedPayload.clases.at(-1).temas.map(item=>item.texto)).toEqual(["Condiciones","Validación de entradas"]);
  expect(savedPayload.actividades.at(-1).titulo).toBe("Resolver ejercicio aplicado");
  expect(savedPayload.documentos.at(-1).url).toBe("https://example.edu/guia.pdf");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.locator("[data-admin-publish]").click();
  await expect(page.locator("#admin-version")).toContainText("versión 3");
  page.on("dialog",dialog=>dialog.accept());await page.locator("[data-admin-undo]").click();
  await expect(page.locator("#admin-version")).toContainText("versión 4");
});
