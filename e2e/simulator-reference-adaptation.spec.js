import { test, expect, goToSpace } from "./navigation.js";

test("el simulador ofrece los 45 ejercicios y filtra por texto y nivel",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await expect(page.locator("#simulator-exercise-nav")).toBeVisible();
  await page.locator('#simulator-exercise-nav [data-exercise-shortcut="22"]').click();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Potencia");
  await page.locator("#simulator-controls-toggle").click();
  await expect(page.locator("#sim-exercise-select option")).toHaveCount(45);
  await expect(page.locator("#simulator-exercise-nav [data-exercise-shortcut]")).toHaveCount(45);
  await page.locator("#sim-exercise-search").fill("Factorial");
  await expect(page.locator("#sim-exercise-select option")).toHaveCount(1);
  await expect(page.locator("#sim-exercise-select option").first()).toContainText("Factorial");
  await page.locator("#sim-exercise-search").fill("");
  await page.locator("#sim-exercise-level-filter").selectOption("expert");
  await expect(page.locator("#simulator-exercise-nav [data-exercise-shortcut]")).toHaveCount(5);
});

test("Aprende y Mi ficha mantienen sus pestañas separadas al volver al simulador",async({page})=>{
  await page.goto("/");
  await goToSpace(page,"simulator");
  await page.locator('#simulator-exercise-nav [data-exercise-shortcut="22"]').click();
  await page.locator('[data-section-switch="ficha"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-section","ficha");
  await expect(page.locator('[data-subnav-section="ficha"]')).toBeVisible();
  await expect(page.locator('[data-subnav-section="aprende"]')).toBeHidden();
  await expect(page.locator("#simulator-exercise-nav")).toBeHidden();
  await page.locator('[data-section-switch="aprende"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-section","aprende");
  await expect(page.locator('[data-subnav-section="aprende"] [data-space="simulator"]')).toHaveAttribute("aria-current","page");
  await expect(page.locator('[data-subnav-section="ficha"]')).toBeHidden();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Potencia");
  await expect(page.locator("#simulator-exercise-nav [aria-pressed='true']")).toHaveAttribute("data-exercise-shortcut","22");
});

test("los métodos se presentan como opciones y cambian el pseudocódigo del motor",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  const methods=page.locator("#simulator-method-tabs [data-method-index]");
  await expect(methods).toHaveCount(2);
  await expect(methods.nth(0)).toHaveAttribute("aria-pressed","true");
  await methods.nth(1).click();
  await expect(methods.nth(1)).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#simulator-method")).toHaveValue("1");
  await expect(page.locator("#pseudocode-lines")).toContainText("imp a+b");
  await page.locator("#simulator-inputs").fill("8 5");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("13");
});

test("cada paso explica el símbolo y el orden de ejecución",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-history-details").evaluate(el=>el.open=true);
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Óvalo · Inicio");
  const input=page.locator("#trace-history li").filter({hasText:"ENTRADA"}).first();
  await input.click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Paralelogramo · Entrada");
  await expect(page.locator(".scene-order-explanation summary")).toHaveText("¿Por qué se ejecuta en este orden?");
  const assignment=page.locator("#trace-history li").filter({hasText:"ASIGNACIÓN"}).first();
  await assignment.click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Rectángulo · Proceso");
  const output=page.locator("#trace-history li").filter({hasText:"SALIDA"}).first();
  await output.click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Documento · Salida");
});
