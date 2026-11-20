import {sourceScenarios,sourceTypes,sourceCoverage,validateSourceScenarios} from "../content/source-scenarios.js";
import {createClock} from "./kit/clock.js";
import {createSimulatorShell} from "./simulator-shell.js";
import {classificationTemplate} from "./templates/classification.js";
import {renderClassificationScene} from "./scenes/classification.js";

const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const root=()=>document.querySelector("#source-simulator");
let scenario=sourceScenarios[0],step=0,timeline=null,timer=0,playing=false,clock=null,lastFrame=null,predict=null,hiddenBefore=new Map(),originalTitle="",originalStatus="";
let textScale=1,camera=true;
const STEP_DURATION=1100;

function sourceAt(index=step){return scenario.sources[Math.max(0,Math.min(index,scenario.sources.length-1))];}
function progressAt(){
  const seen=new Set(scenario.sources.slice(0,step+1).map(source=>source.id));
  const requirements=scenario.requirements.filter(item=>seen.has(item.sourceId));
  const areas=scenario.areas.map(area=>{
    const known=requirements.filter(item=>area.requirementIds.includes(item.id));
    const primary=known.some(item=>scenario.sources.find(source=>source.id===item.sourceId)?.type==="P");
    return {...area,covered:known.length>0,primaryVerified:primary,known};
  });
  return {areas,coveredAreas:areas.filter(area=>area.covered).length,primaryVerified:areas.filter(area=>area.primaryVerified).length,totalAreas:areas.length,needsPrimary:areas.filter(area=>area.covered&&!area.primaryVerified).length};
}
function badge(type){return '<span class="source-type-badge source-badge-'+type+'" aria-label="Fuente '+sourceTypes[type].name+'"><b aria-hidden="true">'+type+'</b></span>';}

function predictMarkup(source){
  if(!predict?.open)return "";
  if(predict.part>=2)return '<aside class="source-sim-predict" aria-live="polite"><button type="button" class="source-sim-predict-close" data-source-predict-close aria-label="Cerrar Predice">×</button><p class="eyebrow">PREDICE · COMPLETADO</p><h3>Las dos respuestas están correctas</h3><p class="source-sim-feedback">Contrasta de dónde viene el dato, qué requisito sostiene y qué límite debes registrar.</p></aside>';
  const requirement=source.requirementIds.map(id=>scenario.requirements.find(item=>item.id===id)).find(Boolean);
  let prompt,options,correct;
  if(predict.part===0){prompt="¿Qué tipo de fuente es?";options=["P · Primaria","S · Secundaria","T · Terciaria"];correct=source.type;}
  else{
    prompt="¿Qué requisito sale de esta fuente?";
    const distractors=scenario.requirements.filter(item=>item.sourceId!==source.id).slice(0,3).map(item=>item.text);
    options=requirement?[requirement.text,...distractors].slice(0,4):["Sin requisito directo: aporta vocabulario o referencias",...distractors].slice(0,4);
    correct=requirement?.text??"Sin requisito directo: aporta vocabulario o referencias";
  }
  return '<aside class="source-sim-predict" aria-live="polite"><button type="button" class="source-sim-predict-close" data-source-predict-close aria-label="Cerrar Predice">×</button><p class="eyebrow">PREDICE · PREGUNTA '+(predict.part+1)+' DE 2</p><h3>'+esc(prompt)+'</h3><div class="source-sim-predict-options">'+options.map((option,index)=>'<button type="button" data-source-predict-answer="'+esc(predict.part===0?option[0]:option)+'" data-source-predict-correct="'+String(predict.part===0?source.type===option[0]:correct===option)+'">'+esc(option)+'</button>').join("")+'</div><p class="source-sim-feedback" role="status">'+esc(predict.feedback??"")+'</p></aside>';
}

