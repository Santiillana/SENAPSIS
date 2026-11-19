import { flattenPseudocode } from "../core/parser.js";
import { executePseudocode } from "../core/interpreter.js";
import { buildArrowChallenge, buildGapChallenge, buildMatchChallenge, mixedModeOrder } from "./lab/generators.js";
import { conceptMedals, normalizeProgress, recordLabResult, modeStars } from "./lab/progress.js";
import { conceptos } from "../content/conceptos.js";
import { competenciasAprende, temas } from "../content/temas.js";
import { buildMathLabChallenge, mathLabCatalog, MATH_LAB } from "../math/lab-engine.js";
import { formatDecimalOrRational, parseRationalAnswer } from "../math/exact.js";
import { buildSourceLabChallenge, sourceLabMechanics, sourceLabMeta } from "../content/source-lab.js";
import { competenceMarker } from "../ficha/competencias-ui.js";

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const conceptLabels={entrada:"Entrada de datos",variables:"Variables",asignacion:"Asignación",operaciones:"Operaciones",comparaciones:"Comparaciones",decisiones:"Decisiones",contadores:"Contadores",acumuladores:"Acumuladores","ciclo-para":"Ciclo Para","ciclo-mientras":"Ciclo Mientras","ciclo-hacer-mientras":"Ciclo Hacer–Mientras",figuras:"Figuras",flujo:"Flujo y secuencia",salida:"Imprimir",traza:"Tabla de seguimiento",depuracion:"Depurar",programa:"Programa completo"};
const difficultyLabels=["Básico","Intermedio","Avanzado","Reto"];
const fmt=value=>typeof value==="number"?String(Number(value.toFixed(6))):String(value);
const hashSeed=value=>{let hash=2166136261;for(const char of String(value))hash=Math.imul(hash^char.charCodeAt(0),16777619);return hash>>>0;};
let trace=null;
let activity="predict";
let orderedLines=[];
let selectedSymbol=null;
let predictionAnswer=null;
let whatIfResult=null;
let orderChecked=false;
let errorScenario=0;
let labAttempt=0;
let gapHints=0;
let mixedQueue=[];
let mixedResults=[],mixedCurrent=null,mixedActive=false;
let matchChallenge=null;
let activityStreak=0,activityErrors=0,selectedConcept="programa",selectedDifficulty=1,whatIfPrediction=null;
let pendingActivity=null;
let catalogConcept="todos",catalogDifficulties=new Set();
let mathLabActive=false,mathLabTopic=null,mathLabMechanic=null,mathLabDifficulty=1,mathLabSeed="",mathLabRound=0,mathLabScore=0,mathLabHints=0,mathLabChallenge=null,mathLabAnswered=false;
let sourceLabActive=false,sourceLabMechanic=null,sourceLabSeed="",sourceLabRound=0,sourceLabScore=0,sourceLabHints=0,sourceLabChallenge=null,sourceLabAnswered=false;
let originalLabCatalogMarkup=null;
let activeLabTopic=null;
const activityConceptMap={
  predict:["flujo","entrada","variables","asignacion","operaciones","comparaciones","decisiones","ciclo-para","ciclo-mientras","ciclo-hacer-mientras","programa"],
  "follow-arrow":["figuras","flujo","decisiones","ciclo-para","ciclo-mientras","ciclo-hacer-mientras"],
  table:["traza","variables","contadores","acumuladores"],order:["flujo","programa"],
  "fill-gap":["variables","asignacion","operaciones","acumuladores"],"build-diagram":["figuras","flujo"],
  symbol:["figuras"],match:["figuras"],error:["depuracion","variables","asignacion","decisiones","acumuladores"],
  whatif:["operaciones","comparaciones","decisiones","programa"]
};
const activityLevels={predict:[1,2,3,4],"follow-arrow":[1,2,3,4],table:[1,2,3,4],order:[1,2,3,4],"fill-gap":[1,2,3,4],"build-diagram":[1,2,3,4],symbol:[1,2,3],match:[1,2],error:[2,3,4],whatif:[2,3,4]};
let labProgress=loadLabProgress();

