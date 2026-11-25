import { test, expect } from "./navigation.js";
import { FICHA } from "../src/content/ficha.js";

test("Administrar previsualiza el borrador, muestra historial y exporta/importa JSON",async({page})=>{
  let savedPayload=null;
  await page.route("**/api/v1/admin/session",route=>route.fulfill({json:{authenticated:true,email:"moderator@example.edu"}}));
  await page.route("**/api/v1/admin/draft",async route=>{
    if(route.request().method()==="GET")return route.fulfill({json:{baseVersion:2,payload:null}});
    savedPayload=route.request().postDataJSON();return route.fulfill({json:{saved:true,baseVersion:2,updatedAt:"2026-11-19T18:05:00Z"}});
  });
  await page.route("**/api/v1/state",route=>route.fulfill({json:{version:2,updatedAt:"2026-11-19T18:00:00Z",payload:FICHA}}));
  await page.route("**/api/v1/admin/history",route=>route.fulfill({json:{publications:[{version:2}],audit:[{action:"published",version:2,created_at:"2026-11-19T18:00:00Z",actor:"moderator@example.edu",summary:{sections:["clases"]}}]}}));
  await page.setViewportSize({width:390,height:844});await page.goto("/administrar.html");
  await page.locator('[data-admin-tab="management"]').click();
  await expect(page.locator("#admin-history")).toContainText("published");
  await page.locator("[data-admin-preview]").click();
  await expect(page.locator("#admin-preview-dialog")).toBeVisible();
  await expect(page.locator("#admin-preview-frame")).toHaveAttribute("src",/preview=admin/);
  await expect(page.frameLocator("#admin-preview-frame").locator("#ficha-sync-indicator")).toContainText("Vista previa del borrador");
  await page.locator("[data-admin-preview-close]").click();
  await expect(page.locator("#admin-preview-dialog")).not.toBeVisible();
  const downloadPromise=page.waitForEvent("download");await page.locator("[data-admin-export]").click();
  const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/^senapsis-ficha-\d{4}-\d{2}-\d{2}\.json$/);
  const replacement=structuredClone(FICHA);replacement.meta.ficha="Respaldo importado";
  page.on("dialog",dialog=>dialog.accept());
  await page.locator("[data-admin-import]").setInputFiles({name:"respaldo.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({format:"senapsis-ficha",schemaVersion:1,payload:replacement}))});
  await expect(page.locator("#admin-feedback")).toContainText("Borrador guardado",{timeout:5000});
  expect(savedPayload.meta.ficha).toBe("Respaldo importado");
  await expect(page.locator('[data-manage-form="meta"] [name="ficha"]')).toHaveValue("Respaldo importado");
});
