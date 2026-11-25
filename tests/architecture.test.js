import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("la navegación declara portada y espacios de Mi ficha y Aprende", async () => {
  const html = await read("../index.html");
  const spaces = [...html.matchAll(/data-space="([^"]+)"/g)].map(([,space]) => space);
  const views = [...html.matchAll(/data-view="([^"]+)"/g)].map(([,space]) => space);
  assert.deepEqual(spaces, ["home", "hoy", "clases", "actividades", "biblioteca", "learn", "exercises", "simulator"]);
  assert.deepEqual(new Set(views), new Set(["home", "hoy", "clases", "actividades", "biblioteca", "learn", "exercises", "simulator"]));
  assert.doesNotMatch(html, /data-space="lab"|data-view="lab"|lab-builder/);
  assert.doesNotMatch(html, /data-space="builder"/);
  assert.doesNotMatch(html, /data-view="builder"/);
  assert.match(html, /data-subnav-section="ficha"/);
  assert.match(html, /data-subnav-section="aprende"/);
});

test("Inicio ofrece dos enlaces completos y accesibles sin accesos secundarios", async () => {
  const html = await read("../index.html");
  const home = html.match(/<section class="space-view home-view"[\s\S]*?<\/section>/)?.[0] || "";
  const navigation = await read("../src/ui/navigation.js");
  const shell = await read("../src/styles/shell.css");
  assert.equal([...home.matchAll(/<a class="home-card"/g)].length, 2);
  assert.match(home, /data-go="hoy"/);
  assert.match(home, /data-go="learn"/);
  assert.doesNotMatch(home, /home-continue|home-shortcut|home-learning-progress/);
  assert.match(navigation, /event\.key !== " "[\s\S]*card\.click\(\)/);
  assert.match(shell, /\.home-card-enter/);
  assert.match(shell, /\.home-flow \.flow-ball/);
});

test("Aprende separa catálogo, tema y progreso y guarda sus vistas en el progreso actual", async () => {
  const html = await read("../index.html");
  const content = await read("../src/ui/content-view.js");
  const progress = await read("../src/content/learn-progress.js");
  for (const id of ["learn-catalog-home", "learn-competence-filters", "learn-catalog-bands", "learn-topic-space", "learn-progress-page", "learn-progress-topics"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.doesNotMatch(html, /learn-topic-tabs|learn-topic-select|learn-difficulty/);
  assert.match(content, /localStorage\.getItem\("senapsis:v2:learn"\)/);
  assert.match(content, /learnProgress\.theme=selectedTheme/);
  assert.doesNotMatch(content, /learnProgress\.tab|data-topic-tab|learnDifficulty/);
  assert.match(progress, /activityDays/);
});

test("la lección usa lectura continua con seis secciones y cierre explícito",async()=>{
  const content=await read("../src/ui/content-view.js");
  const styles=await read("../src/styles/lesson-reading.css");
  for(const id of ["lesson-idea","lesson-concept","lesson-term","lesson-example","lesson-practice","lesson-summary"]){
    assert.ok(content.includes('id="'+id+'"'),"Falta la sección "+id);
  }
  assert.match(content,/data-lesson-complete/);
  assert.match(content,/data-skip-practice/);
  assert.match(content,/lessonClock\.advance/);
  assert.match(styles,/grid-template-columns:320px minmax\(0,1fr\)/);
  assert.match(styles,/@media\(max-width:800px\)/);
  assert.match(content,/LESSON_TERMS/);
});

test("las recetas del bloque inicial entran en el reproductor y mantienen estático numerado",async()=>{
  const content=await read("../src/ui/content-view.js");
  const recipes=await read("../src/ui/kit/recipes.js");
  assert.match(content,/recipeSceneMarkup\(recipe,frame,recipeMomentIndex/);
  assert.match(content,/recipe-static-sequence/);
  for(const id of ["algorithm","reading","terminals"])assert.match(recipes,new RegExp(id+":"));
});

test("el simulador reserva las cuatro ventanas pedagógicas y el dock", async () => {
  const html = await read("../index.html");
  for (const marker of ["problem-panel", "diagram-panel", "scene-panel", "variables-panel", "execution-dock"]) {
    assert.ok(html.includes(marker), "Falta la zona " + marker);
  }
  for (const id of ["sim-window-context", "sim-window-code", "PV", "PR", "dock"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test("la interfaz contempla tabletas y móviles", async () => {
  const css = await read("../src/styles/responsive.css");
  assert.match(css, /max-width:\s*1080px/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /max-width:\s*440px/);
});

test("el movimiento reducido se puede activar y respeta la preferencia del sistema", async () => {
  const css = await read("../src/styles/motion.css");
  const preferences = await read("../src/ui/preferences.js");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /data-motion="reduced"/);
  assert.match(preferences, /prefers-reduced-motion:\s*reduce/);
  assert.match(preferences, /toggle-motion/);
});

test("el prototipo original permanece accesible durante la transición", async () => {
  const html = await read("../index.html");
  assert.match(html, /reference\/diagramas_de_flujo_original\.html/);
});

test("la nueva capa de interfaz no ejecuta pseudocódigo como JavaScript", async () => {
  const app = await read("../src/app.js");
  const navigation = await read("../src/ui/navigation.js");
  const preferences = await read("../src/ui/preferences.js");
  const source = [app, navigation, preferences].join("\n");
  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.doesNotMatch(source, /new\s+Function\s*\(/);
});

test("Ejercicios adapta los retos al catálogo por tema con filtros combinables y detalle protegido",async()=>{
  const html=await read("../index.html");
  const source=await read("../src/ui/content-view.js");
  const adapter=await read("../src/content/exercise-adapter.js");
  for(const id of ["exercise-search","exercise-difficulty-options","exercise-class-only","exercise-filter-summary","exercise-grid","exercise-detail","exercise-topic-count","exercise-list-disclosure"]){
    assert.match(html,new RegExp('id="'+id+'"'),"Falta el control "+id);
  }
  assert.doesNotMatch(html,/id="exercise-count"|id="exercise-level-shortcuts"|id="exercise-try-modal"/);
  assert.ok(source.includes("const CLASS_EXERCISES = new Set([22,23,24,28]);"),"Los cuatro retos de clase no deben cambiar.");
  assert.match(source,/function renderExerciseCards\(\)/);
  assert.match(source,/function renderExerciseDetail\(\)/);
  assert.match(source,/data-start-exercise/);
  assert.match(source,/data-reveal-solution/);
  assert.match(source,/data-exercise-difficulty/);
  assert.match(source,/data-open-exercise-lesson/);
  assert.match(source,/Marcar como resuelto/);
  assert.match(adapter,/export function validateExercise/);
  assert.match(adapter,/oraculo: \(\) => exercise\.methods/);
});


test("Mi ficha consolida Clases en vistas diaria, semanal y mensual", async () => {
  const html = await read("../index.html");
  const app = await read("../src/app.js");
  const classes = await read("../src/ficha/view-clases.js");
  assert.match(html, /data-space="clases"/);
  assert.match(html, /id="view-clases" data-view="clases"/);
  assert.match(app, /initFicha/);
  for (const marker of ["data-class-view", "data-class-week", "data-class-month", "data-class-date", "aria-activedescendant", "Sin registro de este día"]) {
    assert.ok(classes.includes(marker), "Falta el comportamiento de Clases: " + marker);
  }
  assert.doesNotMatch(html, /data-space="semana"|data-space="calendario"/);
});