function currentTopicId(){
  if(activeLabTopic)return activeLabTopic;
  try{return JSON.parse(localStorage.getItem("traza:v2:learn")||"{}").theme||"diagramas-flujo";}catch{return "diagramas-flujo";}
}
function loadLabProgress(){
  try{
    const saved=window.localStorage.getItem("traza:v2:progress");
    return normalizeProgress(saved?JSON.parse(saved):null);
  }catch{return normalizeProgress(null);}
}
function saveLabProgress(){
  try{window.localStorage.setItem("traza:v2:progress",JSON.stringify(labProgress));}catch{}
}
function updateProgressBadges(){
  const exerciseId=trace?.exercise?.id;
  if(!exerciseId)return;
  $("#lab-activity-list")?.querySelectorAll("[data-lab-activity]").forEach(button=>{
    const stars=modeStars(labProgress,exerciseId,button.dataset.labActivity);
    let output=button.querySelector(".activity-progress");
    if(!output){
      output=document.createElement("span");
      output.className="activity-progress";
      output.setAttribute("aria-label","Estrellas de progreso");
      button.append(output);
    }
    output.textContent="★".repeat(stars)+"☆".repeat(3-stars);
  });
  $("#lab-mode-cards")?.querySelectorAll("[data-topic-stars]").forEach(output=>{
    const best=Math.max(0,...Object.values(labProgress.exercises).map(item=>Number(item?.[output.dataset.topicStars]?.stars)||0));
    output.textContent="★".repeat(Math.min(3,best))+"☆".repeat(3-Math.min(3,best));
    output.setAttribute("aria-label",best+" de tres estrellas logradas en este tema");
  });
}
function bestMechanicStars(topicId,mechanic){
  const records=topicId==="diagramas-flujo"
    ?Object.values(labProgress.exercises)
    :Object.values(labProgress.topics?.[topicId]?.concepts??{});
  return Math.min(3,Math.max(0,...records.map(item=>Number(item?.[mechanic]?.stars)||0)));
}
function renderLabTopicHome(){
  const host=$("#lab-topic-home");if(!host)return;
  host.innerHTML=competenciasAprende.map(competence=>{
    const owned=temas.filter(theme=>theme.competenciaId===competence.id);
    const cards=owned.map(theme=>{
      const mechanics=theme.laboratorio?.mecanicas??[],available=mechanics.length>0;
      const earned=mechanics.reduce((sum,id)=>sum+bestMechanicStars(theme.id,id),0),possible=mechanics.length*3;
      return '<button type="button" class="theme-card lab-theme-card'+(available?'':' is-coming')+'" data-lab-topic="'+theme.id+'" '+(available?'':'disabled aria-disabled="true"')+' style="--comp-color:var(--competence-'+(competence.token??'1')+'-solid)" aria-label="'+esc(theme.titulo+', '+(available?mechanics.length+' retos, '+earned+' de '+possible+' estrellas':'próximamente'))+'"><span class="theme-icon" aria-hidden="true">'+esc(theme.icono)+'</span><strong>'+esc(theme.titulo)+'</strong><small>'+esc(competence.titulo)+'</small><span class="exercise-theme-count">'+(available?mechanics.length+' retos':'Próximamente')+'</span><span class="exercise-theme-progress"'+(available?' role="progressbar" aria-valuemin="0" aria-valuemax="'+possible+'" aria-valuenow="'+earned+'" aria-label="'+earned+' de '+possible+' estrellas"':'')+'>'+(available?earned+' / '+possible+' estrellas':'')+'</span></button>';
    }).join("");
    return '<section class="exercise-competence-section lab-competence-section" aria-labelledby="lab-competence-'+esc(competence.id)+'"><header>'+competenceMarker(competence.id)+'<h3 id="lab-competence-'+esc(competence.id)+'">'+esc(competence.titulo)+'</h3><span>'+owned.length+' temas</span></header><div class="theme-grid">'+(cards||'<p class="exercise-themes-coming">Próximamente</p>')+'</div></section>';
  }).join("");
}
function setLabCatalogControls(visible){
  const hidden=!visible;
  const heading=$("#lab-topic-heading"),filters=$(".lab-catalog-filters"),cards=$("#lab-mode-cards"),empty=$("#lab-filter-empty"),footnote=$(".lab-mode-footnote");
  if(heading)heading.hidden=hidden;if(filters)filters.hidden=hidden;if(cards)cards.hidden=hidden;if(empty)empty.hidden=hidden;if(footnote)footnote.hidden=hidden;
}
function openLabTopic(topicId){
  const theme=temas.find(item=>item.id===topicId);if(!theme)return;
  activeLabTopic=topicId;
  const competence=competenciasAprende.find(item=>item.id===theme.competenciaId);
  $("#lab-topic-home").hidden=true;$("#lab-topic-heading").hidden=false;
  $("#lab-topic-competence").textContent=competence?.titulo??"Laboratorio";$("#lab-topic-title").textContent=theme.titulo;
  setLabCatalogControls(true);renderCatalogFilters(topicId);
}
function renderCatalogFilters(){
  let themeId=activeLabTopic??"diagramas-flujo";
  if(!activeLabTopic)try{themeId=JSON.parse(localStorage.getItem("traza:v2:learn")||"{}").theme||themeId;}catch{}
  const theme=temas.find(item=>item.id===themeId)??temas[0];
  const competence=competenciasAprende.find(item=>item.id===theme.competenciaId);
  $("#lab-mode-cards")?.style.setProperty("--lab-topic-accent","var(--competence-"+(competence?.token??"evaluar-requisitos")+"-solid)");
  if(themeId==="fuentes-informacion"){renderSourceLabCatalog(themeId);return;}
  if(MATH_LAB[themeId]){renderMathLabCatalog(themeId);return;}
  $("#view-lab")?.classList.remove("lab-math-catalog");
  $("#view-lab")?.classList.remove("lab-source-catalog");
  $(".lab-catalog-filters")?.removeAttribute("hidden");
  const catalog=$("#lab-mode-cards");
  if(originalLabCatalogMarkup!==null&&catalog&&!catalog.querySelector("[data-lab-activity]"))catalog.innerHTML=originalLabCatalogMarkup;
  $(".lab-catalog-filters")?.classList.remove("is-math-filters");
  $("#lab-start-mixed")?.removeAttribute("hidden");
  const footnote=$(".lab-mode-footnote");if(footnote)footnote.innerHTML='<span aria-hidden="true">⌁</span> Los retos usan la ejecución del Simulador para mantener sincronizados el diagrama, la escena y las variables.';
  const available=conceptos.filter(item=>theme?.conceptos.includes(item.id));
  const conceptGroup=$("#lab-filter-concepts")?.closest(".lab-filter-group");if(conceptGroup)conceptGroup.hidden=false;
  $("#lab-filter-concepts").innerHTML='<button type="button" data-lab-filter-concept="todos" aria-pressed="'+String(catalogConcept==="todos")+'">Todos</button>'+available.map(item=>'<button type="button" data-lab-filter-concept="'+item.id+'" aria-pressed="'+String(catalogConcept===item.id)+'">'+esc(item.titulo)+'</button>').join("");
  $("#lab-filter-difficulty").innerHTML=[1,2,3,4].map(level=>'<button type="button" data-lab-filter-level="'+level+'" aria-pressed="'+String(catalogDifficulties.has(level))+'">'+difficultyLabels[level-1]+'</button>').join("");
  applyCatalogFilters();
}
function renderSourceLabCatalog(topic){
  const view=$("#view-lab"),cards=$("#lab-mode-cards");if(!view||!cards)return;
  view.classList.add("lab-source-catalog");view.classList.remove("lab-math-catalog");
  const families=["Observa","Construye","Investiga"],symbols={Observa:"◉",Construye:"◇",Investiga:"⌕"};
  cards.innerHTML=families.map(family=>{const items=sourceLabMechanics.filter(id=>sourceLabMeta[id].family===family);if(!items.length)return "";return '<section class="lab-family-band"><header class="lab-family-heading"><span class="lab-family-symbol" aria-hidden="true">'+symbols[family]+'</span><div><h3>'+family+'</h3><p>'+({Observa:"Mira y clasifica",Construye:"Organiza evidencia",Investiga:"Busca y contrasta"}[family])+'</p></div></header><div class="lab-mechanics-grid">'+items.map(id=>{const item=sourceLabMeta[id],stars=labProgress.topics?.[topic]?.concepts?.recoleccion?.[id]?.stars??0;return '<button type="button" class="lab-mode-card" data-lab-source-mechanic="'+id+'"><span class="lab-mechanic-art" aria-hidden="true"><b>'+item.icon+'</b><i></i></span><strong>'+item.label+'</strong><small>'+item.description+'</small><span class="lab-mechanic-meta"><span>1 a 3 min</span><span aria-label="'+stars+' de tres estrellas">'+'★'.repeat(stars)+'☆'.repeat(3-stars)+'</span></span></button>';}).join("")+'</div></section>';}).join("");
  $(".lab-catalog-filters")?.setAttribute("hidden","");$("#lab-start-mixed")?.setAttribute("hidden","");$("#lab-filter-empty")?.setAttribute("hidden","");
  const footnote=$(".lab-mode-footnote");if(footnote)footnote.textContent="Cada reto conecta la procedencia, la técnica de recolección y el alcance de la evidencia.";
}
const mathLabTitles={enteros:"Números enteros",racionales:"Números racionales","regla-de-tres":"Regla de tres"};
const mathLabDescriptions={
  order:"Organiza los pasos de una resolución exacta.","fill-gap":"Completa el resultado que falta.",error:"Detecta un error de signo, jerarquía o fracción.",whatif:"Cambia un dato y anticipa el resultado.",predict:"Resuelve un reto generado y comprobado.","number-line":"Lleva la ficha a la marca correcta.",match:"Relaciona expresiones, fracciones o proporciones.","fraction-bar":"Representa una fracción con partes iguales."
};
function renderMathLabCatalog(topic){
  const view=$("#view-lab");if(!view)return;
  view.classList.add("lab-math-catalog");
  view.classList.remove("lab-source-catalog");$(".lab-catalog-filters")?.removeAttribute("hidden");
  const cards=$("#lab-mode-cards");if(!cards)return;
  const data=mathLabCatalog(topic,labProgress);
  const families=["Observa","Construye","Investiga"];
  const symbols={Observa:"◉",Construye:"◇",Investiga:"⌕"};
  cards.innerHTML=families.map(family=>{
    const items=data.filter(item=>item.family===family);if(!items.length)return "";
    return '<section class="lab-family-band"><header class="lab-family-heading"><span class="lab-family-symbol" aria-hidden="true">'+symbols[family]+'</span><div><h3>'+family+'</h3><p>'+({Observa:"Mira y anticipa",Construye:"Arma y completa",Investiga:"Busca y pregunta"}[family])+'</p></div></header><div class="lab-mechanics-grid">'+items.map(item=>'<button type="button" class="lab-mode-card" data-lab-math-mechanic="'+item.id+'"><span class="lab-mechanic-art" aria-hidden="true"><b>'+({order:"↕","fill-gap":"＿",error:"⌕",whatif:"¿…?",predict:"?","number-line":"↔",match:"⇄","fraction-bar":"▤"}[item.id])+'</b><i></i></span><strong>'+item.label+'</strong><small>'+mathLabDescriptions[item.id]+'</small><span class="lab-mechanic-meta"><span>1 a 3 min</span><span aria-label="'+item.stars+' de tres estrellas">'+'★'.repeat(item.stars)+'☆'.repeat(3-item.stars)+'</span></span></button>').join("")+'</div></section>';
  }).join("");
  const conceptChoicesByTopic={enteros:[["signos","Signos"],["jerarquia","Jerarquía"],["recta","Recta numérica"]],racionales:[["equivalencia","Equivalencia"],["operaciones","Operaciones"],["representacion","Representación"]],"regla-de-tres":[["directa","Proporción directa"],["inversa","Proporción inversa"],["verificacion","Verificación"]]};
  const conceptMechanics={signos:["order","whatif","predict"],jerarquia:["order","fill-gap","error","predict"],recta:["number-line"],equivalencia:["match","fraction-bar","predict"],operaciones:["order","fill-gap","error"],representacion:["fraction-bar","match"],directa:["match","fill-gap","predict"],inversa:["match","whatif","predict"],verificacion:["order","error","whatif"]};
  const concepts=conceptChoicesByTopic[topic]??[];
  const conceptGroup=$("#lab-filter-concepts")?.closest(".lab-filter-group");if(conceptGroup)conceptGroup.hidden=concepts.length<4;
  if(catalogConcept!=="todos"&&!concepts.some(([id])=>id===catalogConcept))catalogConcept="todos";
  $("#lab-filter-concepts").innerHTML='<button type="button" data-lab-filter-concept="todos" aria-pressed="'+String(catalogConcept==="todos")+'">Todos</button>'+concepts.map(([id,label])=>'<button type="button" data-lab-filter-concept="'+id+'" aria-pressed="'+String(catalogConcept===id)+'">'+label+'</button>').join("");
  $("#lab-filter-difficulty").innerHTML=[1,2,3,4].map(level=>'<button type="button" data-lab-filter-level="'+level+'" aria-pressed="'+String(catalogDifficulties.has(level))+'">'+difficultyLabels[level-1]+'</button>').join("");
  cards.querySelectorAll("[data-lab-math-mechanic]").forEach(card=>{
    const family=card.closest(".lab-family-band");
    card.hidden=catalogConcept!=="todos"&&!(conceptMechanics[catalogConcept]??[]).includes(card.dataset.labMathMechanic);
    if(family)family.hidden=!family.querySelector("[data-lab-math-mechanic]:not([hidden])");
  });
  if($("#lab-filter-clear"))$("#lab-filter-clear").hidden=catalogConcept==="todos"&&!catalogDifficulties.size;
  $("#lab-start-mixed")?.setAttribute("hidden","");
  const filters=$(".lab-catalog-filters");filters?.classList.add("is-math-filters");
  $("#lab-filter-concepts")?.closest(".lab-catalog-filters")?.classList.add("is-math-filters");
  $("#lab-filter-empty")?.setAttribute("hidden","");
  const footnote=$(".lab-mode-footnote");if(footnote)footnote.textContent="Cada reto se genera con una semilla estable y se verifica con el motor matemático exacto.";
}
function applyCatalogFilters(){
  let visible=0;
  $("#lab-mode-cards")?.querySelectorAll("[data-lab-activity]").forEach(card=>{
    const id=card.dataset.labActivity;
    const matchesConcept=catalogConcept==="todos"||(activityConceptMap[id]??[]).includes(catalogConcept);
    const matchesDifficulty=!catalogDifficulties.size||(activityLevels[id]??[]).some(level=>catalogDifficulties.has(level));
    card.hidden=!(matchesConcept&&matchesDifficulty);if(!card.hidden)visible++;
  });
  $("#lab-mode-cards")?.querySelectorAll(".lab-family-band").forEach(family=>family.hidden=!family.querySelector("[data-lab-activity]:not([hidden])"));
  if($("#lab-filter-empty"))$("#lab-filter-empty").hidden=visible>0;
  if($("#lab-filter-clear"))$("#lab-filter-clear").hidden=catalogConcept==="todos"&&!catalogDifficulties.size;
}
function clearCatalogFilters(){
  catalogConcept="todos";catalogDifficulties.clear();renderCatalogFilters();
}
function recordResult(mode,correct,hints=null){
  const exerciseId=trace?.exercise?.id;
  if(!exerciseId)return;
  if(!correct)activityErrors++;
  else hints=hints===null?Math.min(2,activityErrors):hints;
  if(mixedActive)mixedCurrent=Boolean(correct);
  activityStreak=correct?activityStreak+1:0;
  const topicId=currentTopicId();
  const previousMedals=new Set(conceptMedals(labProgress,topicId));
  labProgress=recordLabResult(labProgress,{exerciseId,mode,correct,hints,topicId,conceptId:selectedConcept,streak:activityStreak});
  saveLabProgress();
  updateProgressBadges();
  if(correct&&!previousMedals.has(selectedConcept)&&conceptMedals(labProgress,topicId).includes(selectedConcept)){
    const announcement=$("#lab-medal-announcement");
    if(announcement){announcement.hidden=false;announcement.textContent="🏅 Medalla de concepto: "+(conceptLabels[selectedConcept]??selectedConcept)+" · tres mecánicas dominadas."}
  }
  if(correct)document.dispatchEvent(new CustomEvent("traza:actividad-laboratorio"));
}
function mixedAdvanceMarkup(){
  return mixedActive
    ? '<button type="button" class="button button-secondary" id="lab-next-mixed">'+(mixedQueue.length?"Siguiente reto":"Ver resultado")+'</button>'
    : "";
}
function bindMixedAdvance(){
  $("#lab-next-mixed")?.addEventListener("click",nextMixed);
}
function nextMixed(){
  if(mixedCurrent!==null)mixedResults.push(mixedCurrent);
  mixedCurrent=null;
  const next=mixedQueue.shift();
  if(!next){
    mixedActive=false;
    $("#lab-task-title").textContent="Práctica mixta completada";
    const correct=mixedResults.filter(Boolean).length;
    const stars=correct===5?3:correct>=3?2:1;
    $("#lab-task-content").innerHTML='<section class="lab-session-finish"><p class="eyebrow">PARTIDA COMPLETADA</p><h4>Buen trabajo: terminaste los cinco retos.</h4><div class="lab-finish-stars" aria-label="'+stars+' estrellas">'+[1,2,3].map((value,index)=>'<span class="'+(value<=stars?"is-earned":"")+'" style="--star-delay:'+index*120+'ms">★</span>').join("")+'</div><p>'+correct+' de 5 retos resueltos correctamente.</p><div class="lab-task-actions"><button type="button" class="button button-primary" id="lab-mixed-replay">Repetir</button><button type="button" class="button button-secondary" id="lab-mixed-another">Otra mecánica</button><button type="button" class="button button-secondary" id="lab-mixed-return">Volver</button></div></section>';
    $("#lab-mixed-replay")?.addEventListener("click",startMixedPractice);
    $("#lab-mixed-another")?.addEventListener("click",returnToLabModes);
    $("#lab-mixed-return")?.addEventListener("click",()=>document.querySelector('#primary-nav [data-space="simulator"]')?.click());
    return;
  }
  labAttempt++;
  setActivity(next,{keepMixed:true});
}
function startMixedPractice(){
  if(!requireTrace())return;
  mixedResults=[];mixedCurrent=null;mixedActive=true;
  const pool=["predict","order","symbol","error","fill-gap","follow-arrow","table","match"];
  mixedQueue=mixedModeOrder(trace.exercise.id,labAttempt,pool).slice(0,5);
  nextMixed();
}
function addLabActivity(id,title,description,icon){
  const list=$("#lab-activity-list");
  if(!list||list.querySelector('[data-lab-activity="'+id+'"]'))return;
  const button=document.createElement("button");
  button.type="button";
  button.className="activity-card";
  button.dataset.labActivity=id;
  button.innerHTML='<span class="activity-icon" aria-hidden="true">'+icon+'</span><span><strong></strong><small></small></span><span class="activity-arrow" aria-hidden="true">›</span>';
  button.querySelector("strong").textContent=title;
  button.querySelector("small").textContent=description;
  list.append(button);
}
function addMixedPracticeButton(){
  const view=$("#view-lab");
  const layout=view?.querySelector(".lab-layout");
  if(!layout||$("#lab-start-mixed"))return;
  const actions=document.createElement("div");
  actions.className="lab-practice-actions";
  const button=document.createElement("button");
  button.type="button";
  button.className="button button-primary";
  button.id="lab-start-mixed";
  button.textContent="Empezar práctica mixta · 5 retos";
  button.addEventListener("click",startMixedPractice);
  actions.append(button);
  layout.before(actions);
}
const symbolMap={
  input:{name:"Entrada de datos",options:["Paralelogramo","Rectángulo","Rombo"],correct:"Paralelogramo",why:"Leer recibe datos del exterior; se representa con un paralelogramo."},
  assignment:{name:"Proceso / asignación",options:["Rectángulo","Óvalo","Rombo"],correct:"Rectángulo",why:"Una asignación transforma o actualiza un valor; corresponde al símbolo de proceso."},
  output:{name:"Salida de datos",options:["Rombo","Documento / salida","Hexágono"],correct:"Documento / salida",why:"Imp comunica un dato o resultado; en este material la salida se diferencia del proceso."},
  if:{name:"Decisión Si",options:["Rombo","Rectángulo","Paralelogramo"],correct:"Rombo",why:"Una condición conduce por rutas alternativas, normalmente Verdadera (V) y Falsa (F)."},
  while:{name:"Ciclo Mientras",options:["Rombo de decisión","Documento","Óvalo"],correct:"Rombo de decisión",why:"Mientras evalúa una condición antes de ejecutar el cuerpo."},
  doWhile:{name:"Ciclo Hacer–Mientras",options:["Rombo de decisión","Paralelogramo","Rectángulo"],correct:"Rombo de decisión",why:"La condición de repetición se evalúa al final del cuerpo."},
  for:{name:"Ciclo Para",options:["Hexágono / ciclo definido","Óvalo","Documento"],correct:"Hexágono / ciclo definido",why:"La forma didáctica del Para concentra preparación, condición y avance; el flujo de ejecución sigue teniendo un cuerpo y un retorno."}
};
const errorScenarios=[
  {title:"Máximo inicializado en cero",statement:"El algoritmo busca el mayor de dos números. ¿Funciona si los dos son negativos?",source:"M=0|para i=1;i<=2;i++|leer n|si n>M|M=n|fin|fin|imp M",inputs:[-4,-2],expected:-2,faultyLine:0,explanation:"El máximo debe empezar con un dato real. Un cero inventado puede ser mayor que todos los valores negativos.",fixes:[
    {label:"Leer el primer dato y usarlo como máximo",source:"leer M|para i=2;i<=2;i++|leer n|si n>M|M=n|fin|fin|imp M"},
    {label:"Mantener M=0",source:"M=0|para i=1;i<=2;i++|leer n|si n>M|M=n|fin|fin|imp M"},
    {label:"Inicializar M=1",source:"M=1|para i=1;i<=2;i++|leer n|si n>M|M=n|fin|fin|imp M"}
  ]},
  {title:"Factorial inicializado en cero",statement:"El algoritmo multiplica de 1 a N. ¿Obtiene el factorial para N = 5?",source:"F=0|para i=1;i<=5;i++|F=F*i|fin|imp F",inputs:[],expected:120,faultyLine:0,explanation:"El acumulador de producto comienza en 1, que es el elemento neutro de la multiplicación. Con cero, el resultado siempre será cero.",fixes:[
    {label:"Inicializar F en 1",source:"F=1|para i=1;i<=5;i++|F=F*i|fin|imp F"},
    {label:"Inicializar F en 5",source:"F=5|para i=1;i<=5;i++|F=F*i|fin|imp F"},
    {label:"Mantener F en 0",source:"F=0|para i=1;i<=5;i++|F=F*i|fin|imp F"}
  ]},
  {title:"Centinela contado como dato",statement:"El algoritmo cuenta datos hasta recibir cero. ¿Debe contar también el cero que detiene la lectura?",source:"C=0|hacer|leer n|C=C+1|hm n<>0|imp C",inputs:[4,5,0],expected:2,faultyLine:3,explanation:"El cero es la señal de parada, no un dato de la serie. El contador solo aumenta cuando el valor leído es distinto de cero.",fixes:[
    {label:"Aumentar C solo si n es distinto de 0",source:"C=0|hacer|leer n|si n<>0|C=C+1|fin|hm n<>0|imp C"},
    {label:"Incrementar C antes de leer n",source:"C=0|hacer|C=C+1|leer n|hm n<>0|imp C"},
    {label:"Mantener el incremento fuera de la condición",source:"C=0|hacer|leer n|C=C+1|hm n<>0|imp C"}
  ]},
  {title:"Promedio correcto con centinela",statement:"¿Este algoritmo calcula el promedio de los datos anteriores al cero y evita dividir entre cero cuando no hay entradas?",source:"S=0|C=0|leer n|mientras n<>0|S=S+n|C=C+1|leer n|fin|si C>0|imp S/C|sino|imp 0|fin",inputs:[2,4,0],expected:3,faultyLine:-1,explanation:"El algoritmo excluye el centinela, cuenta los datos procesados y solo divide cuando hay al menos un dato. No necesita corrección.",fixes:[
    {label:"No modificar: el algoritmo ya es correcto",source:"S=0|C=0|leer n|mientras n<>0|S=S+n|C=C+1|leer n|fin|si C>0|imp S/C|sino|imp 0|fin"},
    {label:"Dividir siempre entre C, incluso si C es 0",source:"S=0|C=0|leer n|mientras n<>0|S=S+n|C=C+1|leer n|fin|imp S/C"}
  ]}
];
function publishContext(detail){
  if(!detail?.execution?.events?.length)return;
  trace=detail;
  updateLabContext();
  if(mathLabActive)return;
  if(["predict","table","follow-arrow"].includes(activity))renderActivity();
  updateProgressBadges();
}
function updateLabContext(){
  if(!trace)return;
  const {execution,event,index,exercise}=trace;
  const visited=execution.events.slice(0,index+1);
  const seen=[...new Set(visited.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined))];
  const diagram=trace.diagram;
  if(diagram){
    const target=$("#lab-diagram-container");
    const sourceSvg=document.querySelector("#flow-svg");
    if(sourceSvg){
      target.innerHTML=sourceSvg.outerHTML.replaceAll("flow-arrow","lab-flow-arrow").replaceAll('id="flow-token"','id="lab-flow-token"');
      const svg=target.querySelector("svg");
      if(svg){svg.removeAttribute("id");svg.style.width="100%";svg.style.minWidth="0";svg.style.maxWidth="none";}
      target.querySelectorAll(".diagram-node").forEach(node=>{
        const sourceId=node.id.replace("flow-node-","");
        const model=diagram.byId.get(sourceId);
        node.classList.toggle("is-active",Boolean(model&&event.nodeId!==null&&String(model.sourceId)===String(event.nodeId)));
        node.classList.toggle("is-visited",Boolean(model&&model.sourceId!==null&&seen.includes(model.sourceId)));
      });
    }
  }
  const scene=event.scene??{title:"Paso",body:event.message??"",technical:""};
  $("#lab-scene-content").innerHTML="<strong>"+esc(scene.title)+"</strong><p>"+esc(scene.body)+"</p>";
  const vars=event.variables??{};
  const keys=Object.keys(vars);
  $("#lab-variables-content").innerHTML=keys.length?
    '<table class="variables-table"><tbody>'+keys.map(key=>"<tr><th>"+esc(key)+"</th><td>"+esc(fmt(vars[key]))+"</td></tr>").join("")+"</tbody></table>":
    '<span class="empty-state-copy">Sin variables todavía.</span>';
  $("#lab-context-title").textContent=(exercise?.title??"Diagrama de flujo")+" · En ejecución";
  $("#lab-current-step").innerHTML="PASO <b>"+(index+1)+" / "+execution.events.length+"</b>";
  $("#lab-current-exercise").innerHTML="EJERCICIO <b>"+(exercise?.id??"—")+"</b>";
}
let labMode="read";
const labActivities={
  read:[
    ["predict","Predice el paso","Anticipa qué hará la ficha antes de revelar el evento real","?"],
    ["table","Tabla de seguimiento","Lee los valores, las vueltas y los cambios de cada variable","▦"],
    ["follow-arrow","Sigue la flecha","Elige la figura siguiente y descubre por qué esa ruta es correcta","➜"]
  ],
  build:[
    ["order","Ordena instrucciones","Organiza las líneas para reconstruir el algoritmo","↕"],
    ["symbol","Elige la figura","Relaciona cada instrucción con el símbolo que la representa","◇"],
    ["fill-gap","Completa el hueco","Escribe la instrucción que falta y comprueba la ejecución","▤"],
    ["match","Empareja","Une conceptos del diagrama con su símbolo","⇄"]
  ],
  debug:[
    ["error","Encuentra el error","Detecta una inicialización o condición que rompe el algoritmo","!"],
    ["whatif","Compara dos recorridos","Cambia una instrucción y observa cómo se separan los resultados","↗"]
  ]
};
function renderLabActivityMenu(){
  const list=$("#lab-activity-list");if(!list)return;
  list.innerHTML=(labActivities[labMode]??[]).map(([id,title,description,icon])=>
    '<button type="button" class="activity-card '+(activity===id?"is-active":"")+'" data-lab-activity="'+id+'"><span class="activity-icon" aria-hidden="true">'+icon+'</span><span><strong>'+title+'</strong><small>'+description+'</small></span><span class="activity-arrow" aria-hidden="true">›</span></button>'
  ).join("");
  list.querySelectorAll("[data-lab-activity]").forEach(button=>{
    const stars=modeStars(labProgress,trace?.exercise?.id,button.dataset.labActivity);
    const progress=document.createElement("span");progress.className="activity-progress";
    progress.textContent="★".repeat(stars)+"☆".repeat(3-stars);progress.setAttribute("aria-label",stars+" de tres estrellas");
    button.append(progress);
  });
  $("#lab-open-builder")?.toggleAttribute("hidden",labMode!=="build");
  const labels={
    read:["01 · LEER","Sigue la ficha","Aprende a seguir cada flecha, anticipar decisiones y registrar cambios."],
    build:["02 · ESCRIBIR","Arma el diagrama","Ordena instrucciones, elige símbolos y completa el flujo."],
    debug:["03 · DEPURAR","Caza el error","Encuentra el paso que falla y compara las consecuencias."]
  };
  const [kicker,title,description]=labels[labMode]??labels.read;
  if($("#lab-mode-kicker"))$("#lab-mode-kicker").textContent=kicker;
  if($("#lab-mode-title"))$("#lab-mode-title").textContent=title;
  if($("#lab-mode-description"))$("#lab-mode-description").textContent=description;
  const activityHeading=$("#lab-activity-heading");
  if(activityHeading)activityHeading.textContent=labMode==="read"?"Lee y comprende":labMode==="build"?"Construye paso a paso":"Revisa y corrige";
}
function showLabMode(mode,preferredActivity=null){
  setLabCatalogControls(false);
  labMode=["read","build","debug"].includes(mode)?mode:"read";
  $("#lab-mode-cards")?.querySelectorAll("[data-lab-mode]").forEach(button=>{
    const active=button.dataset.labMode===labMode;
    button.classList.toggle("is-active",active);button.setAttribute("aria-pressed",String(active));
  });
  if($("#lab-mode-cards"))$("#lab-mode-cards").hidden=true;
  if($("#lab-practice-workspace"))$("#lab-practice-workspace").hidden=false;
  if($("#lab-task-panel"))$("#lab-task-panel").hidden=false;
  if($("#lab-builder-stage"))$("#lab-builder-stage").hidden=true;
  renderLabActivityMenu();
  const first=labActivities[labMode]?.[0];
  if(first)setActivity(preferredActivity&&preferredActivity!=="build-diagram"?preferredActivity:first[0]);
  else $("#lab-task-content").innerHTML="<p>Selecciona una actividad para comenzar.</p>";
  if(preferredActivity==="build-diagram")requestAnimationFrame(()=>$("#lab-open-builder")?.click());
}
function conceptChoices(activityId){
  const raw=trace?.exercise?.concepts??[];
  const ids=new Set();
  for(const value of raw){
    const text=String(value).toLocaleLowerCase("es");
    if(/entrada|leer/.test(text))ids.add("entrada");
    if(/variable/.test(text))ids.add("variables");
    if(/asignaci|proceso/.test(text))ids.add("asignacion");
    if(/operaci|suma|resta|multiplic|divisi|aritm|paréntesis|exponente/.test(text))ids.add("operaciones");
    if(/comparaci|relacional|mayor|menor|igual/.test(text))ids.add("comparaciones");
    if(/decisi|si\/sino|condici/.test(text))ids.add("decisiones");
    if(/contador/.test(text))ids.add("contadores");
    if(/acumulador|sumatoria/.test(text))ids.add("acumuladores");
    if(/ciclo para|para/.test(text))ids.add("ciclo-para");
    if(/mientras/.test(text))ids.add(/hacer/.test(text)?"ciclo-hacer-mientras":"ciclo-mientras");
    if(/figura|símbolo/.test(text))ids.add("figuras");
    if(/flujo|secuencia/.test(text))ids.add("flujo");
    if(/salida|imprimir/.test(text))ids.add("salida");
  }
  const preferred={match:["figuras"],symbol:["figuras"],table:["traza"],error:["depuracion"],order:["flujo"],"follow-arrow":["flujo"],"build-diagram":["figuras","flujo"],"fill-gap":["variables","asignacion","operaciones"],predict:["programa"],whatif:["programa"]}[activityId]??["programa"];
  if(preferred[0]!=="programa"){ids.clear();for(const id of preferred)ids.add(id);}
  else ids.add("programa");
  if(!ids.size)ids.add("programa");
  return [...ids].map(id=>({id,label:conceptLabels[id]}));
}
function suggestedDifficulty(mode,conceptId){
  const attempts=labProgress.topics?.["diagramas-flujo"]?.concepts?.[conceptId]??{};
  const stars=Object.values(attempts).map(item=>Number(item?.stars)||0);
  const mastered=stars.length?Math.min(3,Math.max(...stars)):0;
  const exerciseLevel=({basic:1,intermediate:2,advanced:3,expert:4})[trace?.exercise?.level]??1;
  return Math.max(1,Math.min(4,Math.max(exerciseLevel,mastered+1)));
}
function openPrepareDialog(activityId){
  pendingActivity=activityId;
  const options=conceptChoices(activityId);
  const remembered=labProgress.topics?.[currentTopicId()]?.lastConcept;
  selectedConcept=options.some(item=>item.id===catalogConcept)?catalogConcept:options.some(item=>item.id===remembered)?remembered:options[0]?.id??"programa";
  selectedDifficulty=catalogDifficulties.size===1?[...catalogDifficulties][0]:suggestedDifficulty(activityId,selectedConcept);
  $("#lab-prepare-concepts").innerHTML=options.map(item=>'<button type="button" data-prepare-concept="'+item.id+'" aria-pressed="'+String(item.id===selectedConcept)+'">'+esc(item.label)+'</button>').join("");
  $("#lab-prepare-levels").innerHTML=["Inicial","En práctica","Desafío","Experto"].map((label,index)=>'<button type="button" data-prepare-level="'+(index+1)+'" aria-pressed="'+String(index+1===selectedDifficulty)+'">'+label+'</button>').join("");
  $("#lab-prepare-title").textContent="Prepara: "+({predict:"Predice","follow-arrow":"Sigue la flecha",table:"Tabla de seguimiento",order:"Ordena","fill-gap":"Completa el hueco","build-diagram":"Arma el diagrama",symbol:"Identifica el símbolo",match:"Empareja",error:"Encuentra el error",whatif:"¿Y si…?"}[activityId]??"tu partida");
  const dialog=$("#lab-prepare-dialog");if(dialog&&!dialog.open)dialog.showModal();
}
function seededAttempt(){
  let seed=2166136261;
  for(const char of selectedConcept+":"+selectedDifficulty)seed=Math.imul(seed^char.charCodeAt(0),16777619);
  return (labAttempt+((seed>>>0)%1000000))>>>0;
}
function openSelectedActivity(){
  if(!pendingActivity)return;
  const chosen=pendingActivity;pendingActivity=null;
  const topicId=currentTopicId();
  labProgress.topics[topicId]??={concepts:{}};
  labProgress.topics[topicId].lastConcept=selectedConcept;
  saveLabProgress();
  showLabMode(({predict:"read","follow-arrow":"read",table:"read",order:"build","fill-gap":"build","build-diagram":"build",symbol:"build",match:"build",error:"debug",whatif:"debug"}[chosen]??"read"),chosen);
  requestAnimationFrame(()=>$(chosen==="build-diagram"?"#lab-builder-title":"#lab-task-title")?.focus());
}
function returnToLabModes(){
  setLabCatalogControls(true);
  if(sourceLabActive){sourceLabActive=false;$("#view-lab")?.classList.remove("lab-source-playing");$("#lab-mode-cards")?.removeAttribute("hidden");$("#lab-practice-workspace")?.setAttribute("hidden","");$(".lab-practice-heading")?.removeAttribute("hidden");$(".lab-layout")?.removeAttribute("hidden");$("#lab-task-panel")?.setAttribute("hidden","");renderCatalogFilters();return;}
  if(mathLabActive){
    mathLabActive=false;
    $("#view-lab")?.classList.remove("lab-math-playing");
    $("#lab-mode-cards")?.removeAttribute("hidden");
    $("#lab-practice-workspace")?.setAttribute("hidden","");
    $(".lab-practice-heading")?.removeAttribute("hidden");
    $(".lab-layout")?.removeAttribute("hidden");
    $("#lab-task-panel")?.setAttribute("hidden","");
    $("#lab-start-mixed")?.removeAttribute("hidden");
    renderCatalogFilters();
    return;
  }
  mixedActive=false;mixedQueue=[];mixedCurrent=null;
  if($("#lab-builder-stage"))$("#lab-builder-stage").hidden=true;
  if($("#lab-practice-workspace"))$("#lab-practice-workspace").hidden=true;
  if($("#lab-mode-cards"))$("#lab-mode-cards").hidden=false;
}
function sourceLabFeedback(message,correct){const status=$("#source-lab-feedback");if(!status)return;status.hidden=false;status.className="math-lab-feedback "+(correct?"is-correct":"is-incorrect");status.textContent=message;}
function renderSourceLabRound(){
  const challenge=sourceLabChallenge;if(!challenge)return;sourceLabAnswered=false;
  const title=$("#lab-task-title"),content=$("#lab-task-content");if(title)title.textContent=challenge.mechanicLabel;if(!content)return;
  const interaction=challenge.kind==="order"?'<ol class="math-lab-order-list" id="source-lab-order">'+challenge.items.map(item=>'<li data-order-id="'+esc(item.id)+'"><span>'+esc(item.label)+'</span><span class="math-lab-order-actions"><button type="button" data-source-order-move="up" aria-label="Subir paso">↑</button><button type="button" data-source-order-move="down" aria-label="Bajar paso">↓</button></span></li>').join("")+'</ol><button type="button" class="button button-primary" data-source-order-check>Comprobar orden</button>':(challenge.mechanic==="classify"?'<article class="source-lab-drag-card" draggable="true" data-source-drag-card><span aria-hidden="true">▤</span><strong>'+esc(challenge.sourceTitle)+'</strong><small>Arrastra a una categoría o selecciónala con los botones.</small></article>':'')+'<div class="math-lab-options"'+(challenge.mechanic==="classify"?' role="group" aria-label="Categorías de fuentes"':'')+'>'+challenge.options.map(option=>'<button type="button" class="math-lab-option" data-source-correct="'+option.correct+'"'+(challenge.mechanic==="classify"?' data-source-bin="'+({Primaria:"P",Secundaria:"S",Terciaria:"T"})[option.label]+'"':'')+'>'+esc(option.label)+'</button>').join("")+'</div>';
  content.innerHTML='<section class="math-lab-session"><header class="math-lab-session-head"><button type="button" class="text-link" data-source-lab-back>← Volver a mecánicas</button><span>Reto '+(sourceLabRound+1)+' de 5 · '+sourceLabScore+' correctos</span><button type="button" class="text-link" data-source-lab-hint>Pista</button></header><div class="math-lab-prompt"><p class="eyebrow">'+esc(challenge.mechanicLabel.toLocaleUpperCase("es"))+'</p><h4>'+esc(challenge.question)+'</h4></div>'+interaction+'<p id="source-lab-feedback" class="math-lab-feedback" role="status" hidden></p><button type="button" class="button button-secondary math-lab-next" data-source-lab-next hidden>Siguiente reto</button></section>';
  content.querySelector("[data-source-lab-back]")?.addEventListener("click",returnToLabModes);
  content.querySelector("[data-source-lab-hint]")?.addEventListener("click",()=>{sourceLabHints++;sourceLabFeedback("Pista: "+challenge.hint,false);});
  content.querySelectorAll("[data-source-correct]").forEach(button=>button.addEventListener("click",()=>answerSourceLab(button.dataset.sourceCorrect==="true")));
  const dragCard=content.querySelector("[data-source-drag-card]");dragCard?.addEventListener("dragstart",event=>event.dataTransfer?.setData("text/plain",challenge.sourceType));
  content.querySelectorAll("[data-source-bin]").forEach(bin=>{bin.addEventListener("dragover",event=>event.preventDefault());bin.addEventListener("drop",event=>{event.preventDefault();answerSourceLab(event.dataTransfer?.getData("text/plain")===bin.dataset.sourceBin);});});
  content.querySelectorAll("[data-source-order-move]").forEach(button=>button.addEventListener("click",()=>{const item=button.closest("li"),list=item.parentElement;if(button.dataset.sourceOrderMove==="up"&&item.previousElementSibling)list.insertBefore(item,item.previousElementSibling);if(button.dataset.sourceOrderMove==="down"&&item.nextElementSibling)list.insertBefore(item.nextElementSibling,item);}));
  content.querySelector("[data-source-order-check]")?.addEventListener("click",()=>answerSourceLab([...content.querySelectorAll("[data-order-id]")].every((item,index)=>item.dataset.orderId===challenge.answer[index])));
  content.querySelector("[data-source-lab-next]")?.addEventListener("click",nextSourceLabRound);
}
function answerSourceLab(correct){if(sourceLabAnswered)return;sourceLabAnswered=true;if(correct)sourceLabScore++;sourceLabFeedback((correct?"¡Correcto! ":"Revisa la evidencia. ")+sourceLabChallenge.explanation,correct);const next=$("[data-source-lab-next]");if(next){next.hidden=false;next.textContent=sourceLabRound===4?"Ver resultado":"Siguiente reto";}$("#lab-task-content")?.querySelectorAll(".math-lab-option,[data-source-order-check],[data-source-order-move]").forEach(button=>button.disabled=true);}
function nextSourceLabRound(){
  sourceLabRound++;
  if(sourceLabRound>=5){const topic="fuentes-informacion",sessionId=`SL-${sourceLabMechanic}-${hashSeed(sourceLabSeed).toString(16)}`,previous=new Set(conceptMedals(labProgress,topic));labProgress=recordLabResult(labProgress,{exerciseId:sessionId,mode:sourceLabMechanic,correct:sourceLabScore>0,completed:sourceLabScore>0,hints:sourceLabHints?Math.min(2,sourceLabHints):sourceLabScore===5?0:sourceLabScore>=3?1:2,topicId:topic,conceptId:"recoleccion"});saveLabProgress();if(sourceLabScore>0)document.dispatchEvent(new CustomEvent("traza:actividad-laboratorio"));if(!previous.has("recoleccion")&&conceptMedals(labProgress,topic).includes("recoleccion")){const notice=$("#lab-medal-announcement");if(notice){notice.hidden=false;notice.textContent="🏅 Medalla de recolección: tres mecánicas dominadas.";}}
    const stars=sourceLabScore===5?3:sourceLabScore>=3?2:sourceLabScore>=1?1:0,content=$("#lab-task-content");content.innerHTML='<section class="lab-session-finish"><p class="eyebrow">PARTIDA COMPLETADA</p><h4>Terminaste los cinco retos.</h4><div class="lab-finish-stars" aria-label="'+stars+' estrellas">'+[1,2,3].map((value,index)=>'<span class="'+(value<=stars?"is-earned":"")+'" style="--star-delay:'+index*120+'ms">★</span>').join("")+'</div><p>'+sourceLabScore+' de 5 retos resueltos correctamente.</p><div class="lab-task-actions"><button type="button" class="button button-primary" data-source-lab-replay>Repetir</button><button type="button" class="button button-secondary" data-source-lab-back>Volver a mecánicas</button></div></section>';content.querySelector("[data-source-lab-replay]")?.addEventListener("click",()=>startSourceLab(sourceLabMechanic));content.querySelector("[data-source-lab-back]")?.addEventListener("click",returnToLabModes);return;}
  sourceLabHints=0;sourceLabChallenge=buildSourceLabChallenge(sourceLabMechanic,sourceLabSeed,sourceLabRound);renderSourceLabRound();
}
function startSourceLab(mechanic){sourceLabActive=true;sourceLabMechanic=mechanic;sourceLabRound=0;sourceLabScore=0;sourceLabHints=0;sourceLabSeed=`${mechanic}:session-${labProgress.topics?.["fuentes-informacion"]?.concepts?.recoleccion?.[mechanic]?.partidas??0}`;setLabCatalogControls(false);$("#lab-mode-cards")?.setAttribute("hidden","");$("#lab-practice-workspace")?.removeAttribute("hidden");$(".lab-practice-heading")?.setAttribute("hidden","");$(".lab-layout")?.setAttribute("hidden","");$("#lab-task-panel")?.removeAttribute("hidden");$("#view-lab")?.classList.add("lab-source-playing");sourceLabChallenge=buildSourceLabChallenge(mechanic,sourceLabSeed,0);renderSourceLabRound();requestAnimationFrame(()=>$("#lab-task-title")?.focus());}
function mathLabFeedback(message,correct){
  const status=$("#math-lab-feedback");if(!status)return;
  status.hidden=false;status.className="math-lab-feedback "+(correct?"is-correct":"is-incorrect");
  status.textContent=message;
}
function renderMathLabRound(){
  const challenge=mathLabChallenge;if(!challenge)return;
  mathLabAnswered=false;
  const title=$("#lab-task-title");if(title)title.textContent=challenge.mechanicLabel;
  const content=$("#lab-task-content");if(!content)return;
  const answered=mathLabScore;
  let interaction="";
  if(challenge.kind==="order"){
    const items=challenge.items.map(item=>'<li data-order-id="'+esc(item.id)+'"><span>'+esc(item.label)+'</span><span class="math-lab-order-actions"><button type="button" data-order-move="up" aria-label="Subir">↑</button><button type="button" data-order-move="down" aria-label="Bajar">↓</button></span></li>').join("");
    interaction='<ol class="math-lab-order-list" id="math-lab-order">'+items+'</ol><button type="button" class="button button-primary" data-math-check-order>Comprobar orden</button>';
  } else if(challenge.kind==="number-line"){
    interaction='<div class="math-lab-number-game"><button type="button" class="math-lab-token" draggable="true" aria-label="Ficha para arrastrar" title="Arrastra la ficha hasta una marca">±</button><div class="math-lab-number-line" role="group" aria-label="Recta numérica; usa las flechas para elegir una marca">'+challenge.positions.map((position,index)=>'<button type="button" data-math-value="'+position+'" tabindex="'+(index===0?"0":"-1")+'"><span>'+position+'</span></button>').join("")+'</div></div>';
  } else if(challenge.kind==="fraction-bar"){
    interaction='<div class="math-lab-fraction-bar" role="group" aria-label="Barra de '+challenge.denominator+' partes">'+Array.from({length:challenge.denominator},(_,index)=>'<button type="button" data-bar-part="'+index+'" aria-label="Parte '+(index+1)+'" aria-pressed="false"></button>').join("")+'</div><p class="math-lab-bar-count" id="math-lab-bar-count">0 de '+challenge.denominator+' partes</p><button type="button" class="button button-primary" data-math-check-bar>Comprobar barra</button>';
  } else if(challenge.kind==="input"){
    interaction='<form class="math-lab-answer-form"><label for="math-lab-answer">Tu respuesta</label><div><input id="math-lab-answer" inputmode="decimal" autocomplete="off" placeholder="Número o fracción" aria-describedby="math-lab-feedback"><button type="submit" class="button button-primary">Comprobar</button></div></form>';
  } else {
    interaction='<div class="math-lab-options">'+challenge.options.map(option=>'<button type="button" class="math-lab-option" data-math-value="'+esc(typeof option.value==="object"?formatDecimalOrRational(option.value):option.value)+'" data-correct="'+String(option.correct)+'">'+esc(option.label)+'</button>').join("")+'</div>';
  }
  content.innerHTML='<section class="math-lab-session"><header class="math-lab-session-head"><button type="button" class="text-link" data-math-lab-back>← Volver a mecánicas</button><span>Reto '+(mathLabRound+1)+' de 5 · '+mathLabScore+' correctos</span><button type="button" class="text-link" data-math-lab-hint>Pista</button></header><div class="math-lab-prompt"><p class="eyebrow">'+esc(challenge.mechanicLabel.toLocaleUpperCase("es"))+' · '+mathLabDifficulty+'/4</p><h4>'+esc(challenge.question)+'</h4>'+(challenge.exercise.expression?'<div class="math-lab-expression">'+esc(challenge.exercise.expression)+'</div>':'')+'</div>'+interaction+'<p id="math-lab-feedback" class="math-lab-feedback" role="status" hidden></p><button type="button" class="button button-secondary math-lab-next" data-math-lab-next hidden>Siguiente reto</button></section>';
  content.querySelector("[data-math-lab-back]")?.addEventListener("click",returnToLabModes);
  content.querySelector("[data-math-lab-hint]")?.addEventListener("click",()=>{
    mathLabHints=Math.min(2,mathLabHints+1);mathLabFeedback(challenge.explanation,false);
  });
  content.querySelectorAll(".math-lab-option").forEach(button=>button.addEventListener("click",()=>answerMathLab(button.dataset.correct==="true")));
  content.querySelector(".math-lab-answer-form")?.addEventListener("submit",event=>{
    event.preventDefault();
    try{
      const answer=parseRationalAnswer(content.querySelector("#math-lab-answer").value);
      const expected=parseRationalAnswer(challenge.answer);
      answerMathLab(answer.n===expected.n&&answer.d===expected.d);
    }catch{
      mathLabFeedback("Escribe un número o una fracción, por ejemplo 3/4.",false);
    }
  });
  content.querySelectorAll(".math-lab-number-line [data-math-value]").forEach(button=>button.addEventListener("click",()=>answerMathLab(Number(button.dataset.mathValue)===challenge.answer)));
  const numberLine=content.querySelector(".math-lab-number-line");
  numberLine?.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight"].includes(event.key))return;
    event.preventDefault();const marks=[...numberLine.querySelectorAll("[data-math-value]")],index=marks.indexOf(document.activeElement);
    const next=Math.max(0,Math.min(marks.length-1,index+(event.key==="ArrowRight"?1:-1)));
    marks.forEach((mark,i)=>mark.tabIndex=i===next?0:-1);marks[next]?.focus();
  });
  const token=content.querySelector(".math-lab-token");
  token?.addEventListener("dragstart",event=>event.dataTransfer?.setData("text/plain","math-lab-token"));
  numberLine?.querySelectorAll("[data-math-value]").forEach(mark=>{
    mark.addEventListener("dragover",event=>event.preventDefault());
    mark.addEventListener("drop",event=>{event.preventDefault();answerMathLab(Number(mark.dataset.mathValue)===challenge.answer);});
  });
  content.querySelectorAll("[data-bar-part]").forEach(button=>button.addEventListener("click",()=>{
    const selected=button.getAttribute("aria-pressed")!=="true";button.setAttribute("aria-pressed",String(selected));button.classList.toggle("is-shaded",selected);
    content.querySelector("#math-lab-bar-count").textContent=content.querySelectorAll('[data-bar-part][aria-pressed="true"]').length+" de "+challenge.denominator+" partes";
  }));
  content.querySelector("[data-math-check-bar]")?.addEventListener("click",()=>answerMathLab(content.querySelectorAll('[data-bar-part][aria-pressed="true"]').length===challenge.numerator));
  content.querySelectorAll("[data-order-move]").forEach(button=>button.addEventListener("click",()=>{
    const item=button.closest("li"),list=item.parentElement;
    if(button.dataset.orderMove==="up"&&item.previousElementSibling)list.insertBefore(item,item.previousElementSibling);
    if(button.dataset.orderMove==="down"&&item.nextElementSibling)list.insertBefore(item.nextElementSibling,item);
  }));
  content.querySelector("[data-math-check-order]")?.addEventListener("click",()=>{
    const actual=[...content.querySelectorAll("[data-order-id]")].map(item=>item.dataset.orderId);
    answerMathLab(actual.every((id,index)=>id===challenge.answer[index]));
  });
  content.querySelector("[data-math-lab-next]")?.addEventListener("click",nextMathLabRound);
}
function answerMathLab(correct){
  if(mathLabAnswered)return;
  mathLabAnswered=true;
  if(correct)mathLabScore++;
  mathLabFeedback(correct?"¡Correcto! "+mathLabChallenge.explanation:"Aún no. "+mathLabChallenge.explanation,correct);
  const next=$("[data-math-lab-next]");if(next){next.hidden=false;next.textContent=mathLabRound===4?"Ver resultado":"Siguiente reto";}
  $(".math-lab-options")?.querySelectorAll("button").forEach(button=>button.disabled=true);
  $(".math-lab-number-line")?.querySelectorAll("button").forEach(button=>button.disabled=true);
  $("[data-math-check-bar], [data-math-check-order]")?.setAttribute("disabled","");
}
function nextMathLabRound(){
  mathLabRound++;
  if(mathLabRound>=5){
    const sessionId=`ML-${mathLabTopic}-${mathLabMechanic}-session-${hashSeed(mathLabSeed).toString(16)}`;
    const hints=mathLabScore===5?0:mathLabScore>=3?1:2;
    const medalsBefore=new Set(conceptMedals(labProgress,mathLabTopic));
    labProgress=recordLabResult(labProgress,{exerciseId:sessionId,mode:mathLabMechanic,correct:mathLabScore>0,completed:mathLabScore>0,hints,topicId:mathLabTopic,conceptId:mathLabTopic});
    saveLabProgress();
    if(mathLabScore>0)document.dispatchEvent(new CustomEvent("traza:actividad-laboratorio"));
    if(!medalsBefore.has(mathLabTopic)&&conceptMedals(labProgress,mathLabTopic).includes(mathLabTopic)){
      const announcement=$("#lab-medal-announcement");if(announcement){announcement.hidden=false;announcement.textContent="🏅 Medalla de "+(mathLabTitles[mathLabTopic]??mathLabTopic)+": tres mecánicas dominadas.";}
    }
    const stars=mathLabScore===5?3:mathLabScore>=3?2:mathLabScore>=1?1:0;
    const content=$("#lab-task-content");
    content.innerHTML='<section class="lab-session-finish"><p class="eyebrow">PARTIDA COMPLETADA</p><h4>Terminaste los cinco retos.</h4><div class="lab-finish-stars" aria-label="'+stars+' estrellas">'+[1,2,3].map((value,index)=>'<span class="'+(value<=stars?"is-earned":"")+'" style="--star-delay:'+index*120+'ms">★</span>').join("")+'</div><p>'+mathLabScore+' de 5 retos resueltos correctamente.</p><div class="lab-task-actions"><button type="button" class="button button-primary" data-math-lab-replay>Repetir</button><button type="button" class="button button-secondary" data-math-lab-back>Volver a mecánicas</button></div></section>';
    content.querySelector("[data-math-lab-replay]")?.addEventListener("click",()=>startMathLab(mathLabTopic,mathLabMechanic,mathLabDifficulty));
    content.querySelector("[data-math-lab-back]")?.addEventListener("click",returnToLabModes);
    return;
  }
  mathLabHints=0;mathLabChallenge=buildMathLabChallenge(mathLabTopic,mathLabMechanic,mathLabDifficulty,mathLabSeed,mathLabRound);renderMathLabRound();
}
function startMathLab(topic,mechanic,difficulty=1){
  mathLabTopic=topic;mathLabMechanic=mechanic;mathLabDifficulty=difficulty;mathLabRound=0;mathLabScore=0;mathLabHints=0;mathLabActive=true;
  mathLabSeed=`${topic}:${mechanic}:${difficulty}:session-${labProgress.topics?.[topic]?.concepts?.[topic]?.[mechanic]?.partidas??0}`;
  setLabCatalogControls(false);$("#lab-mode-cards")?.setAttribute("hidden","");$("#lab-practice-workspace")?.removeAttribute("hidden");$(".lab-practice-heading")?.setAttribute("hidden","");$(".lab-layout")?.setAttribute("hidden","");$("#lab-task-panel")?.removeAttribute("hidden");
  $("#view-lab")?.classList.add("lab-math-playing");
  mathLabChallenge=buildMathLabChallenge(topic,mechanic,difficulty,mathLabSeed,0);renderMathLabRound();
  requestAnimationFrame(()=>$("#lab-task-title")?.focus());
}
function setActivity(next,options={}){
  if(!options.keepMixed)mixedQueue=[];
  activity=next;
  predictionAnswer=null;whatIfResult=null;orderChecked=false;errorLineSelected=null;
  whatIfPrediction=null;
  orderedLines=[];
  matchChallenge=null;
  if(!mixedActive)activityStreak=0;
  activityErrors=0;
  if(next==="error")errorScenario=seededAttempt()%errorScenarios.length;
  $("#view-lab")?.classList.toggle("lab-order-concealed",next==="order");
  $("#lab-activity-list")?.querySelectorAll("[data-lab-activity]").forEach(button=>
    button.classList.toggle("is-active",button.dataset.labActivity===next));
  const titles={predict:"Predice el siguiente paso",table:"Tabla de seguimiento","follow-arrow":"Sigue la flecha",order:"Ordena instrucciones",symbol:"Identifica la figura",error:"Encuentra el error",whatif:"¿Y si…?","fill-gap":"Completa el hueco"};
  if($("#lab-task-title"))$("#lab-task-title").textContent=titles[next]??"Actividad";
  renderActivity();
}
function requireTrace(){
  if(trace)return true;
  $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Primero necesitas una ejecución.</strong><p>Elige un ejercicio en el Catálogo, revisa el enunciado y abre el Simulador. Después vuelve aquí para practicar con esa misma ejecución.</p><button type="button" class="button button-primary" id="lab-go-exercises">Ir al catálogo</button></div>';
  $("#lab-go-exercises")?.addEventListener("click",()=>document.querySelector('[data-space="exercises"]')?.click());
  return false;
}
function eventOptions(expected){
  const labels={
    input:"Entrada de dato",assignment:"Asignación / cálculo",output:"Salida",
    decision:"Decisión",branch:"Selección de ruta", "loop-init":"Preparación del ciclo",
    "loop-condition":"Comprobación del ciclo","loop-enter":"Iteración",
    "loop-update":"Avance del contador","loop-exit":"Fin del ciclo",
    "program-end":"Fin del algoritmo"
  };
  const all=Object.entries(labels).filter(([key])=>key!==expected).map(([,value])=>value);
  const expectedLabel=labels[expected]??expected;
  return [expectedLabel,...all.slice(0,3)].sort((a,b)=>a.localeCompare(b,"es"));
}
function renderPredict(){
  if(!requireTrace())return;
  const targetIndex=Math.min(trace.index+1,trace.execution.events.length-1);
  if(targetIndex===trace.index){
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Has llegado al último paso.</strong><p>Vuelve al simulador y selecciona un paso anterior para predecir lo que sigue.</p></div>';
    return;
  }
  const next=trace.execution.events[targetIndex];
  const options=eventOptions(next.type);
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">ANTES DE REVELAR EL PASO '+(targetIndex+1)+'</p><h4>¿Qué tipo de acción ocurrirá después?</h4>'+
    '<p class="lab-muted">Paso actual: '+(trace.index+1)+' de '+trace.length+'.</p>'+
    '<div class="lab-choice-list">'+options.map(value=>'<button type="button" class="lab-choice" data-predict="'+esc(value)+'">'+esc(value)+'</button>').join("")+'</div>'+
    '<div id="lab-predict-feedback" class="lab-feedback" role="status"></div>'+
    '<button type="button" id="lab-reveal-prediction" class="button button-primary" disabled>Revelar el paso real</button></div>';
  $("#lab-reveal-prediction").addEventListener("click",()=>{
    const feedback=$("#lab-predict-feedback");
    const labels={
      input:"Entrada de dato",assignment:"Asignación / cálculo",output:"Salida",
      decision:"Decisión",branch:"Selección de ruta","loop-init":"Preparación del ciclo",
      "loop-condition":"Comprobación del ciclo","loop-enter":"Iteración",
      "loop-update":"Avance del contador","loop-exit":"Fin del ciclo",
      "program-end":"Fin del algoritmo"
    };
    const expected=labels[next.type]??next.type;
    const correct=predictionAnswer===expected;
    recordResult("predict",true,correct?0:2);
    $("#lab-reveal-prediction").disabled=true;
    $("#lab-task-content").querySelectorAll("[data-predict]").forEach(item=>item.disabled=true);
    const symbol=next.type==="input"?"Paralelogramo":
      ["assignment","loop-init","loop-update"].includes(next.type)?"Rectángulo de proceso":
      next.type==="output"?"Documento / salida":
      ["decision","loop-condition"].includes(next.type)?"Rombo de decisión":
      "Conector / terminal";
    feedback.innerHTML=
      "<strong>"+(correct?"Predicción correcta.":"La predicción no coincide.")+"</strong>"+
      "<p>El evento real es <b>"+esc(expected)+"</b>: "+esc(next.scene?.body??next.message??"")+"</p>"+
      "<p>Símbolo relacionado: "+esc(symbol)+". "+esc(next.scene?.technical??"")+"</p>"+
      "<button type='button' class='text-link' id='lab-go-predicted'>Inspeccionar el paso "+(targetIndex+1)+" ↗</button>"+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",correct);
    feedback.classList.toggle("is-wrong",!correct);
    $("#lab-go-predicted")?.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("traza:jump-to-step",{detail:{index:targetIndex}})));
    bindMixedAdvance();
  });
  $("#lab-task-content").querySelectorAll("[data-predict]").forEach(button=>{
    button.addEventListener("click",()=>{
      predictionAnswer=button.dataset.predict;
      $("#lab-task-content").querySelectorAll("[data-predict]").forEach(item=>item.classList.toggle("is-selected",item===button));
      $("#lab-reveal-prediction").disabled=false;
      $("#lab-predict-feedback").textContent="Predicción registrada. Revela el paso para compararla con el evento real.";
    });
  });
}

