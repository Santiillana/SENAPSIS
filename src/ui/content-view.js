import { lessons as flowLessons } from "../content/lessons.js";
import { mathLessons, mathLessonById } from "../content/math-lessons.js";
import { sourceLessons, sourceLessonById, sourceLessonGlossary } from "../content/sources-lessons.js";
import { sourceExercises, sourceExerciseLevels } from "../content/source-exercises.js";
import { sourceScenarios } from "../content/source-scenarios.js";
import { renderSourceScene } from "./lessons/sources.js";
import { rutas } from "../content/rutas.js";
import { exercises } from "../content/exercises.js";
import { executePseudocode } from "../core/interpreter.js";
import { renderScene, createClock, lessonRecipe, recipeFrame, recipeMoment, recipeMomentIndex, recipeSceneMarkup } from "./kit/index.js";
import { parsePseudocode } from "../core/parser.js";
import { temas, competenciasAprende, temaPorId } from "../content/temas.js";
import { conceptos, conceptoPorEtiqueta } from "../content/conceptos.js";
import { normalizeLearnProgress, dateInBogota, currentStreak, calculateLessonProgress, setLessonCompleted } from "../content/learn-progress.js";
import { adaptLegacyExercise } from "../content/exercise-adapter.js";
import { conceptMedals } from "./lab/progress.js";
import { competenceMarker } from "../ficha/competencias-ui.js";
import { mathExercises, mathExerciseById } from "../math/exercises.js";
import { generateMathExercise } from "../math/generators.js";
import { compare, formatRational, parseRationalAnswer } from "../math/exact.js";
import { initSheetThemes, syncSheetThemes } from "./sheet-theme.js";
import { availableExerciseSolutionSections } from "../content/exercise-solution.js";

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const LEVELS = {
  basic:{label:"Básico",className:"level-basic"},
  intermediate:{label:"Intermedio",className:"level-intermediate"},
  advanced:{label:"Avanzado",className:"level-advanced"},
  expert:{label:"Experto",className:"level-expert"}
};
const lessons = [...flowLessons, ...mathLessons, ...sourceLessons];
let selectedLesson = lessons[0].id;
let lessonVisualStep = 0;
let lessonScreenStep = 0;
let lessonPlaybackFrame = 0;
let lessonClock = null;
let lessonPlaying = false;
let lessonAutoplayStarted = false;
let lessonPlaybackComplete = false;
let lessonEntrySeen = new Set();
let lessonFigureObserver = null;
let lessonMotionObserver = null;
let learnProgress = readLearnProgress();
let selectedTheme = learnProgress.theme;
let selectedCompetence = temas.find(item=>item.id===selectedTheme)?.competenciaId ?? null;
let selectedExercise = null;
let selectedMethod = 0;
let exerciseQuery = "";
let exerciseLevels = new Set();
let exerciseClassOnly = false;
let progressReturnFocus = null;
let exerciseBank = "diagramas";
let mathTopicFilter = "todos";
let selectedExerciseTheme = null;
const exerciseDetailScroll = new Map();
let lastContentSpace = null;
let selectedMathExercise = null;
let selectedSourceExercise = null;
const sourceExerciseAnswers = new Map();
const generatedMathExercises = [];
const revealedMathSolutions = new Set();
const mathAnswerResults = new Map();
const revealedExerciseSolutions = new Set();
const CLASS_EXERCISES = new Set([22,23,24,28]);
const LESSON_TERMS = {
  algorithm:"Algoritmo",reading:"Flujo y secuencia",terminals:"Símbolos de diagrama",
  input:"Entrada",process:"Proceso",output:"Salida",variables:"Variable",arithmetic:"Operación aritmética",
  comparisons:"Operadores relacionales",decisions:"Decisión","nested-decisions":"Decisión anidada",
  "counters-accumulators":"Contador y acumulador",for:"Ciclo Para",while:"Ciclo Mientras",
  "do-while":"Ciclo Hacer–Mientras","nested-loops":"Ciclos anidados","validation-sentinel":"Validación con centinela"
};
for (const lesson of mathLessons) LESSON_TERMS[lesson.id] = lesson.term;
for (const lesson of sourceLessons) LESSON_TERMS[lesson.id] = lesson.term;

export function exerciseConceptLabels(item){
  const labels=new Set();
  const map={input:"Entrada de datos",assignment:"Asignación",output:"Imprimir",if:"Decisiones",for:"Ciclo Para",while:"Ciclo Mientras",doWhile:"Ciclo Hacer–Mientras"};
  let nestedLoop=false;
  for(const method of item.methods){
    try{
      const root=parsePseudocode(method.pseudocode);
      const walk=(nodes,depth=0)=>{
        for(const node of nodes??[]){
          if(map[node.type])labels.add(map[node.type]);
          if(["for","while","doWhile"].includes(node.type)){
            if(depth>0)nestedLoop=true;
            walk(node.body,depth+1);
          }
          if(node.type==="if"){
            walk(node.thenBody,depth);walk(node.elseBody,depth);
          }
        }
      };
      walk(root.body);
      const source=method.pseudocode.toLocaleLowerCase("es");
      if(/(?:\+|-|\*|\/)/.test(source))labels.add("Operaciones aritméticas");
      if(/(?:<=|>=|<>|!=|==|<|>)/.test(source))labels.add("Comparaciones");
    }catch{}
  }
  const concepts=(item.concepts??[]).join(" ").toLocaleLowerCase("es");
  if(/acumulador|sumatoria|suma acumul/.test(concepts))labels.add("Acumuladores");
  if(/contador|contar|cantidad|intento/.test(concepts))labels.add("Contadores");
  if(/promedio|media|notas/.test(concepts)||/promedio/.test(item.title.toLocaleLowerCase("es")))labels.add("Promedios");
  if(/máximo|mayor|mínimo|menor/.test(concepts+" "+item.title.toLocaleLowerCase("es")))labels.add("Máximo y mínimo");
  if(/centinela/.test(concepts+" "+item.statement.toLocaleLowerCase("es")))labels.add("Centinelas");
  if(/validar|validación|rango/.test(concepts+" "+item.title.toLocaleLowerCase("es")))labels.add("Validación");
  if(/factorial|potencia|exponente|fibonacci|serie/.test((item.title+" "+concepts).toLocaleLowerCase("es")))labels.add("Series y potencias");
  if(nestedLoop||/anidados/.test(concepts))labels.add("Ciclos anidados");
  return [...labels];
}
function readLearnProgress(){
  try{
    const value=JSON.parse(localStorage.getItem("traza:v2:learn")||"null");
    return normalizeLearnProgress(value, lessons.map(item=>item.id), temas.map(item=>item.id));
  }catch{return normalizeLearnProgress(null, lessons.map(item=>item.id), temas.map(item=>item.id));}
}
function saveLearnProgress(){
  learnProgress.current=selectedLesson;
  learnProgress.screen=lessonScreenStep;
  learnProgress.theme=selectedTheme;
  try{localStorage.setItem("traza:v2:learn",JSON.stringify(learnProgress));}catch{}
}
function completeLesson(){
  const wasCompleted=learnProgress.completed.includes(selectedLesson);
  learnProgress.completed=setLessonCompleted(learnProgress.completed,selectedLesson,!wasCompleted);
  if(!wasCompleted)recordLearnActivity();
  saveLearnProgress();
  lessonList();renderLearnCatalog();renderLearnProgress();
  renderLesson();
}
function recordLearnActivity(){
  const day=dateInBogota();
  learnProgress.activityDays=Array.isArray(learnProgress.activityDays)?learnProgress.activityDays:[];
  if(!learnProgress.activityDays.includes(day))learnProgress.activityDays.push(day);
  learnProgress.activityDays=learnProgress.activityDays.slice(-60);
  const streak=document.querySelector("#learn-streak");
  if(streak)streak.textContent="Racha: "+currentStreak(learnProgress.activityDays,day)+" días";
}

function showLearnPanel(panel){
  const catalog=$("#learn-catalog-home"),topic=$("#learn-topic-space");
  if(catalog)catalog.hidden=panel!=="catalog";
  if(topic)topic.hidden=panel!=="topic";
}
function progressRing(progress){return `<span class="theme-progress-ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percentage}" style="--theme-progress:${progress.percentage}%" aria-label="${progress.completed} de ${progress.total} lecciones completadas">${progress.total?progress.percentage:"–"}%</span>`;}

