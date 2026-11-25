import { competenciasAprende, temas } from "../content/temas.js";
import { exercises } from "../content/exercises.js";
import { sourceExercises } from "../content/source-exercises.js";
import { mathExercises, mathExerciseById } from "../math/exercises.js";

const $=(selector,root=document)=>root.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const levelLabels={basic:"Básico",intermediate:"Intermedio",advanced:"Avanzado",expert:"Reto"};
let selectedCompetence=null,selectedTheme=null,stageBeforeEntry=new Map(),enterAfterNavigation=false,launchingFromEntry=false;

function exerciseItems(theme){
  if(theme.id==="diagramas-flujo")return exercises.map(item=>({id:item.id,title:item.title,level:levelLabels[item.level]??item.level,kind:"flow",item}));
  if(theme.id==="fuentes-informacion")return sourceExercises.map(item=>({id:item.id,title:item.title,level:["Básico","Intermedio","Avanzado","Reto"][item.level-1],kind:"source",item}));
  return mathExercises.filter(item=>item.topic===theme.id).map(item=>({id:item.id,title:item.title,level:["Básico","Intermedio","Avanzado","Reto"][item.difficulty-1],kind:"math",item}));
}
function renderCompetences(host){
  selectedTheme=null;selectedCompetence=null;
  host.dataset.entryStep="competence";
  host.innerHTML='<header class="simulator-entry-heading"><p class="eyebrow">PASO 1 DE 3</p><h3 tabindex="-1">Elige una competencia</h3><p>Empieza por el área que quieres practicar.</p></header><div class="simulator-entry-grid">'+competenciasAprende.map(item=>'<button type="button" class="simulator-entry-card" data-sim-competence="'+esc(item.id)+'" style="--entry-color:var(--competence-'+esc(item.token)+'-solid)"><span class="competence-marker" aria-hidden="true"></span><strong>'+esc(item.titulo)+'</strong><small>'+esc(item.tipo==="transversal"?"Transversal":"Competencia")+'</small></button>').join("")+'</div>';
}
function renderThemes(host,competenceId){
  const competence=competenciasAprende.find(item=>item.id===competenceId);if(!competence)return renderCompetences(host);
  selectedCompetence=competenceId;selectedTheme=null;host.dataset.entryStep="theme";
  const items=temas.filter(theme=>theme.competenciaId===competenceId);
  host.innerHTML='<button type="button" class="simulator-entry-back" data-sim-back>‹ Competencias</button><header class="simulator-entry-heading"><p class="eyebrow">PASO 2 DE 3 · '+esc(competence.titulo.toLocaleUpperCase("es"))+'</p><h3 tabindex="-1">Elige un tema</h3></header><div class="simulator-entry-grid">'+(items.map(theme=>{const count=exerciseItems(theme).length;return '<button type="button" class="simulator-entry-card" data-sim-theme="'+esc(theme.id)+'" style="--entry-color:var(--competence-'+esc(competence.token)+'-solid)" '+(count?'':'disabled aria-disabled="true"')+'><span class="simulator-entry-icon" aria-hidden="true">'+esc(theme.icono)+'</span><strong>'+esc(theme.titulo)+'</strong><small>'+(count?count+' ejercicios':'Próximamente')+'</small></button>';}).join("")||'<p>Próximamente</p>')+'</div>';
}
function renderExercises(host,themeId){
  const theme=temas.find(item=>item.id===themeId);if(!theme)return renderThemes(host,selectedCompetence);
  selectedTheme=themeId;host.dataset.entryStep="exercise";
  const competence=competenciasAprende.find(item=>item.id===theme.competenciaId),items=exerciseItems(theme);
  host.innerHTML='<button type="button" class="simulator-entry-back" data-sim-back>‹ Temas</button><header class="simulator-entry-heading"><p class="eyebrow">PASO 3 DE 3 · '+esc(competence?.titulo??"SIMULADOR")+'</p><h3 tabindex="-1">'+esc(theme.titulo)+'</h3><p>Elige un ejercicio para abrir su reproductor.</p></header><div class="simulator-entry-exercises" role="list">'+items.map((item,index)=>'<button type="button" class="simulator-entry-exercise" data-sim-exercise="'+esc(item.id)+'" data-sim-kind="'+item.kind+'" role="listitem"><span class="exercise-number">'+String(index+1).padStart(2,"0")+'</span><strong>'+esc(item.title)+'</strong><span class="exercise-level">'+esc(item.level)+'</span></button>').join("")+'</div>';
}
function restoreSimulatorStage(){
  const entry=$("#simulator-entry");if(!entry)return;
  entry.hidden=true;
  for(const [element,wasHidden] of stageBeforeEntry)element.hidden=wasHidden;
  stageBeforeEntry.clear();
}
function showSimulatorEntry(){
  const entry=$("#simulator-entry"),view=$("#view-simulator");if(!entry||!view)return;
  document.dispatchEvent(new CustomEvent("senapsis:close-source-simulator"));
  document.dispatchEvent(new CustomEvent("senapsis:close-math-player"));
  if(!stageBeforeEntry.size){for(const element of view.children){if(element===entry||element.classList.contains("simulator-statusbar"))continue;stageBeforeEntry.set(element,element.hidden);element.hidden=true;}}
  renderCompetences(entry);entry.hidden=false;
  const intro=$("#simulator-intro");if(intro?.open)intro.close();
  $("h3",entry)?.focus({preventScroll:true});
}
function launchExercise(button){
  const kind=button.dataset.simKind,id=button.dataset.simExercise;
  const theme=temas.find(item=>item.id===selectedTheme);if(!theme)return;
  const item=exerciseItems(theme).find(exercise=>String(exercise.id)===id);if(!item)return;
  restoreSimulatorStage();
  launchingFromEntry=true;
  try{
    if(kind==="flow")document.dispatchEvent(new CustomEvent("senapsis:request-simulation",{detail:{exerciseId:item.item.id,methodIndex:0}}));
    else if(kind==="source")document.dispatchEvent(new CustomEvent("senapsis:open-source-simulator",{detail:{scenarioId:item.item.scenario}}));
    else if(kind==="math"){
      const exercise=mathExerciseById(item.item.id)??item.item;
      document.dispatchEvent(new CustomEvent("senapsis:open-math-player",{detail:{exerciseId:exercise.id,exercise}}));
    }
  }finally{launchingFromEntry=false;}
  requestAnimationFrame(()=>{
    const target=kind==="flow"?($("#simulator-intro")?.open?$("#simulator-reveal"):$("#flow-diagram-container")):kind==="source"?$("#source-simulator button"):$("#math-player button");
    target?.focus({preventScroll:true});
  });
}
export function initSimulatorEntry(){
  const host=$("#simulator-entry");if(!host)return;
  host.addEventListener("click",event=>{
    const competence=event.target.closest("[data-sim-competence]");if(competence){renderThemes(host,competence.dataset.simCompetence);$("h3",host)?.focus({preventScroll:true});return;}
    const theme=event.target.closest("[data-sim-theme]");if(theme){renderExercises(host,theme.dataset.simTheme);$("h3",host)?.focus({preventScroll:true});return;}
    const back=event.target.closest("[data-sim-back]");if(back){if(host.dataset.entryStep==="exercise")renderThemes(host,selectedCompetence);else renderCompetences(host);$("h3",host)?.focus({preventScroll:true});return;}
    const exercise=event.target.closest("[data-sim-exercise]");if(exercise)launchExercise(exercise);
  });
  const markDeepLaunch=()=>{if(!launchingFromEntry)enterAfterNavigation=true;};
  document.addEventListener("senapsis:request-simulation",()=>{markDeepLaunch();document.dispatchEvent(new CustomEvent("senapsis:close-source-simulator"));document.dispatchEvent(new CustomEvent("senapsis:close-math-player"));});
  document.addEventListener("senapsis:open-source-simulator",()=>{markDeepLaunch();document.dispatchEvent(new CustomEvent("senapsis:close-source-simulator"));document.dispatchEvent(new CustomEvent("senapsis:close-math-player"));});
  document.addEventListener("senapsis:open-math-player",()=>{markDeepLaunch();document.dispatchEvent(new CustomEvent("senapsis:close-source-simulator"));document.dispatchEvent(new CustomEvent("senapsis:close-math-player"));});
  document.addEventListener("senapsis:space-change",event=>{
    if(event.detail?.space!=="simulator")return;
    requestAnimationFrame(()=>{
      if(enterAfterNavigation){enterAfterNavigation=false;restoreSimulatorStage();return;}
      showSimulatorEntry();
    });
  });
}