function renderTable(){
  if(!requireTrace())return;
  const events=trace.execution.events;
  const keys=[...new Set(events.flatMap(e=>Object.keys(e.variables??{})))];
  if(!keys.length){$("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Esta traza todavía no tiene variables.</strong><p>Elige una ejecución que registre valores para completar la tabla.</p></div>';return;}
  const targetKey=keys[(seededAttempt()+trace.methodIndex)%keys.length];
  const snapshots=events.map((event,index)=>({event,index})).filter(({event})=>Object.hasOwn(event.variables??{},targetKey));
  const target=snapshots[(seededAttempt()+trace.exercise.id)%snapshots.length];
  const expected=target.event.variables[targetKey];
  let attempts=0;
  const headings=["Paso","Iteración","Evento",...keys.map(key=>key+" · anterior → actual"),"Salida"];
  $("#lab-task-content").innerHTML=
    '<p class="lab-muted">Cada fila conserva el snapshot del motor. Las celdas muestran la primera asignación, el cambio anterior → actual o un valor sin cambio; la fila activa sigue al simulador.</p>'+
    '<div class="lab-table-wrap"><table class="lab-trace-table"><thead><tr>'+headings.map(x=>"<th>"+esc(x)+"</th>").join("")+'</tr></thead><tbody>'+
    events.map((event,index)=>{
      const previous=events[index-1]?.variables??{};
      const current=event.variables??{};
      const iteration=(event.loopStack??[]).map(loop=>loop.iteration).join(" / ")||"—";
      const variableCells=keys.map(key=>{
        const hasCurrent=Object.hasOwn(current,key);
        const hasPrevious=Object.hasOwn(previous,key);
        if(!hasCurrent)return "—";
        const value=fmt(current[key]);
        if(!hasPrevious)return "(nace) → "+value;
        const before=fmt(previous[key]);
        return before===value?value+" (sin cambio)":before+" → "+value;
      });
      const cells=[index+1,iteration,event.scene?.title??event.type,...variableCells,(event.outputs??[]).map(fmt).join(", ")||"—"];
      return '<tr class="'+(index===trace.index?"is-current":"")+'" data-lab-row="'+index+'">'+cells.map(cell=>"<td>"+esc(cell)+"</td>").join("")+"</tr>";
    }).join("")+
    '</tbody></table></div><button type="button" class="button button-secondary" id="lab-table-follow">Ir a la fila actual</button>'+
    '<section class="lab-question lab-table-question"><p class="eyebrow">RETO · LEE EL SNAPSHOT</p><h4>En el paso '+(target.index+1)+', ¿qué valor tiene '+esc(targetKey)+'?</h4><label class="lab-editor-field"><span>ESCRIBE EL VALOR</span><input id="lab-table-answer" inputmode="decimal" autocomplete="off"></label><div class="lab-task-actions"><button type="button" class="button button-primary" id="lab-table-check">Comprobar</button></div><div id="lab-table-feedback" class="lab-feedback" role="status"></div></section>';
  $("#lab-table-check").addEventListener("click",()=>{
    const answer=$("#lab-table-answer").value.trim();if(!answer)return;
    attempts++;
    const correct=String(expected)===answer||(typeof expected==="number"&&Number.isFinite(Number(answer))&&Number(answer)===expected);
    const feedback=$("#lab-table-feedback");
    if(correct){recordResult("table",true,attempts-1);feedback.innerHTML="<strong>✓ Correcto.</strong> El snapshot del motor registra "+esc(targetKey)+" = "+esc(fmt(expected))+"."+mixedAdvanceMarkup();feedback.classList.add("is-correct");$("#lab-table-check").disabled=true;bindMixedAdvance();}
    else if(attempts===1){recordResult("table",false);feedback.innerHTML="<strong>Casi.</strong> Revisa la columna de cambios de "+esc(targetKey)+" en esa fila.";feedback.classList.add("is-wrong");}
    else{recordResult("table",true,2);feedback.innerHTML="<strong>El valor es "+esc(fmt(expected))+".</strong> La tabla conserva el snapshot calculado por el motor."+mixedAdvanceMarkup();feedback.classList.add("is-wrong");$("#lab-table-check").disabled=true;bindMixedAdvance();}
  });
  $("#lab-table-follow").addEventListener("click",()=>$("#lab-task-content").querySelector('[data-lab-row="'+trace.index+'"]')?.scrollIntoView({block:"center"}));
  $("#lab-task-content").querySelector('[data-lab-row="'+trace.index+'"]')?.scrollIntoView({block:"nearest",inline:"nearest"});
}

function renderOrder(){
  if(!requireTrace())return;
  const lines=trace.method.pseudocode.split("|").map(x=>x.trim()).filter(Boolean);
  if(!orderedLines.length||orderedLines.length!==lines.length)orderedLines=mixedModeOrder(trace.exercise.id,seededAttempt(),lines);
  $("#lab-task-content").innerHTML=
    '<p class="lab-muted">Reordena las instrucciones para reconstruir el pseudocódigo original. Este ejercicio no modifica la ejecución que aparece a la izquierda.</p>'+
    '<ol class="lab-sort-list">'+orderedLines.map((line,index)=>'<li draggable="true" data-order-item="'+index+'"><span class="lab-drag-grip" aria-hidden="true">⠿</span><code>'+esc(line)+'</code><span class="lab-sort-controls"><button type="button" data-order-up="'+index+'" '+(index===0?"disabled":"")+' aria-label="Subir instrucción">↑</button><button type="button" data-order-down="'+index+'" '+(index===orderedLines.length-1?"disabled":"")+' aria-label="Bajar instrucción">↓</button></span></li>').join("")+'</ol>'+
    '<div class="lab-task-actions"><button type="button" class="button button-secondary" id="lab-order-reset">Mezclar de nuevo</button><button type="button" class="button button-primary" id="lab-order-check">Comprobar orden</button></div>'+
    '<div id="lab-order-feedback" class="lab-feedback" role="status">'+(orderChecked?"Orden comprobado.":"")+'</div>';
  const sortList=$("#lab-task-content .lab-sort-list");
  let dragIndex=null;
  sortList.addEventListener("dragstart",event=>{
    const item=event.target.closest("[data-order-item]");
    if(!item)return;
    dragIndex=Number(item.dataset.orderItem);
    item.classList.add("is-dragging");
    event.dataTransfer.effectAllowed="move";
    event.dataTransfer.setData("text/plain",String(dragIndex));
  });
  sortList.addEventListener("dragover",event=>{
    const item=event.target.closest("[data-order-item]");
    if(dragIndex===null||!item)return;
    event.preventDefault();
    sortList.querySelectorAll(".is-drop-target").forEach(node=>node.classList.remove("is-drop-target"));
    item.classList.add("is-drop-target");
  });
  sortList.addEventListener("drop",event=>{
    const item=event.target.closest("[data-order-item]");
    if(dragIndex===null||!item)return;
    event.preventDefault();
    const to=Number(item.dataset.orderItem);
    if(Number.isInteger(to)&&to!==dragIndex){
      const [moving]=orderedLines.splice(dragIndex,1);
      orderedLines.splice(to,0,moving);
      orderChecked=false;renderOrder();
    }
    dragIndex=null;
  });
  sortList.addEventListener("dragend",()=>{
    dragIndex=null;
    sortList.querySelectorAll(".is-dragging,.is-drop-target").forEach(node=>node.classList.remove("is-dragging","is-drop-target"));
  });
  $("#lab-order-reset").addEventListener("click",()=>{orderedLines=mixedModeOrder(trace.exercise.id,seededAttempt()+1,lines);orderChecked=false;renderOrder();});
  $("#lab-order-check").addEventListener("click",()=>{
    let candidate;
    try{candidate=executePseudocode(orderedLines.join("|"),actualInputValues());}
    catch(error){candidate={ok:false,error:{message:error.message},outputs:[],variables:{}};}
    const correct=Boolean(candidate.ok&&JSON.stringify(candidate.outputs)===JSON.stringify(trace.execution.outputs)&&stableValues(candidate.variables)===stableValues(trace.execution.variables));
    recordResult("order",correct);
    orderChecked=true;
    $("#lab-order-feedback").innerHTML=correct?
      "<strong>✓ Orden válido.</strong> Al ejecutar las instrucciones, se conservan las salidas y los valores de la traza.":
      "<strong>Hay instrucciones fuera de lugar.</strong> Revisa la secuencia y vuelve a comprobarla.";
    if(correct){$("#view-lab")?.classList.remove("lab-order-concealed");feedback.innerHTML+="<p>El diagrama se revela al completar el reto.</p>";}
    $("#lab-order-feedback").innerHTML+=mixedAdvanceMarkup();
    bindMixedAdvance();
    $("#lab-order-feedback").classList.toggle("is-correct",correct);
    $("#lab-order-feedback").classList.toggle("is-wrong",!correct);
  });
  $("#lab-task-content").querySelectorAll("[data-order-up]").forEach(button=>button.addEventListener("click",()=>{
    const index=Number(button.dataset.orderUp);[orderedLines[index-1],orderedLines[index]]=[orderedLines[index],orderedLines[index-1]];orderChecked=false;renderOrder();
  }));
  $("#lab-task-content").querySelectorAll("[data-order-down]").forEach(button=>button.addEventListener("click",()=>{
    const index=Number(button.dataset.orderDown);[orderedLines[index+1],orderedLines[index]]=[orderedLines[index],orderedLines[index+1]];orderChecked=false;renderOrder();
  }));
}
function symbolOptions(type){
  return symbolMap[type]?.options??[];
}
function renderSymbol(){
  if(!requireTrace())return;
  const ast=flattenPseudocode(trace.execution.program);
  const candidates=ast.filter(row=>symbolMap[row.type]);
  if(!candidates.length){$("#lab-task-content").innerHTML="<p>El método no contiene un elemento para clasificar.</p>";return;}
  const event=trace.event;
  const row=candidates.find(item=>item.id===event?.nodeId)||
    candidates.find(item=>item.line===event?.sourceLine)||
    candidates[0];
  const model=symbolMap[row.type];
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">INSTRUCCIÓN ACTIVA · LÍNEA '+row.line+'</p><pre class="lab-snippet"><code>'+esc(row.source)+'</code></pre>'+
    '<p class="lab-muted">El ejercicio utiliza el nodo que corresponde al paso '+(trace.index+1)+' de la ejecución.</p>'+
    '<h4>¿Qué símbolo representa esta instrucción?</h4><div class="lab-choice-list">'+model.options.map(option=>'<button type="button" class="lab-choice" data-symbol-choice="'+esc(option)+'">'+esc(option)+'</button>').join("")+'</div>'+
    '<div id="lab-symbol-feedback" class="lab-feedback" role="status"></div></div>';
  let symbolErrors=0,symbolAnswered=false;
  $("#lab-task-content").querySelectorAll("[data-symbol-choice]").forEach(button=>button.addEventListener("click",()=>{
    if(symbolAnswered)return;
    const correct=button.dataset.symbolChoice===model.correct;
    if(!correct){
      recordResult("symbol",false);symbolErrors++;
      if(symbolErrors===1){
        $("#lab-symbol-feedback").innerHTML="<strong>Casi.</strong> Revisa qué acción describe la instrucción. <a href=\"#\" class=\"text-link\" data-symbol-hint>Ver lección sobre símbolos</a>";
        $("[data-symbol-hint]")?.addEventListener("click",event=>{event.preventDefault();document.dispatchEvent(new CustomEvent("traza:abrir-leccion",{detail:{id:"terminals"}}));});
        $("#lab-symbol-feedback").classList.add("is-wrong");return;
      }
    }
    recordResult("symbol",true,correct?(symbolErrors?1:0):2);symbolAnswered=true;
    $("#lab-symbol-feedback").innerHTML=(correct?"<strong>Correcto.</strong> ":"<strong>No exactamente.</strong> ")+esc(model.why)+mixedAdvanceMarkup();
    bindMixedAdvance();
    $("#lab-symbol-feedback").classList.toggle("is-correct",correct);
    $("#lab-symbol-feedback").classList.toggle("is-wrong",!correct);
    $("#lab-task-content").querySelectorAll("[data-symbol-choice]").forEach(item=>item.disabled=true);
  }));
}

function renderMatch(){
  if(!requireTrace())return;
  matchChallenge=buildMatchChallenge(trace.exercise.id,trace.methodIndex,seededAttempt());
  let matched=0,selected=null,cleanPairs=0;
  const pairErrors=new Map();
  const completePair=(id,{revealed=false}={})=>{
    const left=$("#lab-task-content").querySelector('[data-match-left="'+CSS.escape(id)+'"]');
    const right=$("#lab-task-content").querySelector('[data-match-right="'+CSS.escape(id)+'"]');
    if(!left||!right||left.disabled)return;
    left.disabled=true;right.disabled=true;left.classList.remove("is-selected");left.classList.add("is-matched");right.classList.add("is-matched");
    left.setAttribute("aria-pressed","false");left.setAttribute("aria-label",left.textContent+", pareja correcta");right.setAttribute("aria-label",right.textContent+", pareja correcta");
    if(!revealed&&!(pairErrors.get(id)>0))cleanPairs++;
    matched++;selected=null;
    const feedback=$("#lab-match-feedback");
    feedback.textContent=revealed?"Te muestro la pareja correcta. Llevas "+matched+" de 6.":"✓ Pareja correcta. Llevas "+matched+" de 6.";
    if(matched===matchChallenge.left.length){
      const hints=cleanPairs===6?0:cleanPairs>=4?1:2;
      recordResult("match",true,hints);
      feedback.classList.add("is-correct");
        feedback.innerHTML="<strong>Completaste las seis parejas.</strong><p>"+cleanPairs+" parejas resueltas sin ayuda. Las figuras representan acciones distintas del algoritmo.</p><button type=\"button\" class=\"text-link\" id=\"lab-match-retry\">Repetir el reto</button>"+mixedAdvanceMarkup();
      $("#lab-match-retry")?.addEventListener("click",()=>setActivity("match"));
        bindMixedAdvance();
    }
  };
  const renderBoard=()=>{
    $("#lab-task-content").innerHTML=
      '<section class="lab-match-game" aria-labelledby="lab-match-prompt"><p class="eyebrow">RETO '+(matched+1)+' DE 6</p><h4 id="lab-match-prompt">Une cada instrucción con su símbolo</h4><p class="lab-muted">Selecciona una tarjeta de cada columna. También puedes usar Tab y Enter.</p>'+
      '<div class="lab-match-columns"><div role="group" aria-label="Instrucciones">'+matchChallenge.left.map(item=>'<button type="button" class="lab-match-choice" data-match-left="'+item.id+'" aria-pressed="false">'+esc(item.label)+'</button>').join("")+'</div><div role="group" aria-label="Símbolos">'+matchChallenge.right.map(item=>'<button type="button" class="lab-match-choice" data-match-right="'+item.id+'" aria-pressed="false">'+esc(item.label)+'</button>').join("")+'</div></div><p id="lab-match-feedback" class="lab-feedback" role="status" aria-live="polite">Elige una instrucción para empezar.</p></section>';
    const leftButtons=$("#lab-task-content").querySelectorAll("[data-match-left]");
    leftButtons.forEach(button=>button.addEventListener("click",()=>{
      if(button.disabled)return;
      leftButtons.forEach(item=>{item.classList.remove("is-selected");item.setAttribute("aria-pressed","false");});
      selected=button.dataset.matchLeft;button.classList.add("is-selected");button.setAttribute("aria-pressed","true");
      $("#lab-match-feedback").textContent="Ahora elige el símbolo que corresponde.";
    }));
    $("#lab-task-content").querySelectorAll("[data-match-right]").forEach(button=>button.addEventListener("click",()=>{
      const feedback=$("#lab-match-feedback");
      if(selected===null){feedback.textContent="Primero elige una instrucción.";return;}
      if(button.dataset.matchRight!==selected){
        const id=selected,errors=(pairErrors.get(id)||0)+1;pairErrors.set(id,errors);
        const left=$("#lab-task-content").querySelector('[data-match-left="'+CSS.escape(id)+'"]');
        if(errors===1){feedback.innerHTML="<strong>Casi.</strong> Revisa la forma que representa esta acción. <a href=\"#\" class=\"text-link\" data-match-hint>Ver lección sobre los símbolos</a>";
          $("[data-match-hint]")?.addEventListener("click",event=>{event.preventDefault();document.dispatchEvent(new CustomEvent("traza:abrir-leccion",{detail:{id:"terminals"}}));});
        }else{
          feedback.textContent="Esta pareja es "+left.textContent+" con "+matchChallenge.right.find(item=>item.id===id).label+". Puedes continuar.";
          completePair(id,{revealed:true});
        }
        return;
      }
      completePair(selected);
    }));
  };
  renderBoard();
}

let errorLineSelected=null;
function renderError(){
  const scenario=errorScenarios[errorScenario%errorScenarios.length];
  const lines=scenario.source.split("|");
  if(errorLineSelected===null){
    const tested=executePseudocode(scenario.source,scenario.inputs);
    const actual=JSON.stringify(tested.outputs??[]);
    const expected=JSON.stringify([scenario.expected]);
    $("#lab-task-content").innerHTML=
      '<div class="lab-question lab-debug-question"><p class="eyebrow">CASO DE PRUEBA · '+(errorScenario+1)+' / '+errorScenarios.length+'</p>'+
      '<h4>'+esc(scenario.title)+'</h4><p>'+esc(scenario.statement)+'</p>'+
      '<div class="lab-debug-result-strip"><span>Entrada <code>'+esc(JSON.stringify(scenario.inputs))+'</code></span><span>Resultado observado <code>'+esc(actual)+'</code></span><span>Resultado esperado <code>'+esc(expected)+'</code></span></div>'+
      '<p class="lab-muted">Selecciona la línea que provoca el resultado incorrecto. Si todo está bien, elige «No hay error».</p>'+
      '<ol class="lab-debug-lines">'+lines.map((line,index)=>
        '<li><button type="button" data-error-line="'+index+'"><span>'+String(index+1).padStart(2,"0")+'</span><code>'+esc(line)+'</code><b>Elegir</b></button></li>'
      ).join("")+'</ol>'+
      '<button type="button" class="lab-choice lab-no-error" data-error-line="-1">✓ No hay error: el algoritmo es correcto</button></div>';
    $("#lab-task-content").querySelectorAll("[data-error-line]").forEach(button=>button.addEventListener("click",()=>{
      errorLineSelected=Number(button.dataset.errorLine);
      renderError();
    }));
    return;
  }
  const chosenLine=Number(errorLineSelected);
  const selectedLine=chosenLine<0?"No hay error":(lines[chosenLine]??"Línea desconocida");
  const actual=executePseudocode(scenario.source,scenario.inputs);
  const options=scenario.fixes;
  $("#lab-task-content").innerHTML=
    '<div class="lab-question lab-debug-question"><p class="eyebrow">CORRECCIÓN · CASO '+(errorScenario+1)+'</p>'+
    '<h4>Elegiste: '+esc(selectedLine)+'</h4>'+
    '<p class="lab-muted">Ahora selecciona la corrección y comprueba el recorrido con los mismos datos.</p>'+
    '<div class="lab-debug-lines is-compact">'+lines.map((line,index)=>
      '<div class="'+(index===chosenLine?"is-selected-error":"")+'"><span>'+String(index+1).padStart(2,"0")+'</span><code>'+esc(line)+'</code></div>'
    ).join("")+'</div>'+
    '<div class="lab-debug-fixes">'+options.map((option,index)=>
      '<button type="button" class="lab-choice" data-error-fix="'+index+'">'+esc(option.label)+'</button>'
    ).join("")+'</div><div id="lab-error-feedback" class="lab-feedback" role="status"></div>'+
    '<div class="lab-task-actions"><button type="button" class="button button-secondary" id="lab-error-back">Volver a las líneas</button><button type="button" class="button button-secondary" id="lab-next-error">Siguiente caso</button></div></div>';
  $("#lab-error-back").addEventListener("click",()=>{errorLineSelected=null;renderError();});
  $("#lab-next-error").addEventListener("click",()=>{errorScenario=(errorScenario+1)%errorScenarios.length;errorLineSelected=null;renderError();});
  $("#lab-task-content").querySelectorAll("[data-error-fix]").forEach(button=>button.addEventListener("click",()=>{
    const fix=options[Number(button.dataset.errorFix)];
    const corrected=executePseudocode(fix.source,scenario.inputs);
    const originalOK=Boolean(actual.ok&&JSON.stringify(actual.outputs)===JSON.stringify([scenario.expected]));
    const correctedOK=Boolean(corrected.ok&&JSON.stringify(corrected.outputs)===JSON.stringify([scenario.expected]));
    const lineCorrect=chosenLine===scenario.faultyLine;
    const fixCorrect=correctedOK&&(scenario.faultyLine<0?chosenLine===-1:lineCorrect);
    recordResult("error",true,fixCorrect?0:2);
    const feedback=$("#lab-error-feedback");
    const actualOriginal=JSON.stringify(actual.outputs??[]);
    const actualFixed=JSON.stringify(corrected.outputs??[]);
    feedback.innerHTML=
      '<strong>'+(fixCorrect?"Corrección correcta.":"Todavía no coincide con el caso esperado.")+'</strong>'+
      '<div class="lab-debug-comparison"><div><span>ANTES · ORIGINAL</span><code>'+esc(actualOriginal)+'</code><small>'+(originalOK?"El caso original ya era correcto.":"El caso original falla.")+'</small></div>'+
      '<div><span>DESPUÉS · CORRECCIÓN</span><code>'+esc(actualFixed)+'</code><small>'+(correctedOK?"El resultado coincide con lo esperado.":"La modificación aún no resuelve el caso.")+'</small></div></div>'+
      '<p>'+esc(scenario.explanation)+'</p>'+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",fixCorrect);
    feedback.classList.toggle("is-wrong",!fixCorrect);
    $("#lab-task-content").querySelectorAll("[data-error-fix]").forEach(item=>item.disabled=true);
    bindMixedAdvance();
  }));
}

function renderWhatIf(){
  if(!requireTrace())return;
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">EXPERIMENTO CONTROLADO · DOS RECORRIDOS</p><h4>Modifica una línea o un dato y compara qué ocurre paso a paso.</h4>'+
    '<fieldset class="lab-whatif-prediction"><legend>Antes de ejecutar, ¿qué esperas que ocurra?</legend><div class="lab-choice-list"><button type="button" class="lab-choice" data-whatif-predict="same">La salida no cambia</button><button type="button" class="lab-choice" data-whatif-predict="changes">La salida cambia</button><button type="button" class="lab-choice" data-whatif-predict="error">La ejecución falla</button></div></fieldset>'+
    '<label class="lab-editor-field"><span>PSEUDOCÓDIGO MODIFICABLE</span><textarea id="lab-whatif-code" rows="6">'+esc(trace.source.split("|").join("\n"))+'</textarea></label>'+
    '<label class="lab-editor-field"><span>DATOS DE ENTRADA (COMAS O ESPACIOS)</span><input id="lab-whatif-inputs" value="'+esc((trace.method.sample??[]).join(", "))+'"></label>'+
    '<div class="lab-task-actions"><button type="button" class="button button-primary" id="lab-whatif-run">Ejecutar y comparar</button></div>'+
    '<div id="lab-whatif-result" class="lab-comparison lab-comparison-traces" role="status"></div></div>';
  $("#lab-task-content").querySelectorAll("[data-whatif-predict]").forEach(button=>button.addEventListener("click",()=>{
    whatIfPrediction=button.dataset.whatifPredict;
    $("#lab-task-content").querySelectorAll("[data-whatif-predict]").forEach(item=>{item.classList.toggle("is-selected",item===button);item.setAttribute("aria-pressed",String(item===button));});
  }));
  $("#lab-whatif-run").addEventListener("click",()=>{
    if(!whatIfPrediction){$("#lab-whatif-result").textContent="Elige primero qué efecto esperas.";return;}
    const source=$("#lab-whatif-code").value.split("\n").map(x=>x.trim()).filter(Boolean).join("|");
    const inputs=$("#lab-whatif-inputs").value.trim()?$("#lab-whatif-inputs").value.split(/[\s,;]+/).filter(Boolean):[];
    let changed;
    try{changed=executePseudocode(source,inputs);}
    catch(error){changed={ok:false,error:{message:error.message},outputs:[],variables:{},events:[]};}
    const before=trace.execution,beforeEvents=before.events??[],afterEvents=changed.events??[];
    const signature=event=>[
      event.type,event.sourceLine,event.sourceText,event.route??(typeof event.result==="boolean"?(event.result?"V":"F"):""),
      event.change?.name??"",event.change?.value??event.value??""
    ].join("|");
    const max=Math.max(beforeEvents.length,afterEvents.length);
    let divergence=-1;
    for(let index=0;index<max;index++){
      if(!beforeEvents[index]||!afterEvents[index]||signature(beforeEvents[index])!==signature(afterEvents[index])){divergence=index;break;}
    }
    const label=event=>event?(event.scene?.title??event.sourceText??event.type??"Paso"):"La ejecución terminó";
    const track=(events,kind)=>{
      const visible=events.slice(0,Math.min(events.length,10));
      if(!visible.length)return '<p class="lab-route-empty">No se generaron pasos.</p>';
      return '<ol class="lab-route-track '+kind+'">'+visible.map((event,index)=>
        '<li class="'+(index===divergence?"is-divergent":"")+'"><span>'+String(index+1).padStart(2,"0")+'</span><strong>'+esc(typeNameForLab(event.type))+'</strong><small>'+esc(label(event))+'</small>'+
        (event.route||typeof event.result==="boolean"?'<b class="lab-route-flag '+((event.route??(event.result?"V":"F"))==="V"?"is-true":"is-false")+'">'+(event.route??(event.result?"V":"F"))+'</b>':"")+'</li>'
      ).join("")+'</ol>'+(events.length>visible.length?'<small class="lab-route-more">+'+(events.length-visible.length)+' pasos más</small>':"");
    };
    const names=[...new Set([...Object.keys(before.variables??{}),...Object.keys(changed.variables??{})])];
    const differences=names.filter(name=>JSON.stringify(before.variables?.[name])!==JSON.stringify(changed.variables?.[name]));
    const variableExplanation=differences.length?
      differences.map(name=>name+": "+(Object.hasOwn(before.variables??{},name)?fmt(before.variables[name]):"(sin valor)")+" → "+(Object.hasOwn(changed.variables??{},name)?fmt(changed.variables[name]):"(sin valor)")).join("; "):
      "Las variables finales no cambiaron.";
    const beforeOutput=JSON.stringify(before.outputs??[]),afterOutput=JSON.stringify(changed.outputs??[]);
    const originalBranches=beforeEvents.filter(event=>event.type==="decision"||event.type==="loop-condition").map(event=>event.route??(event.result?"V":"F"));
    const changedBranches=afterEvents.filter(event=>event.type==="decision"||event.type==="loop-condition").map(event=>event.route??(event.result?"V":"F"));
    const status=changed.ok?"Ejecución terminada":"Ejecución detenida por error";
    const firstBefore=divergence>=0?label(beforeEvents[divergence]):"No se separaron";
    const firstAfter=divergence>=0?label(afterEvents[divergence]):"Mismo recorrido";
    const explanation=divergence<0?"Con estos datos, ambos algoritmos recorren los mismos pasos.":
      "El primer cambio aparece en el paso "+(divergence+1)+". Desde ese punto las rutas pueden tomar decisiones distintas.";
    const actualEffect=!changed.ok?"error":divergence<0?"same":"changes";
    const predictionCorrect=whatIfPrediction===actualEffect;
    recordResult("whatif",true,predictionCorrect?0:2);
    $("#lab-whatif-result").innerHTML=
      '<div class="lab-feedback '+(predictionCorrect?"is-correct":"is-wrong")+'"><strong>'+(predictionCorrect?"✓ Tu predicción fue correcta.":"La ejecución muestra un efecto diferente.")+'</strong><p>Esperabas: '+esc(({same:"sin cambios",changes:"una salida distinta",error:"un error"})[whatIfPrediction])+'. Ocurrió: '+esc(({same:"la salida se mantuvo",changes:"la salida o el recorrido cambiaron",error:"la ejecución se detuvo por error"})[actualEffect])+'.</p></div>'+
      '<div class="lab-trace-compare-title"><span class="eyebrow">RECORRIDOS COMPARADOS</span><strong>La diferencia aparece donde las rutas dejan de coincidir.</strong></div>'+
      '<section class="lab-route-lane is-original"><header><span class="lab-route-dot"></span><strong>ORIGINAL · AZUL</strong><code>'+esc(beforeOutput)+'</code></header>'+track(beforeEvents,"is-original")+'</section>'+
      '<section class="lab-route-lane is-modified"><header><span class="lab-route-dot"></span><strong>MODIFICADO · ÁMBAR</strong><code>'+esc(afterOutput)+'</code></header>'+track(afterEvents,"is-modified")+'</section>'+
      '<div class="lab-first-divergence"><span class="eyebrow">'+(divergence<0?"SIN DIVERGENCIA":"PRIMER PUNTO DE DIVERGENCIA")+'</span><strong>Paso '+(divergence<0?"—":divergence+1)+'</strong><p>Original: '+esc(firstBefore)+'</p><p>Modificado: '+esc(firstAfter)+'</p><small>'+esc(explanation)+'</small></div>'+
      '<div class="lab-debug-summary"><div><span class="eyebrow">VARIABLES QUE CAMBIARON</span><code>'+esc(variableExplanation)+'</code></div>'+
      '<div><span class="eyebrow">RUTAS V / F</span><code>'+esc(originalBranches.join(" · ")||"Sin decisiones")+' → '+esc(changedBranches.join(" · ")||"Sin decisiones")+'</code></div>'+
      '<div><span class="eyebrow">ESTADO MODIFICADO</span><code>'+esc(status+(changed.error?": "+changed.error.message:""))+'</code></div></div>'+mixedAdvanceMarkup();
    bindMixedAdvance();
    $("#lab-whatif-run").disabled=true;
  });
}
function typeNameForLab(type){
  return ({input:"Entrada",assignment:"Proceso",output:"Salida",decision:"Decisión",branch:"Ruta","loop-init":"Inicio de ciclo","loop-condition":"Condición","loop-enter":"Vuelta","loop-update":"Avance","loop-exit":"Salida de ciclo","program-start":"Inicio","program-end":"Fin",error:"Error"})[type]??String(type??"Paso");
}

function actualInputValues(){
  return trace.execution.events.filter(event=>event.type==="input").map(event=>event.value);
}
function stableValues(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return JSON.stringify(value);
  return JSON.stringify(Object.keys(value).sort().map(key=>[key,value[key]]));
}
function renderFillGap(){
  if(!requireTrace())return;
  const challenge=buildGapChallenge(trace.exercise.id,trace.methodIndex,trace.source,seededAttempt());
  gapHints=0;
  if(!challenge){
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Este método no tiene una asignación que se pueda ocultar.</strong><p>Elige otro método o un ejercicio distinto.</p></div>';
    return;
  }
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">RETO '+(labAttempt+1)+' · MISMO EJERCICIO Y MISMA TRAZA</p><h4>Completa la expresión que falta.</h4>'+
    '<p class="lab-muted">La respuesta se comprobará ejecutando el pseudocódigo con los mismos datos de esta ejecución.</p>'+
    '<pre class="lab-snippet"><code>'+esc(challenge.maskedLines.join("\n"))+'</code></pre>'+
    '<label class="lab-editor-field"><span>EXPRESIÓN QUE FALTA EN '+esc(challenge.variable)+'</span><input id="lab-gap-answer" autocomplete="off" spellcheck="false"></label>'+
    '<div class="lab-task-actions"><button type="button" class="button button-secondary" id="lab-gap-hint">Pista</button><button type="button" class="button button-primary" id="lab-gap-check">Comprobar</button><button type="button" class="button button-secondary" id="lab-gap-surrender">Ver solución</button><button type="button" class="button button-secondary" id="lab-gap-new">Nuevo reto</button></div>'+
    '<div id="lab-gap-feedback" class="lab-feedback" role="status"></div></div>';
  $("#lab-gap-hint").addEventListener("click",()=>{
    const hints=[
      "Piensa qué valores necesita la variable para completar el cálculo.",
      "La expresión debe usar variables que ya existan en ese punto del programa.",
      "La expresión original es: "+challenge.answer
    ];
    $("#lab-gap-feedback").textContent=hints[Math.min(gapHints,hints.length-1)];
    gapHints=Math.min(3,gapHints+1);
  });
  $("#lab-gap-check").addEventListener("click",()=>{
    const answer=$("#lab-gap-answer").value.trim();
    if(!answer){$("#lab-gap-feedback").textContent="Escribe una expresión antes de comprobar.";return;}
    const candidate=[...challenge.lines];
    candidate[challenge.index]=challenge.variable+" = "+answer;
    let result;
    try{result=executePseudocode(candidate.join("|"),actualInputValues());}
    catch(error){result={ok:false,error:{message:error.message},outputs:[],variables:{}};}
    const sameOutputs=JSON.stringify(result.outputs)===JSON.stringify(trace.execution.outputs);
    const sameVariables=stableValues(result.variables)===stableValues(trace.execution.variables);
    const correct=Boolean(result.ok&&sameOutputs&&sameVariables);
    recordResult("fill-gap",correct,gapHints);
    const feedback=$("#lab-gap-feedback");
    feedback.innerHTML=(correct?"<strong>Correcto.</strong> ":"<strong>Aún no coincide.</strong> ")+
      (correct?"La ejecución conserva las mismas salidas y variables.":"Resultado obtenido: "+esc(JSON.stringify(result.outputs))+". Resultado esperado: "+esc(JSON.stringify(trace.execution.outputs))+".")+
      (result.error?"<p>"+esc(result.error.message)+"</p>":"")+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",correct);
    feedback.classList.toggle("is-wrong",!correct);
    bindMixedAdvance();
  });
  $("#lab-gap-surrender").addEventListener("click",()=>{
    recordResult("fill-gap",true,2);
    $("#lab-gap-answer").value=challenge.answer;
    const feedback=$("#lab-gap-feedback");
    feedback.innerHTML="<strong>Solución:</strong> "+esc(challenge.answer)+
      "<p>Esta expresión reproduce las salidas y variables de la traza original.</p>"+mixedAdvanceMarkup();
    bindMixedAdvance();
  });
  $("#lab-gap-new").addEventListener("click",()=>{labAttempt++;renderFillGap();});
}
function renderFollowArrow(){
  if(!requireTrace())return;
  const challenge=buildArrowChallenge(trace.execution.events,trace.index,trace.exercise.id,seededAttempt());
  if(!challenge){
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Ya no hay otra figura por recorrer.</strong><p>Vuelve al simulador y selecciona un paso anterior para seguir una ruta distinta.</p></div>';
    return;
  }
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">PASO ACTUAL · '+(trace.index+1)+' / '+trace.execution.events.length+'</p>'+
    '<h4>¿A qué figura llegará la ficha después?</h4>'+
    '<p class="lab-muted">Sigue la conexión que se ejecuta, no la figura que esté más cerca.</p>'+
    '<div class="lab-choice-list">'+challenge.options.map(option=>
      '<button type="button" class="lab-choice" data-arrow-node="'+esc(option.nodeId)+'">'+esc(option.label)+'</button>'
    ).join("")+'</div>'+
    '<div id="lab-arrow-feedback" class="lab-feedback" role="status"></div></div>';
  let arrowErrors=0,answered=false;
  $("#lab-task-content").querySelectorAll("[data-arrow-node]").forEach(button=>button.addEventListener("click",()=>{
    if(answered)return;
    const correct=String(button.dataset.arrowNode)===String(challenge.correct.nodeId);
    const feedback=$("#lab-arrow-feedback");
    if(!correct){
      arrowErrors++;
      if(arrowErrors===1){
        recordResult("follow-arrow",false);
        feedback.innerHTML='<strong>Casi.</strong> Sigue la línea que sale de la figura actual. <a href="#" class="text-link" data-arrow-hint>Ver lección sobre flujo</a>';feedback.classList.add("is-wrong");$("[data-arrow-hint]")?.addEventListener("click",event=>{event.preventDefault();document.dispatchEvent(new CustomEvent("traza:abrir-leccion",{detail:{id:"algorithm"}}));});return;
      }
    }
    recordResult("follow-arrow",true,correct?(arrowErrors?1:0):2);answered=true;
    $("#lab-task-content").querySelectorAll("[data-arrow-node]").forEach(item=>item.disabled=true);
    feedback.innerHTML=(correct?"<strong>✓ Correcto.</strong> ":"<strong>La ruta correcta queda revelada.</strong> ")+
      "<p>La siguiente instrucción real es: "+esc(challenge.next.sourceText||challenge.next.scene?.title||"Fin")+". "+
      esc(challenge.next.scene?.body??challenge.next.message??"")+"</p>"+
      '<button type="button" class="text-link" id="lab-arrow-inspect">Míralo correr</button>'+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",correct);
    feedback.classList.toggle("is-wrong",!correct);
    $("#lab-arrow-inspect")?.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("traza:jump-to-step",{detail:{index:challenge.next.step}})));
    bindMixedAdvance();
  }));
}
function renderActivity(){
  if(activity==="predict")renderPredict();
  else if(activity==="table")renderTable();
  else if(activity==="order")renderOrder();
  else if(activity==="symbol")renderSymbol();
  else if(activity==="error")renderError();
  else if(activity==="whatif")renderWhatIf();
  else if(activity==="fill-gap")renderFillGap();
  else if(activity==="follow-arrow")renderFollowArrow();
  else if(activity==="match")renderMatch();
  if(mixedActive){
    const progress=mixedResults.length+1;
    const streakMarkup=Array.from({length:5},(_,index)=>'<i class="'+(index<activityStreak?"is-lit":"")+'" aria-hidden="true"></i>').join("");
    const bar='<header class="lab-session-bar"><button type="button" class="text-link" data-lab-session-back>← Salir</button><strong>Reto '+progress+' de 5</strong><span class="lab-session-streak" aria-label="Racha de '+activityStreak+' aciertos">'+streakMarkup+'</span><button type="button" class="text-link" data-lab-session-hint>Pista</button></header><p class="lab-session-hint" id="lab-session-hint" role="status" hidden></p>';
    $("#lab-task-content")?.insertAdjacentHTML("afterbegin",bar);
    $("[data-lab-session-back]")?.addEventListener("click",returnToLabModes);
    $("[data-lab-session-hint]")?.addEventListener("click",()=>{
      const hint=$("#lab-session-hint");hint.hidden=false;
      hint.textContent="Pista: "+(activity==="table"?"lee el cambio de la variable en el snapshot.":activity==="order"?"ubica primero el inicio y el fin del algoritmo.":activity==="match"?"relaciona la acción con la forma que la representa.":activity==="error"?"compara el resultado observado con el resultado esperado.":activity==="whatif"?"observa el primer evento donde las dos trazas se separan.":"sigue el paso activo y revisa la explicación del Simulador.");
    });
  }
}
export function initLab(){
  originalLabCatalogMarkup=$("#lab-mode-cards")?.innerHTML??null;
  renderLabTopicHome();setLabCatalogControls(false);
  $("#lab-topic-home")?.addEventListener("click",event=>{const card=event.target.closest("[data-lab-topic]");if(card)openLabTopic(card.dataset.labTopic);});
  $("#lab-topic-back")?.addEventListener("click",()=>{activeLabTopic=null;$("#lab-topic-home").hidden=false;setLabCatalogControls(false);renderLabTopicHome();});
  $("#lab-filter-concepts")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lab-filter-concept]");if(!button)return;
    catalogConcept=button.dataset.labFilterConcept;renderCatalogFilters();
  });
  $("#lab-filter-difficulty")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lab-filter-level]");if(!button)return;
    const level=Number(button.dataset.labFilterLevel);
    catalogDifficulties.has(level)?catalogDifficulties.delete(level):catalogDifficulties.add(level);
    renderCatalogFilters();
  });
  $("#lab-filter-clear")?.addEventListener("click",clearCatalogFilters);
  $("#lab-mode-cards")?.addEventListener("click",event=>{
    const sourceButton=event.target.closest("[data-lab-source-mechanic]");
    if(sourceButton){startSourceLab(sourceButton.dataset.labSourceMechanic);return;}
    const mathButton=event.target.closest("[data-lab-math-mechanic]");
    if(mathButton){startMathLab(currentTopicId(),mathButton.dataset.labMathMechanic,catalogDifficulties.size===1?[...catalogDifficulties][0]:selectedDifficulty);return;}
    const button=event.target.closest("[data-lab-mode][data-lab-activity]");
    if(button)openPrepareDialog(button.dataset.labActivity);
  });
  $("#lab-prepare-concepts")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-prepare-concept]");if(!button)return;
    selectedConcept=button.dataset.prepareConcept;
    $("#lab-prepare-concepts").querySelectorAll("[data-prepare-concept]").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
  });
  $("#lab-prepare-levels")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-prepare-level]");if(!button)return;
    selectedDifficulty=Number(button.dataset.prepareLevel);
    $("#lab-prepare-levels").querySelectorAll("[data-prepare-level]").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
  });
  $("#lab-prepare-play")?.addEventListener("click",()=>{$("#lab-prepare-dialog")?.close();openSelectedActivity();});
  $("#lab-back-to-modes")?.addEventListener("click",returnToLabModes);
  $("#lab-activity-list")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lab-activity]");
    if(button)setActivity(button.dataset.labActivity);
  });
  $("#lab-open-builder")?.addEventListener("click",()=>{
    if(!requireTrace())return;
    if($("#lab-practice-workspace"))$("#lab-practice-workspace").hidden=true;
    if($("#lab-builder-stage"))$("#lab-builder-stage").hidden=false;
    document.dispatchEvent(new CustomEvent("traza:lab-builder-open"));
  });
  $("#lab-builder-back")?.addEventListener("click",()=>{
    if($("#lab-builder-stage"))$("#lab-builder-stage").hidden=true;
    if($("#lab-practice-workspace"))$("#lab-practice-workspace").hidden=false;
  });
  $("#lab-open-simulator")?.addEventListener("click",()=>document.querySelector('#primary-nav [data-space="simulator"]')?.click());
  document.addEventListener("traza:execution-updated",event=>publishContext(event.detail));
  document.addEventListener("traza:space-change",event=>{if(event.detail?.space==="lab"){if(activeLabTopic)renderCatalogFilters();else{renderLabTopicHome();setLabCatalogControls(false);}}});
  document.addEventListener("traza:lab-builder-result",event=>{
    if(!trace||activity!=="build-diagram")return;
    const result=event.detail??{};
    const correct=Boolean(result.ok&&JSON.stringify(result.outputs??[])===JSON.stringify(trace.execution.outputs??[])&&stableValues(result.variables??{})===stableValues(trace.execution.variables??{}));
    recordResult("build-diagram",correct);
    const message=$("#builder-runtime-message");
    if(message)message.textContent=correct?"✓ El diagrama produce las mismas salidas y variables que la traza de referencia.":"El diagrama se ejecuta, pero sus salidas o variables todavía no coinciden con la referencia.";
    if(mixedActive&&message){const next=document.createElement("button");next.type="button";next.id="lab-next-mixed";next.className="button button-secondary";next.textContent=mixedQueue.length?"Siguiente reto":"Ver resultado";message.append(" ",next);bindMixedAdvance();}
  });
  addMixedPracticeButton();
  document.dispatchEvent(new CustomEvent("traza:lab-sync-request"));
  updateProgressBadges();
}
