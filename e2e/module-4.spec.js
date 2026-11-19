import { test, expect, goToSpace } from "./navigation.js";

async function openLab(page){
  await page.goto("/");
  await goToSpace(page, "simulator");
  await goToSpace(page, "lab");
  if(await page.locator("#lab-topic-home").isVisible())await page.locator('[data-lab-topic="diagramas-flujo"]').click();
}
async function startMechanic(page,id){
  await page.locator('#lab-mode-cards [data-lab-activity="'+id+'"]').click();
  await expect(page.locator("#lab-prepare-dialog")).toBeVisible();
  await page.locator("#lab-prepare-play").click();
}

test("Laboratorio empieza por competencias y temas sin mostrar mecánicas",async({page})=>{
  await page.goto("/");await goToSpace(page,"lab");
  await expect(page.locator("#lab-topic-home")).toBeVisible();
  await expect(page.locator("#lab-topic-home [data-lab-topic]")).toHaveCount(5);
  await expect(page.locator(".lab-catalog-filters")).toBeHidden();
  await expect(page.locator("#lab-mode-cards")).toBeHidden();
  await page.locator('[data-lab-topic="diagramas-flujo"]').click();
  await expect(page.locator("#lab-topic-heading")).toBeVisible();
  await expect(page.locator("#lab-mode-cards [data-lab-activity]")).toHaveCount(10);
  await page.locator("#lab-topic-back").click();
  await expect(page.locator("#lab-topic-home")).toBeVisible();
});

test("Laboratorio organiza diez mecánicas en tres familias",async({page})=>{
  await openLab(page);
  await expect(page.locator("#lab-mode-cards .lab-family-band")).toHaveCount(3);
  await expect(page.locator("#lab-mode-cards [data-lab-mode][data-lab-activity]")).toHaveCount(10);
  await expect(page.locator("#lab-mode-cards")).toContainText("Observa");
  await expect(page.locator("#lab-mode-cards")).toContainText("Construye");
  await expect(page.locator("#lab-mode-cards")).toContainText("Investiga");
  await expect(page.locator("#lab-mode-cards [data-lab-activity='match']")).toContainText("Empareja");
  await page.locator("#lab-mode-cards").screenshot({path:"test-results/lab-mode-cards.png"});
});

test("los filtros de concepto y dificultad actualizan la portada; la partida recuerda su selección",async({page})=>{
  await openLab(page);
  await page.locator('#lab-filter-concepts [data-lab-filter-concept="operaciones"]').click();
  await expect(page.locator('#lab-mode-cards [data-lab-activity="match"]')).toBeHidden();
  await expect(page.locator('#lab-mode-cards [data-lab-activity="fill-gap"]')).toBeVisible();
  await page.locator("#lab-filter-clear").click();
  await page.locator('#lab-mode-cards [data-lab-activity="match"]').click();
  await expect(page.locator("#lab-prepare-dialog")).toBeVisible();
  await expect(page.locator('#lab-prepare-concepts [data-prepare-concept]')).toHaveCount(1);
  await expect(page.locator('#lab-prepare-concepts [data-prepare-concept="figuras"]')).toHaveAttribute("aria-pressed","true");
  await page.locator('#lab-prepare-levels [data-prepare-level="2"]').click();
  await page.locator("#lab-prepare-play").click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("traza:v2:progress")));
  expect(saved.topics["diagramas-flujo"].lastConcept).toBe("figuras");
});

test("las tarjetas reservan el arte y Empareja completa sus seis parejas",async({page})=>{
  await page.setViewportSize({width:375,height:850});
  await openLab(page);
  const card=page.locator('#lab-mode-cards [data-lab-activity="match"]');
  const art=card.locator(".lab-mechanic-art"),title=card.locator("strong");
  const artBox=await art.boundingBox(),titleBox=await title.boundingBox();
  expect(artBox).not.toBeNull();expect(titleBox).not.toBeNull();
  expect(artBox.y+artBox.height).toBeLessThanOrEqual(titleBox.y);
  await card.click();await page.locator("#lab-prepare-play").click();
  for(const id of await page.locator("#lab-task-content [data-match-left]").evaluateAll(items=>items.map(item=>item.dataset.matchLeft))){
    await page.locator('#lab-task-content [data-match-left="'+id+'"]').click();
    await page.locator('#lab-task-content [data-match-right="'+id+'"]').click();
  }
  await expect(page.locator("#lab-match-feedback")).toContainText("Completaste las seis parejas");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("traza:v2:progress")));
  expect(saved.exercises["1"].match.stars).toBe(3);
});