function renderLearnCatalog(){
  const host=$("#learn-catalog-bands"),competenceHost=$("#learn-competence-filters");if(!host||!competenceHost)return;
  if(!selectedCompetence){
    host.hidden=true;competenceHost.hidden=false;
    competenceHost.innerHTML=competenciasAprende.map(item=>{
      const count=temas.filter(theme=>theme.competenciaId===item.id).length;
      return `<button type="button" class="learn-competence-card" data-learn-competence="${escapeHTML(item.id)}" style="--comp-color:var(--competence-${escapeHTML(item.token)}-solid)" aria-label="${escapeHTML(item.titulo)}, ${count?count+" temas":"próximamente"}">${competenceMarker(item.id)}<strong>${escapeHTML(item.titulo)}</strong>${item.tipo==="transversal"?'<small>Transversal · '+(count?count+" temas":"Próximamente")+'</small>':'<small>'+ (count?count+" temas":"Próximamente")+'</small>'}</button>`;
    }).join("");
    return;
  }
  const competence=competenciasAprende.find(item=>item.id===selectedCompetence);
  if(!competence){selectedCompetence=null;renderLearnCatalog();return;}
  competenceHost.hidden=true;host.hidden=false;
  const items=temas.filter(theme=>theme.competenciaId===competence.id).sort((a,b)=>a.dificultad-b.dificultad);
  const tiles=items.map(theme=>{
    const available=theme.estado==="disponible";
    const progress=calculateLessonProgress(theme.lecciones,learnProgress.completed);
    const include=[theme.lecciones.length,theme.ejercicios.length,theme.simulador?1:0,theme.laboratorio?.mecanicas.length||0];
    const labels=["lecciones","ejercicios","simulador","retos de laboratorio"];
    return `<button type="button" class="theme-card${available?"":" is-coming"}" data-topic-open="${escapeHTML(theme.id)}" aria-disabled="${String(!available)}" aria-label="${escapeHTML(theme.titulo)}${available?"":"; no disponible todavía"}"><span class="theme-icon" aria-hidden="true">${escapeHTML(theme.icono)}</span>${available?progressRing(progress):'<span class="theme-coming-label">◷ Próximamente</span>'}<strong>${escapeHTML(theme.titulo)}</strong><span class="theme-includes">${include.map((count,index)=>`<span title="${count} ${labels[index]}" aria-label="${count} ${labels[index]}"><span aria-hidden="true">${["▤","◇","⌘","⌑"][index]}</span> ${count}</span>`).join("")}</span></button>`;
  }).join("");
  host.innerHTML=`<button type="button" class="learn-catalog-back" data-competence-back>‹ Todas las competencias</button><section class="learn-competence-band" data-competence-id="${escapeHTML(competence.id)}"><header>${competenceMarker(competence.id)}<h3>${escapeHTML(competence.titulo)}</h3>${competence.tipo==="transversal"?'<span class="learn-competence-type">Transversal</span>':""}<span>${items.length} ${items.length===1?"tema":"temas"}</span></header>${tiles?`<div class="theme-grid">${tiles}</div>`:'<p class="learn-coming-empty">Próximamente</p>'}</section>`;
}
function themeExerciseItems(theme){
  if(theme.id==="diagramas-flujo")return exercises;
  if(theme.id==="fuentes-informacion")return sourceExercises;
  return mathCatalogItems().filter(item=>item.topic===theme.id);
}
function completedExerciseKeys(){
  return readExerciseProgress().resolved;
}
function readExerciseProgress(){
  try{
    const value=JSON.parse(localStorage.getItem("traza:v1:exercise-progress")||"{}");
    if(Array.isArray(value))return {viewed:new Set(),resolved:new Set(value.filter(item=>typeof item==="string"))};
    return {viewed:new Set(Array.isArray(value.viewed)?value.viewed.filter(item=>typeof item==="string"):[]),resolved:new Set(Array.isArray(value.resolved)?value.resolved.filter(item=>typeof item==="string"):[])};
  }catch{return {viewed:new Set(),resolved:new Set()};}
}
function markExerciseViewed(themeId,id){
  const progress=readExerciseProgress();progress.viewed.add(themeId+":"+id);
  try{localStorage.setItem("traza:v1:exercise-progress",JSON.stringify({viewed:[...progress.viewed],resolved:[...progress.resolved]}));}catch{}
}
function exerciseStatus(themeId,id){
  const key=themeId+":"+id,progress=readExerciseProgress();
  if(progress.resolved.has(key))return {label:"Resuelto",icon:"✓",className:"is-resolved"};
  if(progress.viewed.has(key))return {label:"Visto",icon:"◉",className:"is-viewed"};
  return {label:"Pendiente",icon:"○",className:"is-pending"};
}
const EXERCISE_LEVELS={1:{label:"Básico",className:"level-basic"},2:{label:"Intermedio",className:"level-intermediate"},3:{label:"Avanzado",className:"level-advanced"},4:{label:"Reto",className:"level-advanced"}};
function renderExerciseDifficultyFilters(){
  const host=$("#exercise-difficulty-options");if(!host)return;
  host.innerHTML=Object.entries(EXERCISE_LEVELS).map(([level,item])=>'<button type="button" class="exercise-level-chip '+item.className+'" data-exercise-difficulty="'+level+'" aria-pressed="'+String(exerciseLevels.has(level))+'">'+item.label+'</button>').join("");
}
function renderExerciseStatus(id){const status=exerciseStatus(selectedExerciseTheme,id);return '<span class="exercise-row-status '+status.className+'"><span aria-hidden="true">'+status.icon+'</span>'+status.label+'</span>';}
function closeMobileExerciseList(){const disclosure=$("#exercise-list-disclosure");if(disclosure&&!window.matchMedia("(min-width: 801px)").matches)disclosure.open=false;}
function showExerciseTopicWorkspace(open){
  const home=$("#exercise-catalog-home"),workspace=$("#exercise-topic-workspace");
  if(home)home.hidden=open;if(workspace)workspace.hidden=!open;
}
function renderExerciseThemeCatalog(){
  const host=$("#exercise-theme-grid");if(!host)return;
  const completed=completedExerciseKeys();
  host.innerHTML=competenciasAprende.map(competence=>{
    const owned=temas.filter(theme=>theme.competenciaId===competence.id);
    const cards=owned.map(theme=>{
      const count=themeExerciseItems(theme).length;
      const done=themeExerciseItems(theme).filter(item=>completed.has(theme.id+":"+item.id)).length;
      const unavailable=!count;
      return '<button type="button" role="listitem" class="theme-card exercise-theme-card'+(unavailable?' is-coming':'')+'" data-exercise-theme="'+escapeHTML(theme.id)+'" data-competence-id="'+escapeHTML(competence.id)+'" style="--comp-color:var(--competence-'+escapeHTML(competence.token)+'-solid)" '+(unavailable?'disabled aria-disabled="true"':'')+' aria-label="'+escapeHTML(competence.titulo+", "+theme.titulo+", "+(unavailable?"próximamente":count+" ejercicios, "+done+" resueltos"))+'"><span class="theme-icon" aria-hidden="true">'+escapeHTML(theme.icono)+'</span><strong>'+escapeHTML(theme.titulo)+'</strong><small>'+escapeHTML(competence.titulo)+'</small><span class="exercise-theme-count">'+(unavailable?'Próximamente':count+' ejercicios')+'</span><span class="exercise-theme-progress"'+(unavailable?'':' role="progressbar" aria-valuemin="0" aria-valuemax="'+count+'" aria-valuenow="'+done+'" aria-label="'+done+' de '+count+' ejercicios resueltos"')+'>'+(unavailable?'':done+' / '+count+' resueltos')+'</span></button>';
    }).join("");
    return '<section class="exercise-competence-section" aria-labelledby="exercise-competence-'+escapeHTML(competence.id)+'"><header>'+competenceMarker(competence.id)+'<h4 id="exercise-competence-'+escapeHTML(competence.id)+'">'+escapeHTML(competence.titulo)+'</h4><span>'+owned.length+' temas</span></header><div class="theme-grid">'+(cards||'<p class="exercise-themes-coming">Próximamente</p>')+'</div></section>';
  }).join("");
}
function openExerciseTheme(themeId){
  const theme=temaPorId(themeId);if(!theme||!themeExerciseItems(theme).length)return;
  window.scrollTo({top:0,behavior:"instant"});
  selectedExerciseTheme=theme.id;exerciseBank=theme.id==="diagramas-flujo"?"diagramas":theme.id==="fuentes-informacion"?"fuentes":"matematicas";
  mathTopicFilter=exerciseBank==="matematicas"?theme.id:"todos";
  selectedExercise=null;selectedMathExercise=null;selectedSourceExercise=null;exerciseLevels.clear();exerciseQuery="";exerciseClassOnly=false;
  const bank=$("#exercise-bank"),topic=$("#exercise-math-topic"),search=$("#exercise-search"),classOnly=$("#exercise-class-only");
  if(bank)bank.value=exerciseBank;if(topic)topic.value=mathTopicFilter;if(search)search.value="";if(classOnly)classOnly.setAttribute("aria-pressed","false");
  const competence=competenciasAprende.find(item=>item.id===theme.competenciaId);
  const label=$("#exercise-topic-competence"),title=$("#exercise-topic-title");if(label)label.textContent=competence?.titulo??"Aprende";if(title)title.textContent=theme.titulo;
  const items=themeExerciseItems(theme),searchWrap=$("#exercise-search-wrap"),classFilter=$("#exercise-class-only"),disclosure=$("#exercise-list-disclosure");
  if(searchWrap)searchWrap.hidden=items.length<=15;
  if(classFilter){classFilter.hidden=!items.some(item=>item.classExercise??CLASS_EXERCISES.has(item.id));classFilter.setAttribute("aria-pressed","false");}
  if(disclosure)disclosure.open=window.matchMedia("(min-width: 801px)").matches;
  showExerciseTopicWorkspace(true);renderExerciseCards();renderExerciseDetail();
  const ordered=[...items].sort((a,b)=>(a.difficulty??({basic:1,intermediate:2,advanced:3,expert:4}[a.level]))-(b.difficulty??({basic:1,intermediate:2,advanced:3,expert:4}[b.level]))||String(a.id).localeCompare(String(b.id),"es",{numeric:true}));
  const completed=completedExerciseKeys();
  const next=ordered.find(item=>!completed.has(theme.id+":"+item.id))??ordered[0];
  if(next){
    if(exerciseBank==="fuentes")selectSourceExercise(next.id);
    else if(exerciseBank==="matematicas")selectMathExercise(next.id);
    else selectExercise(next.id);
  }
}
function backToExerciseThemes(){
  selectedExerciseTheme=null;selectedExercise=null;selectedMathExercise=null;selectedSourceExercise=null;
  showExerciseTopicWorkspace(false);renderExerciseThemeCatalog();
}

function renderTopicSpace(){
  const theme=temaPorId(selectedTheme);if(!theme||theme.estado!=="disponible")return;
  const competence=competenciasAprende.find(item=>item.id===theme.competenciaId);
  const label=$("#learn-topic-competence"),title=$("#learn-topic-title");
  if(label)label.textContent=competence?.titulo||"Aprende";
  if(title)title.textContent=theme.titulo;
  const currentLesson=$("#learn-current-lesson"),currentLessonWrap=$("#learn-current-lesson-wrap");
  const lesson=lessons.find(item=>item.id===selectedLesson&&theme.lecciones.includes(item.id));
  if(currentLesson)currentLesson.textContent=lesson?.title??"";
  if(currentLessonWrap)currentLessonWrap.hidden=!lesson;
  const note=$("#learn-topic-note");if(note){note.hidden=!theme.nota;note.textContent=theme.nota??"";}
  const count=$("#learn-catalog-count");
  const topicConcepts=conceptos.filter(item=>theme.conceptos.includes(item.id));
  if(count)count.textContent=theme.lecciones.length+" lecciones"+(topicConcepts.length?" · "+topicConcepts.length+" conceptos":"");
}

function openTheme(id){
  const theme=temaPorId(id);if(!theme||theme.estado!=="disponible")return;
  stopLessonPlayback();lessonAutoplayStarted=false;lessonPlaybackComplete=false;lessonEntrySeen.clear();
  selectedTheme=id;selectedCompetence=theme.competenciaId;
  if(!theme.lecciones.includes(selectedLesson)){selectedLesson=theme.lecciones[0]||lessons[0].id;lessonScreenStep=0;lessonVisualStep=0;}
  saveLearnProgress();
  showLearnPanel("topic");
  lessonList();renderLesson();renderTopicSpace();
}

function backToCompetences(){
  selectedTheme=null;selectedCompetence=null;saveLearnProgress();
  showLearnPanel("catalog");renderLearnCatalog();
}

function navigateToLesson(id){
  const theme=temas.find(item=>item.lecciones.includes(id));
  if(theme){selectedTheme=theme.id;selectedCompetence=theme.competenciaId;saveLearnProgress();showLearnPanel("topic");renderTopicSpace();}
  selectLesson(id);
  document.querySelector('#primary-nav [data-space="learn"]')?.click();
}