function render(){
  const host=root();if(!host||!scenario)return;
  const stepData=timeline?.current,source=stepData?.escena.datos.source??sourceAt(),coverage=progressAt();
  const seenSourceIds=new Set(scenario.sources.slice(0,step+1).map(item=>item.id));
  const requirements=scenario.requirements.map(item=>{
    const evidence=scenario.sources.find(entry=>entry.id===item.sourceId),seen=seenSourceIds.has(item.sourceId);
    return '<li class="source-sim-requirement '+(seen?"is-known":"is-pending")+' '+(seen&&evidence.type!=="P"?"is-unverified":"")+'"><b>'+esc(item.id)+'</b><span>'+esc(item.text)+'</span>'+badge(evidence.type)+'<small>'+esc(seen?evidence.title:"Esperando fuente")+'</small></li>';
  }).join("");
  const areaRows=coverage.areas.map(area=>'<li class="'+(area.covered?(area.primaryVerified?"is-primary-verified":"is-unverified") : "is-pending")+'"><span class="source-sim-area-icon" aria-hidden="true">'+(area.primaryVerified?"✓":area.covered?"⚠":"○")+'</span><span>'+esc(area.title)+'</span><b>'+ (area.primaryVerified?"Verificada con P":area.covered?"Por verificar con una fuente primaria":"Sin evidencia aún")+'</b></li>').join("");
  const lanes=["P","S","T"].map(type=>'<section class="source-sim-lane source-sim-lane-'+type+'"><header>'+badge(type)+'<strong>'+sourceTypes[type].name+'</strong></header><div>'+scenario.sources.filter(item=>item.type===type).map(item=>'<button type="button" data-source-sim-select="'+esc(item.id)+'" class="source-sim-source '+(item.id===source.id?"is-current":"")+'" aria-current="'+String(item.id===source.id)+'"><span>'+esc(item.title)+'</span><small>'+item.hops+' salto'+(item.hops===1?"":"s")+'</small></button>').join("")+'</div></section>').join("");
  const classificationScene=renderClassificationScene(stepData?.escena);
  const final=step===scenario.sources.length-1?sourceCoverage(scenario):null;
  host.innerHTML=`<header class="source-sim-toolbar"><div><p class="eyebrow">MESA DE RECOLECCIÓN</p><h2>${esc(scenario.title)}</h2><p>${esc(scenario.description)}</p></div><div class="source-sim-toolbar-actions"><label>Escenario<select data-source-sim-scenario>${sourceScenarios.map(item=>`<option value="${esc(item.id)}"${item.id===scenario.id?" selected":""}>${esc(item.title)}</option>`).join("")}</select></label><button type="button" class="button button-secondary" data-source-sim-exit>‹ Volver</button></div></header>
    <div class="source-sim-controls"><button type="button" data-source-sim-first aria-label="Ir al primer paso" ${step===0?"disabled":""}>|‹</button><button type="button" data-source-sim-prev aria-label="Paso anterior" ${step===0?"disabled":""}>← Anterior</button><button type="button" data-source-sim-play aria-pressed="${String(playing)}" ${step>=scenario.sources.length-1?"disabled":""}>${playing?"Ⅱ Pausar":"▶ Reproducir"}</button><button type="button" data-source-sim-next aria-label="Paso siguiente" ${step>=scenario.sources.length-1?"disabled":""}>Siguiente →</button><button type="button" data-source-sim-last aria-label="Ir al último paso" ${step>=scenario.sources.length-1?"disabled":""}>›|</button><label class="source-sim-scrubber"><span>Paso ${step+1} de ${scenario.sources.length}</span><input type="range" min="0" max="${scenario.sources.length-1}" value="${step}" data-source-sim-range aria-label="Recorrido de fuentes"></label><button type="button" data-source-sim-predict aria-pressed="${String(Boolean(predict?.open))}">🎯 Predice</button><button type="button" data-source-sim-camera aria-pressed="${String(camera)}">◎ ${camera?"Cámara automática":"Centrar fuente"}</button><button type="button" data-source-sim-focus aria-pressed="${String(host.classList.contains("is-concentrated"))}">⛶ Concentración</button><span class="source-sim-text-controls" aria-label="Tamaño del texto"><button type="button" data-source-sim-text="-1" aria-label="Reducir texto">A−</button><button type="button" data-source-sim-text="0" aria-label="Restablecer texto">A</button><button type="button" data-source-sim-text="1" aria-label="Aumentar texto">A+</button></span></div>
    <div class="source-sim-workspace" style="--source-sim-scale:${textScale}"><aside class="source-sim-lanes" aria-label="Carriles de fuentes">${lanes}</aside><main class="source-sim-center"><header><span>PASO ${String(step+1).padStart(2,"0")} / ${scenario.sources.length}</span><h3>${esc(source.title)}</h3></header>${classificationScene}</main><aside class="source-sim-sheet"><header><p class="eyebrow">HOJA DE REQUISITOS</p><h3>Trazabilidad</h3><span>${coverage.coveredAreas} de ${coverage.totalAreas} áreas cubiertas · ${coverage.primaryVerified} verificadas con P</span></header><ol>${requirements}</ol><section class="source-sim-areas"><h4>Cobertura por área</h4><ul>${areaRows}</ul></section>${final?`<section class="source-sim-completion"><b>Cobertura final</b><span>${final.coveredAreas}/${final.totalAreas} áreas cubiertas · ${final.primaryVerified}/${final.totalAreas} verificadas con fuente primaria</span>${final.needsPrimary?`<strong>⚠ ${final.needsPrimary} áreas: Por verificar con una fuente primaria</strong>`:"<strong>✓ Todas las áreas cuentan con evidencia primaria</strong>"}</section>`:""}</aside></div>${predictMarkup(source)}`;
  const status=document.querySelector("#simulator-status");if(status)status.textContent="FUENTE "+String(step+1).padStart(2,"0")+" DE "+scenario.sources.length+" · "+sourceTypes[source.type].name.toLocaleUpperCase("es");
}