test("Empareja ofrece una pista en el primer error y revela la pareja en el segundo",async({page})=>{
  await openLab(page);
  await startMechanic(page,"match");
  const left=page.locator('#lab-task-content [data-match-left]').first();
  const id=await left.getAttribute("data-match-left");
  const wrong=page.locator('#lab-task-content [data-match-right]:not([data-match-right="'+id+'"])').first();
  await left.click();await wrong.click();
  await expect(page.locator("#lab-match-feedback")).toContainText("Ver lección sobre los símbolos");
  await page.locator('#lab-task-content [data-match-left="'+id+'"]').click();
  await page.locator('#lab-task-content [data-match-right]:not([data-match-right="'+id+'"])').first().click();
  await expect(page.locator('#lab-task-content [data-match-left="'+id+'"]')).toBeDisabled();
  await expect(page.locator("#lab-match-feedback")).toContainText("Te muestro la pareja correcta");
  await expect(page.locator("#lab-task-content [data-match-left]:not(:disabled)")).toHaveCount(5);
});

test("Sigue la ficha conserva traza y predicción",async({page})=>{
  await openLab(page);
  await startMechanic(page,"predict");
  await expect(page.locator("#lab-context-title")).toContainText("Suma de dos números");
  await expect(page.locator("#lab-diagram-container svg")).toBeVisible();
  await page.locator('#lab-activity-list [data-lab-activity="predict"]').click();
  await page.locator("#lab-task-content [data-predict]").first().click();
  await page.locator("#lab-reveal-prediction").click();
  await expect(page.locator("#lab-predict-feedback")).toContainText("El evento real es");
});

test("Arma el diagrama agrupa ordenar, identificar símbolos y completar huecos",async({page})=>{
  await openLab(page);
  await startMechanic(page,"order");
  await expect(page.locator('#lab-activity-list [data-lab-activity="order"]')).toBeVisible();
  await page.locator('#lab-activity-list [data-lab-activity="order"]').click();
  await expect(page.locator("#lab-task-title")).toContainText("Ordena instrucciones");
  await page.locator('#lab-activity-list [data-lab-activity="symbol"]').click();
  await expect(page.locator("#lab-task-title")).toContainText("figura");
  await page.locator('#lab-activity-list [data-lab-activity="fill-gap"]').click();
  await expect(page.locator("#lab-task-title")).toContainText("hueco");
});

test("el lienzo libre vive dentro de Arma el diagrama y permite añadir piezas",async({page})=>{
  await openLab(page);
  await startMechanic(page,"build-diagram");
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
  const cards=page.locator("#builder-canvas-list [data-node-card]");
  const initial=await cards.count();
  await page.locator('#lab-builder-stage [data-add-node="process"]').click();
  await expect(cards).toHaveCount(initial+1);
  await expect(page.locator("#view-lab")).toBeVisible();
  await expect(page.locator("#view-builder")).toHaveCount(0);
});

test("Caza el error localiza la línea y compara una corrección con los mismos datos",async({page})=>{
  await openLab(page);
  await startMechanic(page,"error");
  await page.locator('[data-error-line="0"]').click();
  await expect(page.locator("#lab-task-content")).toContainText("Elegiste: M=0");
  await page.locator('[data-error-fix="0"]').click();
  await expect(page.locator("#lab-error-feedback")).toContainText("ANTES · ORIGINAL");
  await expect(page.locator("#lab-error-feedback")).toContainText("DESPUÉS · CORRECCIÓN");
});

test("¿Y si...? compara ambos recorridos e identifica su primera divergencia",async({page})=>{
  await openLab(page);
  await startMechanic(page,"whatif");
  await page.locator("#lab-whatif-code").fill("leer a,b\nimp a-b");
  await page.locator("#lab-whatif-inputs").fill("8,5");
  await page.locator('[data-whatif-predict="changes"]').click();
  await page.locator("#lab-whatif-run").click();
  await expect(page.locator("#lab-whatif-result")).toContainText("[13]");
  await expect(page.locator("#lab-whatif-result")).toContainText("[3]");
  await expect(page.locator("#lab-whatif-result")).toContainText("PRIMER PUNTO DE DIVERGENCIA");
});