function renderLearnProgress(){
  const host=$("#learn-progress-topics");if(!host)return;
  const overall=calculateLessonProgress(lessons.map(item=>item.id),learnProgress.completed);
  const ring=$("#learn-progress-ring"),text=$("#learn-progress-percent"),total=$("#learn-progress-total");
  if(ring){
    ring.style.setProperty("--learn-progress",overall.percentage+"%");
    ring.setAttribute("aria-valuenow",String(overall.completed));
    ring.setAttribute("aria-valuemax",String(overall.total));
    ring.setAttribute("aria-label",overall.completed+" de "+overall.total+" lecciones completadas");
  }
  if(text)text.textContent=overall.percentage+"%";
  if(total)total.textContent=overall.completed+" de "+overall.total+" lecciones completadas";
  const next=lessons.find(item=>!learnProgress.completed.includes(item.id));
  const nextLabel=$("#learn-progress-next");
  if(nextLabel)nextLabel.textContent=next?"Sigue con "+next.title+".":"Has completado todas las lecciones.";
  const streak=$("#learn-streak-drawer");
  if(streak)streak.textContent="Racha: "+currentStreak(learnProgress.activityDays||[])+" días";

  let labData={};
  try{labData=JSON.parse(localStorage.getItem("traza:v2:progress")||"{}");}catch{}
  const lab=labData.exercises||{};
  let starsTotal=0;
  const medalsTotal=new Set();
  host.innerHTML=competenciasAprende.map(competence=>{
    const owned=temas.filter(theme=>theme.competenciaId===competence.id);
    const lessonIds=owned.flatMap(theme=>theme.lecciones);
    const competenceProgress=calculateLessonProgress(lessonIds,learnProgress.completed);
    const topicMarkup=owned.map(theme=>{
      const progress=calculateLessonProgress(theme.lecciones,learnProgress.completed);
      const stars=theme.competenciaId==="matematicas"
        ?Object.values(labData.topics?.[theme.id]?.concepts?.[theme.id]||{}).reduce((sum,mode)=>sum+(Number(mode?.stars)||0),0)
        :theme.ejercicios.reduce((sum,id)=>sum+Object.values(lab[String(id)]||{}).reduce((n,mode)=>n+(Number(mode?.stars)||0),0),0);
      starsTotal+=stars;
      for(const medal of conceptMedals(labData,theme.id))medalsTotal.add(medal);
      if(!theme.lecciones.length)return '<div class="learn-progress-topic is-coming"><strong>'+escapeHTML(theme.titulo)+'</strong><span>Próximamente</span></div>';
      return '<button type="button" class="learn-progress-topic" data-progress-open-theme="'+escapeHTML(theme.id)+'" aria-label="Abrir '+escapeHTML(theme.titulo)+', '+progress.completed+' de '+progress.total+' lecciones completadas">'+
        '<strong>'+escapeHTML(theme.titulo)+'</strong><span>'+progress.completed+'/'+progress.total+' lecciones</span>'+
        '<span class="learn-topic-track" role="progressbar" aria-valuemin="0" aria-valuemax="'+Math.max(1,progress.total)+'" aria-valuenow="'+progress.completed+'" aria-label="'+progress.completed+' de '+progress.total+' lecciones de '+escapeHTML(theme.titulo)+' completadas"><i style="width:'+progress.percentage+'%"></i></span></button>';
    }).join("");
    const future=lessonIds.length===0;
    return '<details class="learn-progress-competence" data-competence-id="'+escapeHTML(competence.id)+'" style="--comp-color:var(--competence-'+escapeHTML(competence.token)+'-solid)">'+
      '<summary>'+competenceMarker(competence.id)+'<strong>'+escapeHTML(competence.titulo)+'</strong>'+
      (competence.tipo==="transversal"?'<small class="learn-competence-type">Transversal</small>':"")+
      (future?'<span class="learn-progress-coming">Próximamente</span>':progressRing(competenceProgress))+
      '</summary><div class="learn-progress-topic-list">'+(topicMarkup||'<p class="learn-coming-empty">Próximamente</p>')+'</div></details>';
  }).join("");
  const stars=$("#learn-progress-stars"),medals=$("#learn-progress-medals");
  if(stars)stars.textContent="☆ "+starsTotal+" estrellas del Laboratorio";
  if(medals)medals.textContent="🏅 "+medalsTotal.size+" medallas";
  const empty=$("#learn-progress-empty");
  if(empty)empty.hidden=overall.completed>0;
  host.hidden=overall.completed===0;
}
function lessonDifficulty(lesson,theme=temaPorId(selectedTheme)){
  if(theme?.id==="diagramas-flujo")return Math.min(3,Math.max(1,rutas.findIndex(group=>group.ids.includes(lesson.id))+1));
  return Math.min(3,Math.max(1,theme?.dificultad??1));
}
function lessonList(){
  const host=$("#lesson-catalog");
  if(!host)return;
  const routeCount=$("#lesson-route-count");
  const theme=temaPorId(selectedTheme);
  const topicLessons=(theme?.lecciones?.length?theme.lecciones.map(id=>lessons.find(lesson=>lesson.id===id)).filter(Boolean):flowLessons)
    .map((lesson,index)=>{
      return {lesson,index,difficulty:lessonDifficulty(lesson,theme)};
    })
    .sort((a,b)=>a.difficulty-b.difficulty||a.index-b.index)
    .map(item=>({...item.lesson,difficulty:item.difficulty}));
  const progress=calculateLessonProgress(topicLessons.map(item=>item.id),learnProgress.completed);
  if(routeCount)routeCount.textContent=progress.completed+" de "+progress.total+" completadas";
  const items=topicLessons.map((lesson,index)=>{
    const completed=learnProgress.completed.includes(lesson.id);
    const status=completed?"Completada":lesson.id===selectedLesson?"En curso":"Pendiente";
    return '<button class="lesson-list-item '+(lesson.id===selectedLesson?"is-selected":"")+'" type="button" data-lesson-id="'+escapeHTML(lesson.id)+'" aria-current="'+(lesson.id===selectedLesson?"true":"false")+'" aria-label="Lección '+String(index+1)+': '+escapeHTML(lesson.title)+", "+status+", dificultad "+lesson.difficulty+' de 3">'+
      '<span class="lesson-list-number">'+String(index+1).padStart(2,"0")+'</span>'+
      '<span class="lesson-list-copy"><strong>'+escapeHTML(lesson.title)+'</strong><small>'+status+'</small></span>'+
      '<span class="lesson-list-difficulty" aria-hidden="true">'+[1,2,3].map(value=>'<i class="'+(value<=lesson.difficulty?"is-filled":"")+'"></i>').join("")+'</span></button>';
  }).join("");
  host.innerHTML='<div class="lesson-catalog-items">'+items+'</div><details class="lesson-glossary"><summary>Glosario del tema</summary><dl>'+(theme?.id==="fuentes-informacion"?sourceLessonGlossary.map(([term,definition])=>'<dt>'+escapeHTML(term)+'</dt><dd>'+escapeHTML(definition)+'</dd>').join(""):topicLessons.map(lesson=>'<dt>'+escapeHTML(LESSON_TERMS[lesson.id]??lesson.title)+'</dt><dd>'+escapeHTML(lesson.technical)+'</dd>').join(""))+'</dl></details>';
}
function lessonInputs(value){
  return String(value??"").split(/[;,]/).map(part=>part.trim()).filter(Boolean).map(Number);
}
function runLesson(lesson,values=lesson.miniProgram.sample){
  if(mathLessonById(lesson.id)||sourceLessonById(lesson.id))return {ok:true,events:lesson.visual.steps.map(([title,body],index)=>({type:mathLessonById(lesson.id)?"math-step":"source-step",sourceLine:index+1,message:title,scene:{body:title+". "+body}})),outputs:[],variables:{}};
  try{return executePseudocode(lesson.miniProgram.code,values);}
  catch(error){return {ok:false,error:{message:error.message},events:[],outputs:[],variables:{}};}
}
function relevantLessonEvents(lesson,execution){
  const targets={
    comparisons:["decision"],decisions:["decision","branch"],"nested-decisions":["decision","branch"],
    for:["loop-init","loop-condition","loop-enter","loop-update","loop-exit"],
    while:["loop-condition","loop-enter","loop-exit"],
    "do-while":["loop-enter","loop-condition","loop-exit"],
    "nested-loops":["loop-init","loop-enter","loop-update","loop-condition","loop-exit"],
    "validation-sentinel":["input","loop-condition","assignment","loop-exit"]
  };
  const selected=targets[lesson.id];
  const events=selected?execution.events.filter(event=>selected.includes(event.type)):
    execution.events.filter(event=>lesson.id==="terminals"||!["program-start","program-end"].includes(event.type));
  return events.length?events:execution.events;
}
function lessonScene(lesson,position=0){
  const mathLesson=mathLessonById(lesson.id);
  if(sourceLessonById(lesson.id))return renderSourceScene(lesson,position);
  if(mathLesson)return mathSceneMarkup(lesson,position);
  const recipe=lessonRecipe(lesson.id);
  if(recipe)return '<div class="lesson-scene-host" role="img" aria-label="'+escapeHTML(recipe.cierre)+'">'+recipeSceneMarkup(recipe,0)+'</div>';
  const execution=runLesson(lesson);
  if(!execution.ok||!execution.events.length)return '<div class="lesson-scene-unavailable">'+escapeHTML(execution.error?.message??"No se pudo ejecutar el ejemplo.")+'</div>';
  const events=relevantLessonEvents(lesson,execution);
  const index=Math.max(0,Math.min(position,events.length-1));
  const event=events[index];
  const rendered=renderScene(event,{execution,events:execution.events,inputValues:lesson.miniProgram.sample});
  const body=event.scene?.body??event.message??event.sourceText??"";
  return '<div class="lesson-scene-host" role="img" aria-label="'+rendered.alt+'">'+rendered.markup+'</div>'+
    (body?'<p class="lesson-scene-caption">'+escapeHTML(body)+'</p>':"");
}
function mathSceneMarkup(lesson,position){
  const mathLesson=mathLessonById(lesson.id),steps=lesson.visual.steps;
  const index=Math.max(0,Math.min(position,steps.length-1)),[title,description]=steps[index];
  const tokenValue=mathLesson.id.endsWith("-1")?(index===1?3:index===2?-2:0):mathLesson.id.endsWith("-2")?(index===0?3:-2):0;
  const tokenPosition=((tokenValue+12)/24*100).toFixed(2);
  const numberLine='<div class="math-number-line" role="img" aria-label="Recta numérica de menos doce a doce, ficha en '+(tokenValue<0?"−"+Math.abs(tokenValue):"+"+tokenValue)+'"><b class="math-number-token" style="--math-position:'+tokenPosition+'%" aria-hidden="true"></b>'+Array.from({length:25},(_,tick)=>'<i class="'+(tick===12?"is-zero":"")+'">'+(tick===0?"−12":tick===12?"0":tick===24?"12":"")+'</i>').join("")+'</div>';
  let visual=numberLine;
  if(mathLesson.topic==="enteros"&&mathLesson.id.endsWith("-3"))visual='<div class="math-sign-pairs" role="img" aria-label="Tres pares de fichas positivas y negativas que se anulan">'+Array.from({length:3},()=>'<span class="is-positive">+</span><span class="is-negative">−</span>').join("")+'</div>';
  else if(mathLesson.topic==="enteros"&&mathLesson.id.endsWith("-4"))visual='<div class="math-expression-tree" role="img" aria-label="Árbol de operaciones: multiplicación y división antes de suma y resta"><div class="math-tree-root">15 − 8 × 2 + 24 ÷ 6</div><div class="math-tree-branches"><span>1 · 8 × 2</span><span>2 · 24 ÷ 6</span><span>3 · suma y resta</span></div></div>';
  else if(mathLesson.topic==="enteros"&&mathLesson.id.endsWith("-5"))visual='<div class="math-nested-groups" role="img" aria-label="Corchete exterior con paréntesis interior"><span>[ marco exterior <b>( marco interior )</b> ]</span></div>';
  else if(mathLesson.topic==="racionales"){
    const fractions=[[4,3],[8,4],[5,3],[6,5],[5,1]], [parts,filled]=fractions[index];
    visual='<div class="math-fraction-bar" style="--math-parts:'+parts+'" role="img" aria-label="Barra dividida en '+parts+' partes iguales, '+filled+' sombreadas">'+Array.from({length:parts},(_,part)=>'<i class="'+(part<filled?"is-filled":"")+'"></i>').join("")+'</div>';
  }else if(mathLesson.topic==="regla-de-tres"&&mathLesson.id.endsWith("-4"))visual='<div class="math-constant-area" style="--math-columns:'+(index<2?4:8)+'" role="img" aria-label="Rectángulo de área constante de 24 celdas">'+Array.from({length:24},()=>'<i></i>').join("")+'</div>';
  else if(mathLesson.topic==="regla-de-tres"&&mathLesson.id.endsWith("-5"))visual='<div class="math-decision-tree" role="img" aria-label="Árbol para decidir si la relación es directa o inversa"><span>Si A sube…</span><div><b>¿B sube?</b><strong>sí · directa</strong><strong>no · inversa</strong></div></div>';
  else if(mathLesson.topic==="regla-de-tres"&&mathLesson.id.endsWith("-1"))visual='<div class="math-proportion-grid" role="img" aria-label="Proporción equivalente dos limones por litro y cuatro por dos litros"><span>Limones</span><span>Litros</span><b>2</b><b>1</b><b>4</b><strong>2</strong></div>';
  else if(mathLesson.topic==="regla-de-tres"&&mathLesson.id.endsWith("-2"))visual='<div class="math-proportion-grid" role="img" aria-label="Tabla con magnitudes que varían en el mismo sentido y en sentido opuesto"><span>Tipo</span><span>Flechas</span><b>Directa</b><strong>↑ ↑</strong><b>Inversa</b><strong>↑ ↓</strong></div>';
  else if(mathLesson.topic==="regla-de-tres")visual='<div class="math-proportion-grid" role="img" aria-label="Tabla de proporción de licencias y costo"><span>Licencias</span><span>Costo</span><b>3</b><b>12</b><b>5</b><strong>x = 20</strong></div>';
  return '<div class="math-scene" data-math-topic="'+escapeHTML(mathLesson.topic)+'" data-math-step="'+index+'"><span class="math-scene-kicker">'+escapeHTML(mathLesson.topic.replaceAll("-"," "))+' · ESCENA '+(index+1)+'</span>'+visual+'<strong>'+escapeHTML(title)+'</strong><p>'+escapeHTML(description)+'</p><div class="math-scene-track" aria-hidden="true">'+steps.map((_,step)=>'<i class="'+(step<=index?"is-active":"")+'"></i>').join("")+'</div></div>';
}
function lessonPhaseForEvent(event){
  const map={
    "program-start":["start","Inicio","Preparar el recorrido"],
    input:["input","Entrada","Leer los datos necesarios"],
    assignment:["process","Proceso","Transformar o actualizar un valor"],
    decision:["decision","Decisión","Evaluar una condición y elegir ruta"],
    branch:["route","Ruta","Seguir la rama verdadera o falsa"],
    "loop-init":["loop-init","Preparación del ciclo","Inicializar el contador o acumulador"],
    "loop-condition":["loop-condition","Condición del ciclo","Comprobar si la repetición continúa"],
    "loop-enter":["loop-body","Cuerpo del ciclo","Ejecutar las instrucciones repetidas"],
    "loop-update":["loop-update","Avance del ciclo","Actualizar el contador"],
    "loop-exit":["loop-exit","Fin del ciclo","Salir de la repetición"],
    output:["output","Salida","Mostrar el resultado"],
    "program-end":["end","Fin","Completar el algoritmo"],
    error:["error","Error","Revisar el dato o la instrucción que detuvo el recorrido"]
  };
  return map[event?.type]??["other","Ejecución","Seguir el siguiente evento del algoritmo"];
}
function visualMarkup(lesson){
  const execution=runLesson(lesson);
  const sourceLesson=sourceLessonById(lesson.id);
  const events=execution.ok?relevantLessonEvents(lesson,execution):[];
  const index=Math.min(lessonVisualStep,Math.max(0,events.length-1));
  const event=events[index];
  const scene=event&&!mathLessonById(lesson.id)&&!sourceLesson?renderScene(event,{execution,events:execution.events,inputValues:lesson.miniProgram.sample}):null;
  const recipe=lessonRecipe(lesson.id);
  const frame=recipe?recipeFrame(recipe,index,events.length):0;
  const declared=Array.isArray(lesson.visual.steps)&&lesson.visual.steps.length>0;
  let phases,phaseIndex;
  if(declared){
    phases=lesson.visual.steps.map(([title,description],position)=>({key:"lesson-"+position,title,description}));
    const phaseMap={algorithm:{input:0,assignment:1,output:2},reading:{input:0,assignment:1,decision:1,branch:1,output:2},terminals:{"program-start":0,input:1,assignment:1,decision:1,output:1,"program-end":2},input:{input:1},process:{assignment:1},output:{output:1},variables:{assignment:1},arithmetic:{assignment:1},comparisons:{decision:1},decisions:{decision:0,branch:1},"nested-decisions":{decision:0,branch:1},"counters-accumulators":{"loop-init":0,input:1,assignment:1,"loop-update":2},for:{"loop-init":0,"loop-condition":1,"loop-enter":2,"loop-update":3,"loop-exit":4},while:{"loop-condition":0,"loop-enter":1,"loop-exit":2},"do-while":{"loop-enter":0,"loop-condition":1,"loop-exit":2},"nested-loops":{"loop-init":0,"loop-enter":1,"loop-update":2,"loop-exit":2},"validation-sentinel":{input:0,"loop-condition":1,assignment:2,"loop-exit":2}};
    const matched=phaseMap[lesson.id]?.[event?.type];
    phaseIndex=Number.isInteger(matched)?Math.min(phases.length-1,matched):Math.min(phases.length-1,Math.floor(index/Math.max(1,events.length)*phases.length));
  }else{
    const unique=new Map();
    for(const item of events){
      const [key,title,description]=lessonPhaseForEvent(item);
      if(!unique.has(key))unique.set(key,{key,title,description});
    }
    phases=[...unique.values()];
    if(!phases.length)phases=[{key:"waiting",title:"Preparación",description:"El ejemplo todavía no produjo eventos para recorrer"}];
    const activeKey=event?lessonPhaseForEvent(event)[0]:phases[0].key;
    phaseIndex=Math.max(0,phases.findIndex(phase=>phase.key===activeKey));
  }
  const phaseRail=phases.map((phase,position)=>
    '<div class="lesson-phase '+(position===phaseIndex?"is-current":position<phaseIndex?"is-complete":"")+'" data-phase-key="'+escapeHTML(phase.key)+'">'+
    '<span>'+String(position+1).padStart(2,"0")+'</span><strong>'+escapeHTML(phase.title)+'</strong><small>'+escapeHTML(phase.description)+'</small></div>'
  ).join("");
  return '<section class="lesson-visual lesson-visual-'+escapeHTML(lesson.visual.kind)+'" data-lesson-id="'+escapeHTML(lesson.id)+'" data-recipe-id="'+escapeHTML(recipe?.id??"eventos-del-motor")+'" data-visual-kind="'+escapeHTML(lesson.visual.kind)+'" data-phase-source="'+(declared?"lesson":"events")+'" aria-label="Escena de '+escapeHTML(lesson.title)+'">'+
    '<div class="lesson-visual-head"><div><p class="eyebrow">EXPERIMENTO VISUAL</p><strong>'+escapeHTML(lesson.visual.caption)+'</strong></div>'+
    '<span class="visual-step-count">'+(recipe?"Momento "+(recipeMomentIndex(recipe,index,events.length)+1)+"/"+recipe.moments.length+" · Paso "+(events.length?index+1:0)+"/"+events.length:"Paso "+(events.length?index+1:0)+" / "+events.length)+'</span></div>'+
    '<div class="lesson-phase-rail">'+phaseRail+'</div>'+
    (mathLessonById(lesson.id)?mathSceneMarkup(lesson,index):sourceLesson?renderSourceScene(lesson,index):recipe?'<div class="lesson-scene-host" role="img" aria-label="'+escapeHTML(recipe.cierre)+'">'+recipeSceneMarkup(recipe,frame,recipeMomentIndex(recipe,index,events.length))+'</div>':scene?'<div class="lesson-scene-host" role="img" aria-label="'+scene.alt+'">'+scene.markup+'</div>':'<p>'+escapeHTML(execution.error?.message??"No se pudo ejecutar el ejemplo.")+'</p>')+
    '<p class="lesson-scene-caption">'+escapeHTML(recipe?recipeMoment(recipe,index,events.length):event?.scene?.body??event?.message??event?.sourceText??"")+'</p>'+
    '<details class="lesson-static-sequence" '+((document.documentElement.dataset.motion==="reduced"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)?"open":"")+'><summary>Ver secuencia estática</summary>'+(recipe?'<ol class="recipe-static-sequence">'+recipe.moments.map((moment,position)=>'<li><span>'+String(position+1)+'</span>'+escapeHTML(moment)+'</li>').join("")+'</ol>':"")+'<ol>'+events.map((item,position)=>'<li><span>'+String(position+1)+'</span>'+escapeHTML(item.scene?.body??item.message??item.sourceText??"Paso del algoritmo")+'</li>').join("")+'</ol></details>'+
    '<div class="visual-controls" tabindex="0" aria-label="Controles de la escena. Usa espacio para reproducir o pausar y las flechas para avanzar o retroceder." data-visual-player><button type="button" class="button button-secondary" data-visual-reset>Reiniciar</button>'+
    '<button type="button" class="button button-secondary" data-visual-prev '+(index<=0?"disabled":"")+'>← Anterior</button>'+
    '<button type="button" class="button button-secondary" data-visual-play aria-pressed="'+String(lessonPlaying)+'">'+(lessonPlaying?"Ⅱ Pausar":"▶ Reproducir")+'</button>'+
    '<button type="button" class="button button-primary" data-visual-next '+(!events.length||index>=events.length-1?"disabled":"")+' >Siguiente paso <span aria-hidden="true">→</span></button>'+
    '<label class="visual-speed-label">Velocidad<select data-visual-speed aria-label="Velocidad de reproducción"><option value="0.5" '+(lessonClock?.speed===0.5?"selected":"")+'>0,5×</option><option value="1" '+((lessonClock?.speed??1)===1?"selected":"")+'>1×</option><option value="2" '+(lessonClock?.speed===2?"selected":"")+'>2×</option></select></label></div></section>';
}
function stopLessonPlayback(){
  if(lessonPlaybackFrame)cancelAnimationFrame(lessonPlaybackFrame);
  lessonPlaybackFrame=0;lessonClock?.pause();lessonPlaying=false;
  const play=$("[data-visual-play]");if(play){play.setAttribute("aria-pressed","false");play.textContent="▶ Reproducir";}
}
function reducedLessonMotion(){return document.documentElement.dataset.motion==="reduced"||window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
function observeLessonFigures(){
  lessonFigureObserver?.disconnect();
  const figures=$$(".lesson-idea-scene,.lesson-visual",$("#lesson-detail"));
  if(reducedLessonMotion()||!("IntersectionObserver" in window)){
    figures.forEach(figure=>figure.classList.add("is-in-view","has-entered"));
    return;
  }
  lessonFigureObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const figure=entry.target,key=figure.classList.contains("lesson-visual")?"visual":"idea";
      if(entry.isIntersecting){
        figure.classList.add("is-in-view");
        if(!lessonEntrySeen.has(key)){
          lessonEntrySeen.add(key);figure.classList.add("is-entering");
          figure.addEventListener("animationend",event=>{if(event.target===figure)figure.classList.replace("is-entering","has-entered");},{once:true});
        }else figure.classList.add("has-entered");
        if(key==="visual"){
          if(!lessonAutoplayStarted){lessonAutoplayStarted=true;startLessonPlayback({automatic:true});}
          else if(!lessonPlaybackComplete&&!lessonPlaying)startLessonPlayback({automatic:true});
        }
      }else{
        figure.classList.remove("is-in-view");
        if(key==="visual"&&lessonPlaying)stopLessonPlayback();
      }
    }
  },{threshold:.24});
  figures.forEach(figure=>lessonFigureObserver.observe(figure));
}
function observeLessonMotionPreference(){
  if(lessonMotionObserver)return;
  lessonMotionObserver=new MutationObserver(()=>{
    if(reducedLessonMotion()){
      stopLessonPlayback();lessonPlaybackComplete=true;renderLesson();
    }else renderLesson();
  });
  lessonMotionObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-motion"]});
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change",()=>{
    if(reducedLessonMotion()){stopLessonPlayback();lessonPlaybackComplete=true;renderLesson();}
    else renderLesson();
  });
}
function startLessonPlayback(){
  if(reducedLessonMotion())return;
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
  if(!events.length)return;
  if(lessonVisualStep>=events.length-1)lessonVisualStep=0;
  lessonAutoplayStarted=true;
  lessonPlaybackComplete=false;
  lessonClock=createClock({duration:events.length*1300});
  lessonClock.seek(lessonVisualStep*1300);lessonClock.play();lessonPlaying=true;renderLesson();
  let previous=null;
  const frame=timestamp=>{
    if(!lessonPlaying||!lessonClock)return;
    if(previous!==null){
      const oldStep=lessonVisualStep;
      lessonClock.advance(Math.min(100,Math.max(0,timestamp-previous)));
      lessonVisualStep=Math.min(events.length-1,Math.floor(lessonClock.time/1300));
      if(lessonVisualStep!==oldStep)renderLesson();
    }
    previous=timestamp;
    if(lessonClock.playing)lessonPlaybackFrame=requestAnimationFrame(frame);
    else{lessonPlaying=false;lessonPlaybackFrame=0;lessonPlaybackComplete=true;renderLesson();}
  };
  lessonPlaybackFrame=requestAnimationFrame(frame);
}
function renderLesson(){
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const mathLesson=mathLessonById(lesson.id);
  const sourceLesson=sourceLessonById(lesson.id);
  const sceneLesson=Boolean(mathLesson||sourceLesson);
  const topicLessonCount=temaPorId(selectedTheme)?.lecciones.length??flowLessons.length;
  const host=$("#lesson-detail");if(!host)return;
  const completed=calculateLessonProgress([lesson.id],learnProgress.completed).completed===1;
  const recipe=lessonRecipe(lesson.id);
  const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
  if(reducedLessonMotion())lessonVisualStep=Math.max(0,events.length-1);
  const steps=events.map((item,index)=>'<li><span>'+String(index+1).padStart(2,"0")+'</span><p>'+escapeHTML(item.scene?.body??item.message??item.sourceText??"Paso del algoritmo")+'</p></li>').join("");
  const activeLine=events[Math.min(lessonVisualStep,Math.max(0,events.length-1))]?.sourceLine;
  const codeLines=(sceneLesson?lesson.example.steps:lesson.miniProgram.code.split("|")).map((line,index)=>'<li class="'+(activeLine===index+1?"is-active":"")+'"><span>'+(index+1)+'</span><code>'+escapeHTML(line)+'</code></li>').join("");
  const options=lesson.check.options.map((option,index)=>'<button type="button" class="lesson-option" data-check-option="'+index+'"><span>'+String.fromCharCode(65+index)+'</span>'+escapeHTML(option)+'</button>').join("");
  const prereq=lesson.id==="process"?"Variables":lesson.id==="arithmetic"?"Asignación":lesson.id==="for"?"Contador y acumulador":"";
  const idea='<section class="lesson-reading-section" id="lesson-idea"><p class="eyebrow">01 · IDEA</p><p class="lesson-intuitive">'+escapeHTML(recipe?.idea??lesson.intuitive)+'</p><div class="lesson-idea-scene lesson-idea-scene-'+escapeHTML(lesson.visual.kind)+'" data-lesson-kind="'+escapeHTML(lesson.visual.kind)+'">'+lessonScene(lesson,reducedLessonMotion()?Math.max(0,events.length-1):0)+'</div>'+(prereq?'<p class="lesson-prerequisite">Antes conviene ver: <button type="button" data-prerequisite="'+escapeHTML(prereq)+'">'+escapeHTML(prereq)+'</button></p>':"")+'</section>';
  const concept='<section class="lesson-reading-section" id="lesson-concept"><p class="eyebrow">02 · CONCEPTO</p><p class="lesson-support-copy">'+escapeHTML(lesson.visual.caption)+'</p>'+visualMarkup(lesson)+'</section>';
  const term='<section class="lesson-reading-section" id="lesson-term"><p class="eyebrow">03 · PALABRA TÉCNICA</p><h4 class="lesson-term-title">'+escapeHTML(recipe?.term??LESSON_TERMS[lesson.id]??lesson.title)+'</h4><p class="lesson-term-definition">'+escapeHTML(lesson.technical)+'</p><p class="lesson-key-idea"><b>En pocas palabras</b> '+escapeHTML(lesson.summary??lesson.objective)+'</p>'+(mathLesson?'<details class="lesson-technical"><summary>Glosario del tema</summary><p>Entero, racional, numerador, denominador, mcm, razón, proporción, directa e inversa.</p></details>':sourceLesson?'<details class="lesson-technical"><summary>Nota de clasificación</summary><p>Según el autor, las fronteras entre fuentes primarias, secundarias y terciarias pueden cambiar. Revisa siempre de dónde viene el dato y cómo se obtuvo.</p></details>':'<details class="lesson-technical"><summary>Cómo se escribe o se representa</summary><p>'+escapeHTML(lesson.example.code.split("|").join(" · "))+'</p></details>')+'</section>';
  const example='<section class="lesson-reading-section" id="lesson-example"><p class="eyebrow">04 · EJEMPLO PASO A PASO</p><h4>'+escapeHTML(sceneLesson?lesson.title:lesson.miniProgram.title)+'</h4><div class="lesson-worked-layout"><ol class="lesson-code-lines" aria-label="'+(sceneLesson?"Momentos de la escena":"Pseudocódigo con la línea activa")+'">'+codeLines+'</ol><ol class="lesson-worked-steps">'+steps+'</ol></div><p class="lesson-example-note">'+escapeHTML(lesson.example.explanation)+'</p>'+(sceneLesson?"":'<details class="lesson-interactive-test"><summary>Probar con otros datos</summary><label class="lesson-data-control"><span>Datos de entrada</span><input id="lesson-data-input" type="text" value="'+escapeHTML(lesson.miniProgram.sample.join(", "))+'" aria-label="Datos de entrada separados por coma"></label><div class="lesson-example-output" id="lesson-data-result" role="status"></div><button type="button" class="button button-primary" data-run-mini-program>Ejecutar prueba</button></details>')+'</section>';
  const practice='<section class="lesson-reading-section" id="lesson-practice"><p class="eyebrow">05 · INTÉNTALO</p><h4>'+escapeHTML(lesson.tryIt?.prompt??"Predice antes de ver la respuesta.")+'</h4><p class="lesson-common-error"><b>Error común:</b> '+escapeHTML(lesson.commonError??"Revisa el orden de las instrucciones.")+'</p><p>'+escapeHTML(lesson.check.question)+'</p><div class="lesson-options">'+options+'</div><p class="lesson-feedback" id="lesson-feedback" role="status"></p><button type="button" class="text-link" data-skip-practice>Saltar la práctica</button></section>';
  const summary='<section class="lesson-reading-section lesson-summary-section" id="lesson-summary"><p class="eyebrow">06 · RESUMEN</p><h4>'+escapeHTML(lesson.title)+'</h4><div class="lesson-summary-points"><p><span aria-hidden="true">◇</span>'+escapeHTML(lesson.intuitive.split(/[.!?]/)[0])+'.</p><p><span aria-hidden="true">⌘</span>'+escapeHTML(lesson.summary??lesson.objective)+'</p><p><span aria-hidden="true">✓</span>'+escapeHTML(lesson.objective)+'</p></div><button type="button" class="text-link lesson-complete-toggle" data-lesson-complete aria-pressed="'+String(completed)+'">'+(completed?"✓ Lección completada · Desmarcar":"Marcar como completada")+'</button>'+(completed&&lesson.order<topicLessonCount?'<button type="button" class="button button-secondary" data-lesson-next>Siguiente lección</button>':"")+'</section>';
  const currentLesson=$("#learn-current-lesson"),currentLessonWrap=$("#learn-current-lesson-wrap");
  if(currentLesson)currentLesson.textContent=lesson.title;
  if(currentLessonWrap)currentLessonWrap.hidden=false;
  host.innerHTML='<button type="button" class="lesson-sheet-theme-toggle" data-sheet-theme-toggle aria-pressed="false"><span data-sheet-theme-icon aria-hidden="true">◐</span></button><div class="lesson-reader lesson-sheet-reader">'+
    '<header class="lesson-detail-heading"><div><p class="eyebrow">LECCIÓN '+String(lesson.order).padStart(2,"0")+' / '+topicLessonCount+' · '+escapeHTML(lesson.duration.toUpperCase())+' · DIFICULTAD '+lessonDifficulty(lesson)+'/3</p><h3>'+escapeHTML(lesson.title)+'</h3><p>'+escapeHTML(lesson.objective)+'</p><button type="button" class="lesson-list-toggle" data-learn-list>‹ Lista de lecciones</button></div></header>'+
    '<div class="lesson-reading-progress" role="progressbar" aria-label="Progreso de lectura" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>'+idea+concept+term+example+practice+summary+'</div>';
  if($("#lesson-data-input"))updateLessonData();
  observeLessonFigures();
  saveLearnProgress();
}