function seek(next){timeline.seek(next);step=timeline.index;render();if(camera)document.querySelector(".source-sim-source.is-current")?.scrollIntoView({block:"nearest",inline:"nearest"});}
function stop(){if(timer)cancelAnimationFrame(timer);timer=0;lastFrame=null;playing=false;clock?.pause();}
function play(){
  if(playing){stop();render();return;}
  if(matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.motion==="reduced")return;
  if(step>=scenario.sources.length-1){timeline.first();step=timeline.index;}
  clock=createClock({duration:scenario.sources.length*STEP_DURATION});clock.seek(step*STEP_DURATION);clock.play();playing=true;render();
  const frame=timestamp=>{
    if(!playing||!clock)return;
    if(lastFrame!==null){clock.advance(Math.min(100,Math.max(0,timestamp-lastFrame)));const next=Math.min(scenario.sources.length-1,Math.floor(clock.time/STEP_DURATION));if(next!==step){timeline.seek(next);step=timeline.index;render();}}
    lastFrame=timestamp;
    if(clock.playing)timer=requestAnimationFrame(frame);else{playing=false;timer=0;lastFrame=null;timeline.last();step=timeline.index;render();}
  };
  timer=requestAnimationFrame(frame);
}
function close(){
  const host=root();if(!host||host.hidden)return;
  stop();predict=null;
  host.hidden=true;host.classList.remove("is-concentrated");
  for(const [element,state] of hiddenBefore){element.hidden=state.hidden;if(state.display)element.style.setProperty("display",state.display,state.priority);else element.style.removeProperty("display");}hiddenBefore.clear();
  const title=document.querySelector("#simulator-title"),status=document.querySelector("#simulator-status");if(title)title.textContent=originalTitle;if(status)status.textContent=originalStatus;
}
function open(scenarioId){
  stop();scenario=sourceScenarios.find(item=>item.id===scenarioId)??sourceScenarios[0];timeline=createSimulatorShell(classificationTemplate,scenario,scenario);step=timeline.index;predict=null;clock=null;
  const host=root();if(!host)return;
  for(const selector of ["#math-player",".simulator-mobile-tabs",".simulator-grid"]){const element=document.querySelector(selector);if(element){hiddenBefore.set(element,{hidden:element.hidden,display:element.style.getPropertyValue("display"),priority:element.style.getPropertyPriority("display")});element.hidden=true;element.style.setProperty("display","none","important");}}
  const title=document.querySelector("#simulator-title"),status=document.querySelector("#simulator-status");
  if(title){originalTitle=title.textContent;title.textContent="Mesa de recolección · fuentes y evidencia";}
  if(status)originalStatus=status.textContent;
  host.hidden=false;render();
}