function updateLessonData(){
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const input=$("#lesson-data-input");
  const output=$("#lesson-data-result");
  if(!input||!output)return;
  const values=lessonInputs(input.value);
  if(values.some(value=>!Number.isFinite(value))){
    output.textContent="Usa números válidos separados por comas.";
    return;
  }
  const execution=runLesson(lesson,values);
  if(!execution.ok){
    output.textContent=execution.error?.message??"No se pudo ejecutar el ejemplo.";
    return;
  }
  const result=execution.outputs.length?execution.outputs.map(value=>String(value)).join(" · "):"El programa terminó sin mostrar datos.";
  const variables=Object.entries(execution.variables??{}).map(([name,value])=>name+" = "+value).join(" · ");
  output.textContent="Salida: "+result+(variables?" | Variables: "+variables:"");
}
function adaptedExercises(){return exercises.map(item=>adaptLegacyExercise(item,exerciseConceptLabels(item),CLASS_EXERCISES.has(item.id)));}
function mathCatalogItems(){return [...mathExercises,...generatedMathExercises];}
function exerciseRowMarkup({id,index,title,difficulty,selector,selected,classExercise=false,pending=false}){
  const level=EXERCISE_LEVELS[difficulty]??EXERCISE_LEVELS[1],status=exerciseStatus(selectedExerciseTheme,id);
  return '<button type="button" class="exercise-card exercise-list-row '+(selected?'is-selected ':'')+status.className+'" '+selector+' aria-current="'+String(selected)+'" aria-label="Ejercicio '+String(index).padStart(2,"0")+': '+escapeHTML(title)+'. '+(pending?'Por confirmar. ':"")+level.label+'. '+status.label+'"><span class="exercise-number">'+String(index).padStart(2,"0")+'</span><strong>'+escapeHTML(title)+'</strong><span class="exercise-level '+level.className+'">'+(pending?'Por confirmar':level.label)+'</span><span class="exercise-row-status '+status.className+'"><span aria-hidden="true">'+status.icon+'</span>'+status.label+'</span>'+(classExercise?'<span class="exercise-class-tag">De clase</span>':"")+'</button>';
}
function updateExerciseListSummary(count,total){
  const summary=$("#exercise-filter-summary"),topicCount=$("#exercise-topic-count");
  if(summary)summary.textContent=count===total?count+" ejercicios":count+" de "+total+" ejercicios";
  if(topicCount)topicCount.textContent=total+" ejercicios";
}
function renderMathExerciseCards(host){
  const query=exerciseQuery.trim().toLocaleLowerCase("es");
  const all=mathCatalogItems().filter(item=>item.topic===selectedExerciseTheme);
  const filtered=all.filter(item=>(mathTopicFilter==="todos"||item.topic===mathTopicFilter)&&
    (!exerciseLevels.size||exerciseLevels.has(String(item.difficulty)))&&(!exerciseClassOnly||item.classExercise)&&
    (!query||`${item.id} ${item.title} ${item.statement} ${item.expression??""} ${item.type??""}`.toLocaleLowerCase("es").includes(query)))
    .sort((a,b)=>a.difficulty-b.difficulty||a.id.localeCompare(b.id,"es"));
  renderExerciseDifficultyFilters();
  host.innerHTML=filtered.length?filtered.map((item,index)=>exerciseRowMarkup({id:item.id,index:all.slice().sort((a,b)=>a.difficulty-b.difficulty||a.id.localeCompare(b.id,"es")).indexOf(item)+1,title:item.title,difficulty:item.difficulty,selector:'data-select-math-exercise="'+escapeHTML(item.id)+'"',selected:item.id===selectedMathExercise?.id,classExercise:item.classExercise,pending:item.pending})).join(""):'<div class="catalog-empty"><strong>Ningún ejercicio coincide</strong><button type="button" class="button button-secondary" id="exercise-empty-clear">Limpiar filtros</button></div>';
  updateExerciseListSummary(filtered.length,all.length);
}
function setSourceExerciseControls(){
  const generator=$("#exercise-generate-math");
  if($("#exercise-math-topic-wrap"))$("#exercise-math-topic-wrap").hidden=true;
  if(generator)generator.hidden=exerciseBank!=="matematicas";
}
function renderSourceExerciseCards(host){
  setSourceExerciseControls();
  const query=exerciseQuery.trim().toLocaleLowerCase("es");
  const filtered=sourceExercises.filter(item=>(!exerciseLevels.size||exerciseLevels.has(String(item.level)))&&(!query||[item.id,item.title,item.prompt,item.options.join(" "),item.why].join(" ").toLocaleLowerCase("es").includes(query)));
  renderExerciseDifficultyFilters();
  host.innerHTML=filtered.length?filtered.map(item=>exerciseRowMarkup({id:item.id,index:sourceExercises.indexOf(item)+1,title:item.title,difficulty:item.level,selector:'data-source-level="'+item.level+'" data-select-source-exercise="'+escapeHTML(item.id)+'"',selected:item.id===selectedSourceExercise?.id})).join(""):'<div class="catalog-empty"><strong>Ningún ejercicio coincide</strong><button type="button" class="button button-secondary" id="exercise-empty-clear">Limpiar filtros</button></div>';
  host.parentElement.querySelector(".exercise-pagination")?.remove();
  updateExerciseListSummary(filtered.length,sourceExercises.length);
}
function renderSourceExerciseDetail(host){
  const item=selectedSourceExercise;if(!item){host.innerHTML='<div class="detail-empty"><span class="detail-empty-mark">24</span><p class="eyebrow">EJERCICIOS · FUENTES</p><h3>Elige un reto para empezar.</h3><p>Clasifica evidencias, selecciona técnicas y decide cómo actuar cuando hay vacíos o discrepancias.</p></div>';return;}
  const position=sourceExercises.indexOf(item),attempt=sourceExerciseAnswers.get(item.id),answered=Number.isInteger(attempt),correct=answered&&attempt===item.answer;
  host.innerHTML='<div class="exercise-detail-scroll source-exercise-detail"><nav class="exercise-detail-nav"><button type="button" data-source-exercise-neighbor="-1" '+(position===0?"disabled":"")+'>‹ Anterior</button><span>'+escapeHTML(item.id)+'</span><button type="button" data-source-exercise-neighbor="1" '+(position===sourceExercises.length-1?"disabled":"")+'>Siguiente ›</button></nav><header class="exercise-detail-heading"><span class="exercise-level level-'+(["basic","intermediate","advanced","expert"][item.level-1])+'">'+sourceExerciseLevels[item.level]+'</span><h3>'+escapeHTML(item.title)+'</h3><div class="concept-tags"><span>'+escapeHTML(sourceScenarios.find(scenario=>scenario.id===item.scenario)?.title??"Recolección de información")+'</span><span>Respuesta única</span><span>Justificación incluida</span></div></header><section class="exercise-prompt"><p class="eyebrow">EL RETO</p><p>'+escapeHTML(item.prompt)+'</p></section><fieldset class="source-exercise-options"><legend>Elige la mejor respuesta</legend>'+item.options.map((option,index)=>'<button type="button" data-source-exercise-answer="'+index+'" aria-pressed="'+String(attempt===index)+'" class="'+(answered&&index===item.answer?"is-correct-option":answered&&attempt===index?"is-wrong-option":"")+'"><span>'+String.fromCharCode(65+index)+'</span>'+escapeHTML(option)+'</button>').join("")+'</fieldset>'+(answered?'<section class="source-exercise-feedback '+(correct?"is-correct":"is-wrong")+'" role="status"><strong>'+(correct?"Correcto":"Revisa la respuesta")+'</strong><p>Respuesta: '+escapeHTML(item.options[item.answer])+'</p><p><b>Por qué:</b> '+escapeHTML(item.why)+'</p></section>':'<p class="source-exercise-hint">Una sola opción responde al caso; la explicación queda ligada a la decisión.</p>')+'<button type="button" class="button button-primary" data-start-source-simulator="'+escapeHTML(item.scenario)+'">Abrir en la Mesa de recolección</button></div>';
}
function renderExerciseCards(){
  const host=$("#exercise-grid");if(!host)return;
  setSourceExerciseControls();
  if(exerciseBank==="fuentes"){renderSourceExerciseCards(host);return;}
  if(exerciseBank==="matematicas"){renderMathExerciseCards(host);return;}
  const query=exerciseQuery.trim().toLocaleLowerCase("es"),all=adaptedExercises().sort((a,b)=>a.dificultad-b.dificultad||a.id-b.id);
  const filtered=all.filter(item=>{
    const source=exercises.find(exercise=>exercise.id===item.id),labels=exerciseConceptLabels(source);
    const matchLevel=!exerciseLevels.size||exerciseLevels.has(String(item.dificultad));
    const searchable=[item.titulo,item.enunciado,...labels].join(" ").toLocaleLowerCase("es");
    return matchLevel&&(!exerciseClassOnly||item.esDeClase)&&(!query||searchable.includes(query)||String(item.id)===query);
  });
  renderExerciseDifficultyFilters();
  host.innerHTML=filtered.length?filtered.map(item=>exerciseRowMarkup({id:item.id,index:all.indexOf(item)+1,title:item.titulo,difficulty:item.dificultad,selector:'data-select-exercise="'+item.id+'"',selected:item.id===selectedExercise?.id,classExercise:item.esDeClase})).join(""):'<div class="catalog-empty"><strong>Ningún ejercicio coincide</strong><button type="button" class="button button-secondary" id="exercise-empty-clear">Limpiar filtros</button></div>';
  updateExerciseListSummary(filtered.length,all.length);
}
function renderMathExerciseDetail(host){
  const item=selectedMathExercise,verified=mathAnswerResults.get(item.id),revealed=revealedMathSolutions.has(item.id);
  if(item.pending){host.innerHTML='<div class="exercise-detail-scroll math-exercise-detail"><header class="exercise-detail-heading"><span class="exercise-class-tag">Por confirmar con el original</span><h3>'+escapeHTML(item.title)+'</h3></header><section class="exercise-prompt"><p class="eyebrow">TRANSCRIPCIÓN ORIGINAL</p><p>'+escapeHTML(item.statement)+'</p></section><p class="math-inline-status">Este enunciado se conserva tal cual aparece en la evidencia. Su primer término puede ser un error de digitación; no se calcula ni se corrige.</p></div>';return;}
  const solution=item.topic==="regla-de-tres"?'<ol><li>Tipo declarado: proporcionalidad '+escapeHTML(item.type)+'.</li><li>'+escapeHTML(item.type==="directa"?`${item.rule.b} × ${item.rule.c} ÷ ${item.rule.a}`:`${item.rule.a} × ${item.rule.b} ÷ ${item.rule.c}`)+' = '+escapeHTML(item.expectedText)+'.</li><li>'+escapeHTML(item.verification)+'</li></ol>':'<ol>'+item.solution.map(step=>'<li>'+escapeHTML(step.expression)+' = '+escapeHTML(step.result)+'</li>').join("")+'</ol>';
  const answer=verified?'<p class="math-answer-feedback '+(verified.correct?"is-correct":"is-wrong")+'" id="math-answer-feedback" role="status">'+escapeHTML(verified.message)+'</p>':'<p class="math-answer-feedback" id="math-answer-feedback" role="status"></p>';
  host.innerHTML='<div class="exercise-detail-scroll math-exercise-detail"><nav class="exercise-detail-nav"><span>'+escapeHTML(item.id)+'</span><span>'+escapeHTML(item.source)+'</span></nav><header class="exercise-detail-heading"><span class="exercise-class-tag">'+(item.classExercise?"De clase":"Generado · semilla reproducible")+'</span><h3>'+escapeHTML(item.title)+'</h3><div class="concept-tags"><span>'+escapeHTML(item.topic.replaceAll("-"," "))+'</span><span>Nivel '+item.difficulty+'</span>'+(item.type?'<span>Proporción '+escapeHTML(item.type)+'</span>':"")+'</div></header><section class="exercise-prompt"><p class="eyebrow">EL RETO</p><p>'+escapeHTML(item.statement)+'</p>'+(item.expression?'<p class="math-exercise-expression">'+escapeHTML(item.expression)+'</p>':"")+'</section><form class="math-answer-form" data-math-answer-form><label for="math-answer">Tu respuesta</label><div><input id="math-answer" name="answer" inputmode="decimal" autocomplete="off" placeholder="Ejemplo: −3/7" aria-describedby="math-answer-feedback"><button type="submit" class="button button-primary">Comprobar</button></div>'+answer+'</form>'+(revealed?'<section class="exercise-solution math-exercise-solution"><p class="eyebrow">SOLUCIÓN PASO A PASO</p>'+solution+'<strong>Resultado: '+escapeHTML(item.expectedText)+'</strong></section>':'<button type="button" class="text-link" data-reveal-math-solution>Ver solución paso a paso</button>')+'<button type="button" class="button button-secondary exercise-open-simulator" data-start-math-exercise>Abrir en el Simulador</button></div>';
}
function renderExerciseDetail(){
  const host=$("#exercise-detail");if(!host)return;
  if(exerciseBank==="fuentes"){renderSourceExerciseDetail(host);return;}
  if(selectedMathExercise){renderMathExerciseDetail(host);return;}
  const item=selectedExercise;
  if(!item){
    host.innerHTML='<div class="detail-empty">'+
      '<span class="detail-empty-mark">↖</span><p class="eyebrow">DETALLE</p><h3>Elige una tarjeta</h3><p>Lee el reto, piensa los pasos y prueba tu solución cuando estés listo.</p>'+
      '<span class="exercise-detail-hint"><i aria-hidden="true">↖</i> Elige una tarjeta para abrir su ficha.</span></div>';
    return;
  }
  const level=LEVELS[item.level];
  const concepts=exerciseConceptLabels(item);
  const ordered=adaptedExercises().filter(ex=>!exerciseLevels.size||exerciseLevels.has(String(ex.dificultad))).filter(ex=>!exerciseClassOnly||ex.esDeClase).filter(ex=>{const q=exerciseQuery.trim().toLocaleLowerCase("es"),src=exercises.find(x=>x.id===ex.id);return !q||[src.title,src.statement,...exerciseConceptLabels(src)].join(" ").toLocaleLowerCase("es").includes(q)||String(ex.id)===q;}).sort((a,b)=>a.dificultad-b.dificultad||a.id-b.id);
  const position=ordered.findIndex(ex=>ex.id===item.id),revealed=revealedExerciseSolutions.has(item.id);
  const adapted=adaptLegacyExercise(item,concepts,CLASS_EXERCISES.has(item.id));
  const sections=availableExerciseSolutionSections(adapted.solucion);
  const lessonLink=concepts.map(label=>{const id=conceptoPorEtiqueta(label)?.id;const map={figuras:"terminals",flujo:"reading",entrada:"input",salida:"output",variables:"variables",asignacion:"variables",operaciones:"arithmetic",tipos:"terminals",comparaciones:"comparisons",decisiones:"decisions",logica:"nested-decisions",contadores:"counters-accumulators",acumuladores:"counters-accumulators","ciclo-para":"for","ciclo-mientras":"while","ciclo-hacer-mientras":"do-while",depuracion:"validation-sentinel",traza:"algorithm",programa:"algorithm"};return lessons.find(lesson=>lesson.id===map[id]);}).find(Boolean);
  const recipe=lessonRecipe(lessonLink?.id),mini=recipe?recipeSceneMarkup(recipe,0,0):'<svg viewBox="0 0 280 96" role="img" aria-label="Vista previa estática de un diagrama"><ellipse cx="140" cy="13" rx="32" ry="10"/><path d="M140 23v10m-4-4 4 4 4-4"/><rect x="94" y="34" width="92" height="22" rx="3"/><path d="M140 56v10m-4-4 4 4 4-4"/><path d="M140 66l24 14-24 14-24-14z"/></svg>';
  const scrollKey=selectedExerciseTheme+":"+item.id,previousScroll=host.querySelector(".exercise-detail-scroll");
  if(previousScroll&&selectedExercise)exerciseDetailScroll.set(selectedExerciseTheme+":"+selectedExercise.id,previousScroll.scrollTop);
  host.innerHTML='<div class="exercise-detail-scroll sheet-theme-surface" data-exercise-sheet="'+escapeHTML(scrollKey)+'">'+
    '<button type="button" class="lesson-sheet-theme-toggle" data-sheet-theme-toggle aria-pressed="false"><span data-sheet-theme-icon aria-hidden="true">◐</span></button>'+
    '<nav class="exercise-detail-nav"><button type="button" data-exercise-neighbor="'+(ordered[position-1]?.id??"")+'" '+(position<=0?'disabled':'')+'>‹ Anterior</button><span>'+String(item.id).padStart(2,"0")+'</span><button type="button" data-exercise-neighbor="'+(ordered[position+1]?.id??"")+'" '+(position>=ordered.length-1?'disabled':'')+'>Siguiente ›</button></nav>'+
    '<header class="exercise-detail-heading"><div class="exercise-detail-kicker"><span class="exercise-number">'+String(item.id).padStart(2,"0")+'</span><span class="exercise-level '+level.className+'">'+level.label+'</span>'+(CLASS_EXERCISES.has(item.id)?'<span class="exercise-class-tag">De clase</span>':"")+'</div><h3>'+escapeHTML(item.title)+'</h3><div class="concept-tags">'+concepts.map(tag=>'<span>'+escapeHTML(tag)+'</span>').join("")+'</div></header>'+
    '<div class="exercise-static-preview">'+mini+'</div><section class="exercise-prompt"><p class="eyebrow">EL RETO</p><p>'+escapeHTML(item.statement)+'</p><span class="exercise-level '+level.className+'">'+level.label+'</span></section>'+
    (concepts.length?'<section class="exercise-concepts"><h4>Conceptos que se usan</h4><div class="concept-tags">'+concepts.map(tag=>'<button type="button" class="text-link" data-open-exercise-lesson="'+escapeHTML(({"Ciclo Para":"for","Ciclo Mientras":"while","Ciclo Hacer–Mientras":"do-while","Entrada de datos":"input","Asignación":"variables","Imprimir":"output","Decisiones":"decisions","Operaciones aritméticas":"arithmetic","Comparaciones":"comparisons"})[tag]??"algorithm")+'">'+escapeHTML(tag)+' · ver lección</button>').join("")+'</div></section>':"")+
    (item.inputs.length?'<section class="exercise-sample"><p class="eyebrow">DATOS DE EJEMPLO</p><ul>'+item.inputs.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></section>':"")+
    '<section class="exercise-guide"><h4>Antes de empezar</h4><ol>'+adapted.preguntasGuia.map(question=>'<li>'+escapeHTML(question)+'</li>').join("")+'</ol></section>'+
    sections.map(section=>'<section class="exercise-solution-section" data-solution-section="'+section.key+'"><h4>'+escapeHTML(section.title)+'</h4>'+(Array.isArray(section.content)?'<ol>'+section.content.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ol>':'<p>'+escapeHTML(section.content)+'</p>')+'</section>').join("")+
    '<details class="exercise-source-solution"><summary>Ver pseudocódigo de referencia</summary><pre>'+escapeHTML(item.methods[0]?.pseudocode??"")+'</pre><p>Comprueba el resultado con los datos del ejercicio.</p></details>'+
    '<button type="button" class="button button-primary exercise-open-simulator" data-start-exercise>Ver en el Simulador</button>'+
    '<button type="button" class="text-link exercise-resolved-toggle" data-exercise-resolved aria-pressed="'+String(completedExerciseKeys().has(selectedExerciseTheme+":"+item.id))+'">'+(completedExerciseKeys().has(selectedExerciseTheme+":"+item.id)?"✓ Resuelto · Marcar como pendiente":"Marcar como resuelto")+'</button>'+
    (lessonLink?'<button type="button" class="text-link" data-open-exercise-lesson="'+lessonLink.id+'">Ver lección: '+escapeHTML(lessonLink.title)+'</button>':"")+
    '</div>';
  const detail=host.querySelector(".exercise-detail-scroll");if(detail)detail.scrollTop=exerciseDetailScroll.get(scrollKey)??0;
  if(detail?.classList.contains("sheet-theme-surface"))syncSheetThemes(host);
}
function confirmExerciseInSimulator(){
  if(selectedSourceExercise){openSourceSimulator(selectedSourceExercise.scenario);return;}
  if(selectedMathExercise){
    document.querySelector('#primary-nav [data-space="simulator"]')?.click();
    document.dispatchEvent(new CustomEvent("traza:open-math-player",{detail:{exerciseId:selectedMathExercise.id,exercise:selectedMathExercise}}));
    return;
  }
  const item=selectedExercise;if(!item)return;
  selectedMethod=0;
  document.dispatchEvent(new CustomEvent("traza:request-simulation",{detail:{exerciseId:item.id,methodIndex:0}}));
  document.querySelector('#primary-nav [data-space="simulator"]')?.click();
}
function openSourceSimulator(scenarioId="tienda-marta"){
  document.dispatchEvent(new CustomEvent("traza:open-source-simulator",{detail:{scenarioId}}));
  document.querySelector('#primary-nav [data-space="simulator"]')?.click();
}
function selectExercise(id){
  const current=$("#exercise-detail .exercise-detail-scroll");if(current&&selectedExercise)exerciseDetailScroll.set(selectedExerciseTheme+":"+selectedExercise.id,current.scrollTop);
  selectedMathExercise=null;selectedSourceExercise=null;
  selectedExercise=exercises.find(item=>item.id===Number(id))??null;
  if(selectedExercise)markExerciseViewed(selectedExerciseTheme,selectedExercise.id);
  selectedMethod=0;
  renderExerciseCards();
  renderExerciseDetail();
  if(selectedExercise){
    const card=$('[data-select-exercise="'+selectedExercise.id+'"]');
    if(window.matchMedia("(min-width: 801px)").matches)card?.scrollIntoView({block:"nearest"});
  }
  closeMobileExerciseList();
}
function selectMathExercise(id){
  selectedExercise=null;selectedSourceExercise=null;selectedMathExercise=mathCatalogItems().find(item=>item.id===id)??null;
  if(selectedMathExercise)markExerciseViewed(selectedExerciseTheme,selectedMathExercise.id);
  renderExerciseCards();renderExerciseDetail();closeMobileExerciseList();
}
function selectSourceExercise(id){
  selectedExercise=null;selectedMathExercise=null;selectedSourceExercise=sourceExercises.find(item=>item.id===id)??null;
  if(selectedSourceExercise)markExerciseViewed(selectedExerciseTheme,selectedSourceExercise.id);
  renderExerciseCards();renderExerciseDetail();closeMobileExerciseList();
}

function selectLesson(id){
  if(!lessons.some(lesson=>lesson.id===id))return;
  stopLessonPlayback();lessonAutoplayStarted=false;lessonPlaybackComplete=false;lessonEntrySeen.clear();selectedLesson=id;lessonVisualStep=0;lessonScreenStep=0;
  saveLearnProgress();lessonList();renderLesson();
  renderTopicSpace();
  $("#learn-topic-space")?.classList.remove("is-list-open");
}
function bindContentEvents(){
  $("#exercise-generate-math")?.addEventListener("click",()=>{
    const topic=mathTopicFilter==="todos"?"enteros":mathTopicFilter;
    const difficulty=Number([...exerciseLevels][0])||1;
    const item=generateMathExercise(topic,difficulty,`${topic}-${difficulty}-${generatedMathExercises.length+1}`);
    generatedMathExercises.unshift(item);selectMathExercise(item.id);
  });
  const progressDrawer=$("#learn-progress-page");
  $("#learn-open-progress")?.addEventListener("click",event=>{
    if(!progressDrawer)return;
    progressReturnFocus=event.currentTarget;renderLearnProgress();progressDrawer.showModal();
    progressDrawer.querySelector("[data-progress-close]")?.focus({preventScroll:true});
  });
  progressDrawer?.addEventListener("click",event=>{
    if(event.target===progressDrawer||event.target.closest("[data-progress-close]")){progressDrawer.close();return;}
    if(event.target.closest("[data-progress-start]")){
      const first=lessons.find(item=>!learnProgress.completed.includes(item.id))??lessons[0];
      progressDrawer.close();navigateToLesson(first.id);return;
    }
    const topicButton=event.target.closest("[data-progress-open-theme]");
    if(topicButton){
      const theme=temaPorId(topicButton.dataset.progressOpenTheme);
      if(!theme)return;
      selectedLesson=theme.lecciones.find(id=>!learnProgress.completed.includes(id))??theme.lecciones[0];
      progressDrawer.close();openTheme(theme.id);
    }
  });
  progressDrawer?.addEventListener("close",()=>{
    progressReturnFocus?.focus({preventScroll:true});progressReturnFocus=null;
  });
  $("#learn-topic-space")?.addEventListener("click",event=>{if(event.target.closest("[data-learn-back]"))backToCompetences();});
  $("#learn-catalog-bands")?.addEventListener("click",event=>{
    if(event.target.closest("[data-competence-back]")){selectedCompetence=null;renderLearnCatalog();return;}
    const card=event.target.closest("[data-topic-open]");
    if(card){const topic=temaPorId(card.dataset.topicOpen);if(topic?.estado==="disponible")openTheme(topic.id);}
  });
  $("#learn-competence-filters")?.addEventListener("click",event=>{const card=event.target.closest("[data-learn-competence]");if(!card)return;selectedCompetence=card.dataset.learnCompetence;renderLearnCatalog();});
  document.addEventListener("traza:abrir-leccion",event=>{const id=event.detail?.id;if(typeof id==="string")navigateToLesson(id);});
  document.addEventListener("traza:space-change",event=>{
    const space=event.detail?.space;
    const previousSpace=lastContentSpace;lastContentSpace=space;
    if(space!=="learn"&&progressDrawer?.open)progressDrawer.close();
    if(space==="learn"){
      if(selectedTheme){showLearnPanel("topic");renderTopicSpace();lessonList();renderLesson();}
      else {showLearnPanel("catalog");renderLearnCatalog();}
      return;
    }
    if(space==="exercises"){
      if(previousSpace!=="simulator")backToExerciseThemes();
      else if(selectedExerciseTheme){showExerciseTopicWorkspace(true);renderExerciseCards();renderExerciseDetail();}
      else backToExerciseThemes();
    }
    if(space==="simulator"&&selectedTheme==="fuentes-informacion")openSourceSimulator();
  });
  document.addEventListener("traza:actividad-laboratorio",()=>{recordLearnActivity();saveLearnProgress();});
  $("#lesson-catalog")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lesson-id]");
    if(!button)return;
    selectLesson(button.dataset.lessonId);
  });
  $("#lesson-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-learn-list]")){$("#learn-topic-space")?.classList.add("is-list-open");return;}
    if(event.target.closest("[data-skip-practice]")){const feedback=$("#lesson-feedback");if(feedback)feedback.textContent="Práctica saltada. Puedes seguir al resumen.";return;}
    if(event.target.closest("[data-prerequisite]")){const name=event.target.closest("[data-prerequisite]").dataset.prerequisite;const match=lessons.find(item=>item.title.toLocaleLowerCase("es").includes(name.toLocaleLowerCase("es")));if(match)selectLesson(match.id);return;}
    if(event.target.closest("[data-lesson-next]")){const ids=temaPorId(selectedTheme)?.lecciones??flowLessons.map(item=>item.id);const index=ids.indexOf(selectedLesson);if(index>=0&&index<ids.length-1)selectLesson(ids[index+1]);return;}
    if(event.target.closest("[data-lesson-complete]")){completeLesson();return;}
  });
  $("#lesson-detail")?.addEventListener("input",event=>{
    if(event.target.id==="lesson-data-input")updateLessonData();
  });
  $("#lesson-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-visual-next]")){
      stopLessonPlayback();
      const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
      const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
      lessonVisualStep=Math.min(Math.max(0,events.length-1),lessonVisualStep+1);lessonClock?.seek(lessonVisualStep*1300);renderLesson();
    }
    if(event.target.closest("[data-visual-prev]")){
      stopLessonPlayback();lessonVisualStep=Math.max(0,lessonVisualStep-1);lessonClock?.seek(lessonVisualStep*1300);renderLesson();
    }
    if(event.target.closest("[data-visual-reset]")){
      stopLessonPlayback();lessonVisualStep=0;lessonClock?.restart();renderLesson();
    }
    if(event.target.closest("[data-visual-play]")){
      if(lessonPlaying){stopLessonPlayback();renderLesson();}
      else startLessonPlayback();
    }
    if(event.target.closest("[data-run-mini-program]"))updateLessonData();
    const answer=event.target.closest("[data-check-option]");
    if(answer){
      const lesson=lessons.find(item=>item.id===selectedLesson);
      const chosen=Number(answer.dataset.checkOption);
      $$(".lesson-option",$("#lesson-detail")).forEach(button=>{
        const index=Number(button.dataset.checkOption);
        button.classList.toggle("is-correct",index===lesson.check.answer);
        button.classList.toggle("is-wrong",index===chosen&&chosen!==lesson.check.answer);
        button.disabled=true;
      });
      const feedback=$("#lesson-feedback");
      feedback.textContent=chosen===lesson.check.answer?"Correcto. "+lesson.check.why:"Revisa la pista. "+lesson.check.why;
      feedback.classList.toggle("is-correct",chosen===lesson.check.answer);
      feedback.classList.toggle("is-wrong",chosen!==lesson.check.answer);
    }
  });
  $("#lesson-detail")?.addEventListener("change",event=>{
    if(event.target.matches("[data-visual-speed]"))lessonClock?.setSpeed(Number(event.target.value));
  });
  $("#lesson-detail")?.addEventListener("keydown",event=>{
    if(!event.target.closest("[data-visual-player]"))return;
    if(event.code==="Space"){event.preventDefault();if(lessonPlaying){stopLessonPlayback();renderLesson();}else startLessonPlayback();}
    else if(event.key==="ArrowRight"){event.preventDefault();$("[data-visual-next]",event.currentTarget)?.click();}
    else if(event.key==="ArrowLeft"){event.preventDefault();$("[data-visual-prev]",event.currentTarget)?.click();}
    else if(event.key.toLowerCase()==="r"){event.preventDefault();$("[data-visual-reset]",event.currentTarget)?.click();}
  });
  window.addEventListener("scroll",()=>{
    const reader=$(".lesson-reader"),bar=$(".lesson-reading-progress",reader??undefined);if(!reader||!bar)return;
    const top=reader.getBoundingClientRect().top+window.scrollY;
    const range=Math.max(1,reader.offsetHeight-window.innerHeight);
    const value=Math.max(0,Math.min(100,Math.round((window.scrollY-top)/range*100)));
    bar.setAttribute("aria-valuenow",String(value));$("span",bar).style.width=value+"%";
  },{passive:true});
  $("#exercise-search")?.addEventListener("input",event=>{exerciseQuery=event.target.value;renderExerciseCards();renderExerciseDetail();});
  $("#exercise-class-only")?.addEventListener("click",event=>{exerciseClassOnly=event.currentTarget.getAttribute("aria-pressed")!=="true";event.currentTarget.setAttribute("aria-pressed",String(exerciseClassOnly));renderExerciseCards();renderExerciseDetail();});
  $("#exercise-difficulty-options")?.addEventListener("click",event=>{const button=event.target.closest("[data-exercise-difficulty]");if(!button)return;const level=button.dataset.exerciseDifficulty;exerciseLevels.has(level)?exerciseLevels.delete(level):exerciseLevels.add(level);renderExerciseCards();renderExerciseDetail();});
  $("#view-exercises")?.addEventListener("click",event=>{
    const theme=event.target.closest("[data-exercise-theme]");if(theme){openExerciseTheme(theme.dataset.exerciseTheme);return;}
    if(event.target.closest("#exercise-topic-back")){backToExerciseThemes();return;}
    if(event.target.closest("#exercise-empty-clear")){exerciseQuery="";exerciseLevels.clear();exerciseClassOnly=false;if($("#exercise-search"))$("#exercise-search").value="";$("#exercise-class-only")?.setAttribute("aria-pressed","false");renderExerciseCards();renderExerciseDetail();return;}
  });
  $("#exercise-grid")?.addEventListener("click",event=>{
    const math=event.target.closest("[data-select-math-exercise]");if(math){selectMathExercise(math.dataset.selectMathExercise);return;}
    const source=event.target.closest("[data-select-source-exercise]");if(source){selectSourceExercise(source.dataset.selectSourceExercise);return;}
    const card=event.target.closest("[data-select-exercise]");if(card)selectExercise(card.dataset.selectExercise);
  });
  $("#exercise-detail")?.addEventListener("click",event=>{
    const resolved=event.target.closest("[data-exercise-resolved]");if(resolved&&selectedExercise){const progress=readExerciseProgress(),key=selectedExerciseTheme+":"+selectedExercise.id;progress.resolved.has(key)?progress.resolved.delete(key):progress.resolved.add(key);try{localStorage.setItem("traza:v1:exercise-progress",JSON.stringify({viewed:[...progress.viewed],resolved:[...progress.resolved]}));}catch{}const isResolved=progress.resolved.has(key);resolved.setAttribute("aria-pressed",String(isResolved));resolved.textContent=isResolved?"✓ Resuelto · Marcar como pendiente":"Marcar como resuelto";renderExerciseCards();renderExerciseThemeCatalog();return;}
    const sourceAnswer=event.target.closest("[data-source-exercise-answer]");if(sourceAnswer&&selectedSourceExercise){sourceExerciseAnswers.set(selectedSourceExercise.id,Number(sourceAnswer.dataset.sourceExerciseAnswer));renderExerciseDetail();return;}
    const sourceNeighbor=event.target.closest("[data-source-exercise-neighbor]");if(sourceNeighbor&&selectedSourceExercise){selectSourceExercise(sourceExercises[sourceExercises.indexOf(selectedSourceExercise)+Number(sourceNeighbor.dataset.sourceExerciseNeighbor)]?.id);return;}
    const sourceSimulator=event.target.closest("[data-start-source-simulator]");if(sourceSimulator){openSourceSimulator(sourceSimulator.dataset.startSourceSimulator);return;}
    if(event.target.closest("[data-reveal-math-solution]")&&selectedMathExercise){revealedMathSolutions.add(selectedMathExercise.id);renderExerciseDetail();return;}
    const reveal=event.target.closest("[data-reveal-solution]");if(reveal&&selectedExercise){revealedExerciseSolutions.add(selectedExercise.id);renderExerciseDetail();return;}
    const neighbor=event.target.closest("[data-exercise-neighbor]");if(neighbor?.dataset.exerciseNeighbor){selectExercise(neighbor.dataset.exerciseNeighbor);return;}
    const lesson=event.target.closest("[data-open-exercise-lesson]");if(lesson){navigateToLesson(lesson.dataset.openExerciseLesson);return;}
    if(event.target.closest("[data-start-exercise]"))confirmExerciseInSimulator();
    if(event.target.closest("[data-start-math-exercise]"))confirmExerciseInSimulator();
  });
  $("#exercise-detail")?.addEventListener("submit",event=>{
    if(!event.target.matches("[data-math-answer-form]")||!selectedMathExercise)return;
    event.preventDefault();const input=$("#math-answer",event.target),feedback=$("#math-answer-feedback",event.target),item=selectedMathExercise;
    try{
      if(item.pending||!item.expected)throw new Error("Este ejercicio todavía está por confirmar.");
      const answer=parseRationalAnswer(input.value),correct=compare(answer,item.expected)===0;
      const entered=input.value.trim().replace(/[−–]/g,"-");
      const expectedSpelling=item.expectedText.replace(/[−–]/g,"-");
      const message=correct?(item.topic==="racionales"&&entered!==expectedSpelling?`Está bien, y se puede simplificar a ${item.expectedText}.`:"Correcto. Tu respuesta es equivalente."):"Aún no coincide. Revisa los datos y el orden de las operaciones.";
      mathAnswerResults.set(item.id,{correct,message});renderExerciseDetail();
    }catch(error){if(feedback){feedback.className="math-answer-feedback is-wrong";feedback.textContent=error.message||"Escribe un número o una fracción, por ejemplo −3/7.";}}
  });
}

export function initContentViews(){
  selectedLesson=learnProgress.current;lessonScreenStep=learnProgress.screen;
  const count=$("#view-learn .lesson-catalog-panel h3");if(count)count.textContent=lessons.length+" lecciones";
  const mark=$("#view-learn .detail-empty-mark");if(mark)mark.textContent=String(lessons.length);
  lessonList();renderLesson();renderLearnCatalog();renderLearnProgress();
  const streak=$("#learn-streak");if(streak)streak.textContent="Racha: "+currentStreak(learnProgress.activityDays||[])+" días";
  if(selectedTheme){showLearnPanel("topic");renderTopicSpace();}else showLearnPanel("catalog");
  renderExerciseThemeCatalog();showExerciseTopicWorkspace(false);renderExerciseCards();renderExerciseDetail();
  bindContentEvents();
  initSheetThemes();
  observeLessonMotionPreference();
}