export function initSourceSimulator(){
  if(!root())return;
  const errors=validateSourceScenarios();if(errors.length)console.error("Escenarios de fuentes inválidos:",errors);
  document.addEventListener("traza:open-source-simulator",event=>open(event.detail?.scenarioId));
  document.addEventListener("traza:close-source-simulator",close);
  root().addEventListener("click",event=>{
    const button=event.target.closest("button");if(!button)return;
    if(button.matches("[data-source-sim-exit]")){close();document.querySelector('#primary-nav [data-space="learn"]')?.click();return;}
    if(button.matches("[data-source-sim-first]")){stop();seek(0);return;}
    if(button.matches("[data-source-sim-last]")){stop();seek(scenario.sources.length-1);return;}
    if(button.matches("[data-source-sim-prev]")){stop();seek(step-1);return;}
    if(button.matches("[data-source-sim-next]")){stop();seek(step+1);return;}
    if(button.matches("[data-source-sim-play]")){play();return;}
    if(button.matches("[data-source-sim-predict]")){predict={open:!predict?.open,part:0,feedback:""};render();return;}
    if(button.matches("[data-source-predict-close]")){predict=null;render();return;}
    if(button.matches("[data-source-predict-answer]")){
      const correct=button.dataset.sourcePredictCorrect==="true";
      if(!correct){predict.feedback="Aún no. Revisa el recorrido y la evidencia; intenta otra vez.";render();return;}
      if(predict.part===0){predict.part=1;predict.feedback="Correcto. Ahora relaciona la fuente con lo que aporta.";render();return;}
      predict.feedback="¡Correcto! La justificación está en la ficha de aporte y límites.";predict.part=2;render();return;
    }
    if(button.matches("[data-source-sim-camera]")){camera=!camera;render();if(camera)document.querySelector(".source-sim-source.is-current")?.scrollIntoView({block:"nearest",inline:"nearest"});return;}
    if(button.matches("[data-source-sim-focus]")){root().classList.toggle("is-concentrated");render();return;}
    if(button.matches("[data-source-sim-text]")){textScale=button.dataset.sourceSimText==="0"?1:Math.max(.85,Math.min(1.25,textScale+Number(button.dataset.sourceSimText)*.1));render();return;}
    const sourceButton=button.closest("[data-source-sim-select]");if(sourceButton){stop();seek(scenario.sources.findIndex(item=>item.id===sourceButton.dataset.sourceSimSelect));}
  });
  root().addEventListener("change",event=>{
    if(event.target.matches("[data-source-sim-scenario]")){stop();scenario=sourceScenarios.find(item=>item.id===event.target.value)??sourceScenarios[0];timeline=createSimulatorShell(classificationTemplate,scenario,scenario);step=timeline.index;clock=null;predict=null;render();}
    if(event.target.matches("[data-source-sim-range]")){stop();seek(Number(event.target.value));}
  });
  root().addEventListener("keydown",event=>{
    if(event.target.matches("input,select,button"))return;
    if(event.code==="ArrowRight"){event.preventDefault();stop();seek(step+1);}
    if(event.code==="ArrowLeft"){event.preventDefault();stop();seek(step-1);}
    if(event.code==="Space"){event.preventDefault();play();}
  });
}
