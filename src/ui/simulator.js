import { exercises, getExercise } from "../content/exercises.js";
import { traceExpression } from "../core/expression.js";
import { executePseudocode, createTimeline } from "../core/interpreter.js";
import { parsePseudocode } from "../core/parser.js";
import { layoutFlow } from "../diagram/layout.js";
import { renderDiagram, highlightDiagram } from "../diagram/renderer.js";
import { renderScene } from "./scenes/index.js";
import { variableTone } from "./variable-tone.js";

const $ = s => document.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = value => typeof value==="number" ? String(Number(value.toFixed(6))) : String(value);
const labels = {basic:"Básico",intermediate:"Intermedio",advanced:"Avanzado",expert:"Experto"};
let exerciseId=1, methodIndex=0, exercise=null, execution=null, timeline=null, diagram=null, timer=null;
let cameraAuto=true, cameraReady=false, panState=null, pseudocodeSize=17, selectedVariable=null, defaultInputSample=[];
let diagramFitWidth=0, diagramFitHeight=0, fitScale=1, zoom=1, panOffset={x:0,y:0};
let cameraRaf=0, pointerState=new Map(), pinchState=null;
let predictEnabled=false,predictionPending=null,predictionResume=false,predictionCorrect=0,predictionAttempts=0;
let focusIdleTimer=0;
let routeGraph=new Map(), routeWeights=new Map(), routeCache=new Map(), tokenRaf=0;

function readPseudocodeSize(){
  try{
    const value=Number(window.localStorage.getItem("traza:v2:pseudocode-size")??window.localStorage.getItem("traza-pseudocode-size"));
    return Number.isFinite(value)&&value>=13&&value<=26?value:17;
  }catch{return 17;}
}


function stop(){
  if(timer!==null){clearTimeout(timer);timer=null;}
  cancelChoreography();
  const b=$("#simulator-play");
  if(b){b.textContent="▶";b.title="Reproducir";b.setAttribute("aria-label","Reproducir");}
}
function method(){return exercise?.methods[methodIndex]??null;}


const WINDOW_META=[
  {id:"context",label:"Problema",selector:"#sim-window-context"},
  {id:"pseudocode",label:"Pseudocódigo",selector:"#sim-window-code"},
  {id:"scene",label:"En escena",selector:"#PV"},
  {id:"variables",label:"Variables",selector:"#PR"}
];
const hiddenWindows=new Set();
let dismissedVfStep=-1,vfRaf=0,contextTimer=0;
function getWindowElement(id){
  const meta=WINDOW_META.find(item=>item.id===id);
  return meta?document.querySelector(meta.selector):null;
}
function persistWindowState(){
  try{localStorage.setItem("traza:v3:windows",JSON.stringify([...hiddenWindows]));}catch{}
}
function loadWindowState(){
  try{
    const saved=JSON.parse(localStorage.getItem("traza:v3:windows")||"[]");
    if(Array.isArray(saved))saved.filter(id=>WINDOW_META.some(item=>item.id===id)).forEach(id=>hiddenWindows.add(id));
  }catch{}
}
function applyWindowState(){
  for(const meta of WINDOW_META){
    const element=getWindowElement(meta.id);
    if(element)element.hidden=hiddenWindows.has(meta.id);
    const toggle=document.querySelector('[data-window-toggle="'+meta.id+'"]');
    if(toggle)toggle.checked=!hiddenWindows.has(meta.id);
  }
  document.body.dataset.simWindowsHidden=[...hiddenWindows].join(" ");
}
function setWindowVisible(id,visible){
  if(!WINDOW_META.some(item=>item.id===id))return;
  if(visible)hiddenWindows.delete(id);else hiddenWindows.add(id);
  persistWindowState();applyWindowState();
}
function bindWindows(){
  loadWindowState();applyWindowState();
  document.querySelectorAll("[data-window-toggle]").forEach(toggle=>{
    toggle.addEventListener("change",()=>setWindowVisible(toggle.dataset.windowToggle,toggle.checked));
  });
  document.querySelector("[data-hide-all-windows]")?.addEventListener("click",()=>{
    for(const meta of WINDOW_META)hiddenWindows.add(meta.id);
    persistWindowState();applyWindowState();
  });
  window.addEventListener("resize",()=>{applyWindowState();if(timeline&&$("#vf")&&!$("#vf").hidden)requestAnimationFrame(()=>placeContextWindow(timeline.current));});
}
function rectIntersects(a,b,gap=0){
  return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
}
function contextWindowMarkup(event){
  const name=event.change?.name??"Variable";
  if(event.type==="input")return {
    title:"Entra un dato",
    body:'<div class="sim-vf-flow"><span class="sim-vf-chip">'+esc(fmt(event.value??event.change?.value))+'</span><span>↓</span><b>'+esc(name)+'</b></div><p>El siguiente valor de entrada se guarda en la variable '+esc(name)+'.</p>'
  };
  if(["assignment","loop-init","loop-update"].includes(event.type)&&event.change){
    return {
      title:"La variable cambia",
      body:'<div class="sim-vf-flow">'+(event.change.previous===undefined?"":'<s>'+esc(fmt(event.change.previous))+'</s><span>→</span>')+'<b>'+esc(name)+'</b><strong>'+esc(fmt(event.change.value))+'</strong></div><p>'+esc(brief(event))+'</p>'
    };
  }
  if(event.type==="decision"||event.type==="loop-condition"||event.type==="branch"){
    return {
      title:event.type==="decision"?"Decisión":"Condición del ciclo",
      body:'<p class="sim-vf-condition">'+esc(substituteValues(event.condition??event.sourceText,event.variables))+'</p><strong class="sim-vf-result '+(event.result?"is-true":"is-false")+'">'+(event.result?"V · VERDADERA":"F · FALSA")+'</strong><p>'+(event.result?"Se sigue la rama verdadera.":"Se sigue la rama falsa.")+'</p>'
    };
  }
  if(event.type==="output")return {title:"Sale en pantalla",body:'<div class="sim-vf-output">'+esc(fmt(event.value))+'</div><p>El resultado aparece en Pantalla.</p>'};
  if(event.type==="program-end")return {title:"Algoritmo finalizado",body:'<p>El recorrido terminó. Las variables y la pantalla conservan el estado final.</p>'};
  return {title:"Paso activo",body:'<p>'+esc(brief(event))+'</p>'};
}
function diagramNodeForEvent(event){
  if(!diagram||!event)return null;
  if(event.type==="program-start")return diagram.byId.get(String(diagram.startId))??null;
  if(event.type==="program-end")return diagram.byId.get(String(diagram.endId))??null;
  const sourceId=event.nodeId===null||event.nodeId===undefined?null:String(event.nodeId);
  return diagram.nodes.find(node=>sourceId!==null&&String(node.sourceId)===sourceId)
    ??diagram.nodes.find(node=>event.sourceLine!==null&&event.sourceLine!==undefined&&Number(node.line)===Number(event.sourceLine))
    ??null;
}
function drawContextWire(fromRect,toRect){
  const wire=$("#vf-wire"),path=$("#vf-wire-path");
  if(!wire||!path||!fromRect||!toRect){if(wire)wire.hidden=true;return;}
  const sx=fromRect.left+fromRect.width/2,sy=fromRect.top+fromRect.height/2;
  const tx=toRect.left>sx?toRect.left:toRect.right;
  const ty=Math.max(toRect.top+14,Math.min(toRect.bottom-14,sy));
  const bend=(tx-sx)*.45;
  path.setAttribute("d","M "+sx+" "+sy+" C "+(sx+bend)+" "+sy+" "+(tx-bend)+" "+ty+" "+tx+" "+ty);
  wire.hidden=false;
}
function hideContextWire(){
  const wire=$("#vf-wire");
  if(wire)wire.hidden=true;
}
function placeContextWindow(event){
  const box=$("#vf"),requestedModel=diagramNodeForEvent(event);
  const highlighted=document.querySelector("#flow-svg .diagram-node.is-active");
  const highlightedId=highlighted?.id.replace("flow-node-","");
  const model=(highlightedId&&diagram?.byId.get(highlightedId))??requestedModel;
  const node=highlighted??(model?document.getElementById("flow-node-"+model.id):null);
  const stage=$("#diagram-stage");
  if(!box||!stage||!event)return;
  const nodeRect=node?.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
  const width=box.offsetWidth||286,height=box.offsetHeight||130,gap=16,margin=12;
  const workspace={
    left:Math.max(stageRect.left+margin,margin),top:Math.max(stageRect.top+margin,margin),
    right:Math.min(stageRect.right-margin,innerWidth-margin),bottom:Math.min(stageRect.bottom-margin,innerHeight-margin)
  };
  const figure=nodeRect??{
    left:stageRect.left+stageRect.width/2-30,top:stageRect.top+stageRect.height/2-20,
    right:stageRect.left+stageRect.width/2+30,bottom:stageRect.top+stageRect.height/2+20,width:60,height:40
  };
  const midX=figure.left+figure.width/2,midY=figure.top+figure.height/2;
  const candidates=[
    {left:figure.right+gap,top:midY-height/2},{left:figure.left-width-gap,top:midY-height/2},
    {left:midX-width/2,top:figure.bottom+gap},{left:midX-width/2,top:figure.top-height-gap},
    {left:workspace.left,top:workspace.top},{left:workspace.right-width,top:workspace.top},
    {left:workspace.left,top:workspace.bottom-height},{left:workspace.right-width,top:workspace.bottom-height},
    {left:midX-width/2,top:workspace.top},{left:midX-width/2,top:workspace.bottom-height}
  ];
  const activeId=String(model?.id??"");
  const svgScreenBounds=(element,padding=9)=>{
    try{
      const bounds=element.getBBox(),matrix=element.getScreenCTM();
      if(!matrix)return null;
      const svg=element.ownerSVGElement;
      const corners=[
        [bounds.x,bounds.y],[bounds.x+bounds.width,bounds.y],
        [bounds.x,bounds.y+bounds.height],[bounds.x+bounds.width,bounds.y+bounds.height]
      ].map(([x,y])=>{
        const point=svg.createSVGPoint();point.x=x;point.y=y;
        return point.matrixTransform(matrix);
      });
      const xs=corners.map(point=>point.x),ys=corners.map(point=>point.y);
      return {left:Math.min(...xs)-padding,top:Math.min(...ys)-padding,
        right:Math.max(...xs)+padding,bottom:Math.max(...ys)+padding};
    }catch{return null;}
  };
  /* Las aristas se comparan por puntos muestreados en pantalla.
     Su bounding-box rectangular completo era demasiado conservador y podía
     ocultar la ficha aunque la línea no cruzara realmente su superficie. */
  const edgePoints=[...document.querySelectorAll("#flow-svg .diagram-edge path")].flatMap(path=>{
    try{
      const length=path.getTotalLength(),matrix=path.getScreenCTM(),svg=path.ownerSVGElement;
      if(!matrix||!Number.isFinite(length)||length<=0)return [];
      const interval=Math.max(5,Math.min(14,length/48)),points=[];
      for(let distance=0;distance<=length;distance+=interval){
        const local=path.getPointAtLength(Math.min(length,distance));
        const point=svg.createSVGPoint();point.x=local.x;point.y=local.y;
        const screen=point.matrixTransform(matrix);
        points.push({x:screen.x,y:screen.y});
      }
      const local=path.getPointAtLength(length),end=svg.createSVGPoint();end.x=local.x;end.y=local.y;
      const screen=end.matrixTransform(matrix);points.push({x:screen.x,y:screen.y});
      return points;
    }catch{return [];}
  });
  const otherNodeElements=[...document.querySelectorAll("#flow-svg .diagram-node")].filter(element=>element!==node);
  const labelElements=[...document.querySelectorAll("#flow-svg .diagram-edge-label")];
  const uiElements=[...document.querySelectorAll(".simulator-control-dock,.simulator-controls-panel,.simulator-mobile-tabs,#simulator-question")];
  const boxObstacle=(element,pad)=>{
    const style=getComputedStyle(element);
    if(style.display==="none"||style.visibility==="hidden"||element.hidden)return null;
    const r=element.getBoundingClientRect();
    return {left:r.left-pad,top:r.top-pad,right:r.right+pad,bottom:r.bottom+pad};
  };
  const otherObstacles=[
    ...otherNodeElements.map(element=>boxObstacle(element,18)),
    ...labelElements.map(element=>boxObstacle(element,8)),
    ...uiElements.map(element=>boxObstacle(element,4))
  ].filter(Boolean);
  const obstacles=otherObstacles;
  const crossesEdge=rect=>edgePoints.some(point=>
    point.x>=rect.left-10&&point.x<=rect.left+width+10&&
    point.y>=rect.top-10&&point.y<=rect.top+height+10
  );
  const fits=rect=>rect.left>=workspace.left&&rect.top>=workspace.top&&
    rect.left+width<=workspace.right&&rect.top+height<=workspace.bottom&&
    !rectIntersects(rect,figure,10)&&!crossesEdge(rect)&&
    !obstacles.some(other=>rectIntersects(rect,other,2));
  const chosen=candidates.find(fits);
  box.dataset.anchorNode=String(model?.sourceId??model?.id??"");
  box.dataset.anchorSourceLine=String(event.sourceLine??"");
  if(!chosen){
    box.hidden=true;box.dataset.cable="fallback-scene";
    const scene=$("#PV");
    if(node&&scene&&getComputedStyle(scene).display!=="none")drawContextWire(nodeRect,scene.getBoundingClientRect());
    else hideContextWire();
    return;
  }
  box.hidden=false;box.dataset.cable="false";
  box.style.left=Math.round(chosen.left)+"px";box.style.top=Math.round(chosen.top)+"px";
  hideContextWire();
}
function showContextWindow(event){
  const box=$("#vf");
  if(!box||!event||timeline?.index===dismissedVfStep)return;
  const view=contextWindowMarkup(event);
  $("#vf-title").textContent=view.title;
  $("#vf-content").innerHTML=view.body;
  box.hidden=false;
  box.style.visibility="hidden";
  placeContextWindow(event);
  if(vfRaf)cancelAnimationFrame(vfRaf);
  clearTimeout(contextTimer);
  const complete=document.body.dataset.presentationMode==="complete";
  const wait=reducedMotion()||complete?0:Math.min(10000,Math.max(tokenTravelDuration,flightTravelDuration)+Math.max(100,120/currentSpeedFactor()));
  contextTimer=window.setTimeout(()=>{
    vfRaf=requestAnimationFrame(()=>{
      placeContextWindow(event);
      if(box.hidden){box.style.removeProperty("visibility");vfRaf=0;return;}
      box.style.removeProperty("visibility");
      box.classList.remove("is-arriving");
      void box.getBoundingClientRect();
      box.classList.add("is-arriving");
      vfRaf=0;
    });
  },wait);
}

function closeContextWindow(){
  dismissedVfStep=timeline?.index??-1;
  const box=$("#vf");if(box)box.hidden=true;
  hideContextWire();
  if(vfRaf)cancelAnimationFrame(vfRaf);vfRaf=0;
}


let choreographyPlayback=false,flightRaf=0,flightTimeouts=[],pulseTimeouts=[];
let tokenTravelDuration=0,flightTravelDuration=0;
function cancelChoreography(){
  if(flightRaf)cancelAnimationFrame(flightRaf);
  flightRaf=0;
  if(contextTimer)clearTimeout(contextTimer);
  contextTimer=0;
  if(vfRaf)cancelAnimationFrame(vfRaf);
  vfRaf=0;
  tokenTravelDuration=0;flightTravelDuration=0;
  flightTimeouts.forEach(clearTimeout);flightTimeouts=[];
  pulseTimeouts.forEach(clearTimeout);pulseTimeouts=[];
  document.querySelectorAll(".sim-flight-chip").forEach(element=>element.remove());
  document.querySelectorAll("[data-pulse]").forEach(element=>{
    element.classList.remove("is-pulsing");
    delete element.dataset.pulse;
  });
  document.querySelectorAll(".sim-pulse-count").forEach(element=>element.remove());
}
function reducedMotion(){
  return document.documentElement.dataset.motion==="reduced"||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function pulseWindow(id){
  const meta=WINDOW_META.find(item=>item.id===id);
  const owner=id==="output"?getWindowElement("variables"):(meta?getWindowElement(id):null);
  let target=id==="output"?$("#simulator-output-details"):owner;
  if(!target||owner?.hidden)return;
  if(id==="output"&&target instanceof HTMLDetailsElement)target.open=true;
  target.classList.remove("is-pulsing");
  void target.offsetWidth;
  target.classList.add("is-pulsing");
  const duration=Math.max(100,Math.min(5000,500/currentSpeedFactor()));
  const timeout=setTimeout(()=>target.classList.remove("is-pulsing"),duration);
  pulseTimeouts.push(timeout);
}
function flightTargetFor(event,targetId){
  if(targetId==="variables"&&event.change?.name){
    return document.querySelector('[data-variable-card="'+CSS.escape(event.change.name)+'"]')??getWindowElement("variables");
  }
  if(targetId==="output"){
    const output=$("#simulator-output-details");
    if(output)output.open=true;
    return output??getWindowElement("variables");
  }
  return getWindowElement(targetId);
}
function animateFlight(event,targetId){
  flightTravelDuration=0;
  if(!event||reducedMotion())return false;
  const source=event.type==="input"?$("#simulator-inputs"):(()=>{
    const model=diagramNodeForEvent(event);
    return model?document.getElementById("flow-node-"+model.id):null;
  })();
  const target=flightTargetFor(event,targetId);
  if(!source||!target||target.hidden)return false;
  const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
  const start={x:a.left+a.width/2,y:a.top+a.height/2},finish={x:b.left+b.width/2,y:b.top+b.height/2};
  if(![start.x,start.y,finish.x,finish.y].every(Number.isFinite))return false;
  const layer=$("#simulator-flight-layer")??(()=>{
    const node=document.createElement("div");node.id="simulator-flight-layer";node.setAttribute("aria-hidden","true");
    document.body.append(node);return node;
  })();
  const chip=document.createElement("span");
  chip.className="sim-flight-chip";
  chip.dataset.destination=targetId;
  chip.setAttribute("aria-hidden","true");
  chip.style.transform="translate3d("+start.x+"px,"+start.y+"px,0)";
  layer.append(chip);
  const control={x:(start.x+finish.x)/2,y:Math.min(start.y,finish.y)-52};
  const duration=Math.min(9000,Math.max(180,700/currentSpeedFactor()));flightTravelDuration=duration;let began=0;
  const frame=now=>{
    if(!began)began=now;
    const t=Math.min(1,(now-began)/duration),u=1-t;
    const x=u*u*start.x+2*u*t*control.x+t*t*finish.x;
    const y=u*u*start.y+2*u*t*control.y+t*t*finish.y;
    chip.style.transform="translate3d("+x+"px,"+y+"px,0)";
    if(t<1)flightRaf=requestAnimationFrame(frame);
    else{
      chip.remove();flightRaf=0;pulseWindow(targetId);
    }
  };
  flightRaf=requestAnimationFrame(frame);
  return true;
}
function choreographEvent(event){
  if(!event)return;
  const speed=currentSpeedFactor();
  if(reducedMotion()){
    if(event.type==="output")pulseWindow("output");
    else if(event.type==="input"||event.change)pulseWindow("variables");
    else if(event.type==="decision"||event.type==="loop-condition")pulseWindow("scene");
    return;
  }
  if(event.type==="input"){
    if(!animateFlight(event,"variables"))pulseWindow("variables");
  }else if(["assignment","loop-init","loop-update"].includes(event.type)&&event.change){
    if(!animateFlight(event,"variables"))pulseWindow("variables");
  }else if(event.type==="output"){
    if(!animateFlight(event,"output"))pulseWindow("output");
  }else if(event.type==="decision"||event.type==="loop-condition"){
    pulseWindow("scene");
  }else if(event.type==="program-end"){
    pulseWindow("variables");pulseWindow("output");
  }
}

function paintExerciseSelector(){
  const host=$("#sim-exercise-strip");if(!host)return;
  if(host.dataset.ready!=="true"){
    host.innerHTML='<input id="sim-exercise-search" type="search" aria-label="Buscar ejercicio" placeholder="Buscar…" autocomplete="off"><select id="sim-exercise-level-filter" aria-label="Filtrar por nivel"><option value="all">Todos los niveles</option><option value="basic">Básico</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option><option value="expert">Experto</option></select><select id="sim-exercise-select" aria-label="Seleccionar ejercicio"></select>';
    host.dataset.ready="true";
  }
  const search=host.querySelector("#sim-exercise-search");
  const filter=host.querySelector("#sim-exercise-level-filter");
  const select=host.querySelector("#sim-exercise-select");
  const query=(search?.value??"").trim().toLocaleLowerCase("es");
  const level=filter?.value??"all";
  const selected=exercises.find(item=>item.id===exerciseId)??exercises[0];
  const filtered=exercises.filter(item=>{
    const levelMatch=level==="all"||item.level===level;
    const haystack=(String(item.id)+" "+item.title+" "+(labels[item.level]??item.level)+" "+(item.concepts??[]).join(" ")).toLocaleLowerCase("es");
    return levelMatch&&(!query||haystack.includes(query));
  });
  select.innerHTML=filtered.map(item=>'<option value="'+item.id+'">'+String(item.id).padStart(2,"0")+' · '+esc(item.title)+'</option>').join("");
  select.value=filtered.some(item=>String(item.id)===String(exerciseId))?String(exerciseId):String(filtered[0]?.id??"");
  host.setAttribute("aria-label","Ejercicio actual: "+(selected?.title??"sin seleccionar"));
  const quickNav=$("#simulator-exercise-nav");
  if(quickNav){
    quickNav.innerHTML=filtered.map(item=>'<button type="button" data-exercise-shortcut="'+item.id+'" data-level="'+esc(item.level)+'" aria-pressed="'+String(item.id===exerciseId)+'" title="Ejercicio '+String(item.id).padStart(2,"0")+': '+esc(item.title)+' · '+esc(labels[item.level]??item.level)+'">'+String(item.id).padStart(2,"0")+'</button>').join("");
    quickNav.setAttribute("aria-label",filtered.length+" ejercicios visibles de "+exercises.length);
  }
}
function paintMethodTabs(){
  const host=$("#simulator-method-tabs"),select=$("#simulator-method");
  if(!host||!select||!exercise)return;
  host.innerHTML=exercise.methods.map((item,index)=>
    '<button type="button" data-method-index="'+index+'" aria-pressed="'+String(index===methodIndex)+'" title="'+esc(item.note??item.name)+'">'+
      '<span class="simulator-method-index">'+String(index+1).padStart(2,"0")+'</span>'+
      '<span class="simulator-method-name">'+esc(item.name)+'</span></button>'
  ).join("");
}
function syncDockHeight(){
  const dock=$("#dock");
  if(dock)document.body.style.setProperty("--dk",Math.ceil(dock.getBoundingClientRect().height)+"px");
}
function freeCanvasRect(){
  const stage=$("#diagram-stage"),header=$("#hd"),dock=$("#dock");
  if(!stage)return {left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight};
  if(document.body.classList.contains("focus"))return {left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight};
  const box=stage.getBoundingClientRect();
  const mobile=matchMedia("(max-width: 900px)").matches;
  const leftPanel=$("#PL"),rightPanel=$("#RC");
  let left=box.left+18,right=box.right-18,top=Math.max(box.top+12,(header?.getBoundingClientRect().bottom??box.top)+10);
  let bottom=Math.min(box.bottom-18,(dock?.getBoundingClientRect().top??box.bottom)-14);
  const leftVisible=leftPanel&&getComputedStyle(leftPanel).display!=="none";
  const rightVisible=rightPanel&&getComputedStyle(rightPanel).display!=="none";
  if(!mobile&&leftVisible)left=Math.max(left,leftPanel.getBoundingClientRect().right+16);
  if(!mobile&&rightVisible)right=Math.min(right,rightPanel.getBoundingClientRect().left-16);
  if(mobile){
    const tabs=$("#simulator-mobile-tabs");
    if(tabs&&getComputedStyle(tabs).display!=="none"){
      const tabRect=tabs.getBoundingClientRect();
      top=Math.max(top,tabRect.bottom+10);
    }
    if(document.body.dataset.simulatorMobilePanel!=="diagram")bottom=Math.min(bottom,box.bottom-210);
  }
  if(right-left<120){left=box.left+16;right=box.right-16;}
  if(bottom-top<120){top=box.top+12;bottom=box.bottom-160;}
  return {left,top,right,bottom,width:right-left,height:bottom-top};
}
function applyCanvasTransform(){
  const canvas=$("#flow-diagram-container"),wrap=$("#wrap");
  if(!canvas)return;
  if(!Number.isFinite(zoom)||zoom<=0)zoom=1;
  if(!Number.isFinite(panOffset.x))panOffset.x=0;
  if(!Number.isFinite(panOffset.y))panOffset.y=0;
  canvas.style.transformOrigin="0 0";
  canvas.style.transform="translate3d("+panOffset.x+"px,"+panOffset.y+"px,0) scale("+zoom+")";
  canvas.dataset.cameraX=String(panOffset.x);
  canvas.dataset.cameraY=String(panOffset.y);
  canvas.dataset.cameraZoom=String(zoom);
  if(wrap){
    const step=20*zoom,major=100*zoom;
    wrap.style.backgroundSize=step+"px "+step+"px,"+step+"px "+step+"px,"+major+"px "+major+"px,"+major+"px "+major+"px";
    wrap.style.backgroundPosition=(panOffset.x%step)+"px "+(panOffset.y%step)+"px,"+(panOffset.x%step)+"px "+(panOffset.y%step)+"px,"+(panOffset.x%major)+"px "+(panOffset.y%major)+"px,"+(panOffset.x%major)+"px "+(panOffset.y%major)+"px";
  }
}
function buildRouteGraph(){
  routeGraph=new Map();routeWeights=new Map();routeCache.clear();
  if(!diagram)return;
  for(const id of diagram.byId.keys())routeGraph.set(String(id),[]);
  const container=$("#flow-diagram-container");
  for(const edge of diagram.edges){
    const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
    const path=container?.querySelector('[data-edge-id="'+edge.id+'"] path');
    let weight=0;
    try{weight=path?.getTotalLength?.()??0;}catch{}
    if(!weight&&from&&to)weight=Math.hypot(to.x-from.x,to.y-from.y);
    routeWeights.set(edge.id,{path,weight});
    routeGraph.get(String(edge.from))?.push({to:String(edge.to),edgeId:edge.id,forward:true,weight});
  }
}
function shortestRoute(fromId,toId){
  const start=String(fromId),finish=String(toId);
  if(start===finish)return [];
  const key=start+":"+finish;
  if(routeCache.has(key))return routeCache.get(key);
  if(!routeGraph.has(start)||!routeGraph.has(finish))return [];
  const distance=new Map([[start,0]]),previous=new Map(),unvisited=new Set(routeGraph.keys());
  while(unvisited.size){
    let current=null,best=Infinity;
    for(const id of unvisited){const value=distance.get(id)??Infinity;if(value<best){best=value;current=id;}}
    if(current===null||best===Infinity)break;
    unvisited.delete(current);
    if(current===finish)break;
    for(const edge of routeGraph.get(current)??[]){
      if(!unvisited.has(edge.to))continue;
      const cost=best+edge.weight;
      if(cost<(distance.get(edge.to)??Infinity)){
        distance.set(edge.to,cost);
        previous.set(edge.to,{from:current,edgeId:edge.edgeId,forward:edge.forward});
      }
    }
  }
  const route=[];let cursor=finish;
  while(cursor!==start&&previous.has(cursor)){
    const step=previous.get(cursor);
    route.unshift({edgeId:step.edgeId,forward:step.forward});
    cursor=step.from;
  }
  const result=cursor===start?route:[];
  routeCache.set(key,result);return result;
}
function svgPathVertices(path){
  const d=path?.getAttribute("d")??"";
  const tokens=d.match(/[MLHV]|-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)??[];
  const points=[];let command=null,x=0,y=0,index=0;
  while(index<tokens.length){
    if(/^[MLHV]$/i.test(tokens[index]))command=tokens[index++];
    if(!command)break;
    if(command==="M"||command==="L"){
      const nx=Number(tokens[index++]),ny=Number(tokens[index++]);
      if(!Number.isFinite(nx)||!Number.isFinite(ny))break;
      x=nx;y=ny;points.push({x,y});
      if(command==="M")command="L";
    }else if(command==="H"){
      const nx=Number(tokens[index++]);if(!Number.isFinite(nx))break;x=nx;points.push({x,y});
    }else if(command==="V"){
      const ny=Number(tokens[index++]);if(!Number.isFinite(ny))break;y=ny;points.push({x,y});
    }else break;
  }
  return points;
}
function routeBetweenNodes(fromId,toId){
  const start=String(fromId),finish=String(toId);
  if(start===finish)return [];
  // El recorrido respeta la dirección real de las flechas del diagrama.
  return shortestRoute(start,finish);
}
function fallbackEdgeVertices(edge){
  if(!edge||!diagram)return [];
  const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
  if(!from||!to)return [];
  const fx=from.x,fy=from.y+from.height/2,tx=to.x,ty=to.y+to.height/2;
  if(edge.kind==="false"){
    const y=from.y+from.height/2;
    return [{x:from.x+from.width/2,y},{x:tx,y},{x:tx,y:to.y}];
  }
  if(edge.kind==="back"){
    const startX=from.x-from.width/2,endX=to.x-to.width/2;
    const bendX=Math.min(startX,endX)-42;
    return [{x:startX,y:fy},{x:bendX,y:fy},{x:bendX,y:ty},{x:endX,y:ty}];
  }
  if(Math.abs(fx-tx)<4)return [{x:fx,y:from.y+from.height},{x:tx,y:to.y}];
  const mid=(fy+ty)/2;
  return [{x:fx,y:from.y+from.height},{x:fx,y:mid},{x:tx,y:mid},{x:tx,y:to.y}];
}
function routeCoordinates(route){
  const points=[];
  for(const step of route){
    const path=routeWeights.get(step.edgeId)?.path;
    const edge=diagram?.edges.find(item=>item.id===step.edgeId);
    let sampled=[];
    try{
      const total=path?.getTotalLength?.()??0;
      if(total>0&&path?.getPointAtLength){
        const count=Math.max(3,Math.ceil(total/10));
        for(let index=0;index<=count;index++){
          const point=path.getPointAtLength(total*index/count);
          sampled.push({x:point.x,y:point.y});
        }
      }
    }catch{sampled=[];}
    if(sampled.length<2)sampled=fallbackEdgeVertices(edge);
    if(!step.forward)sampled.reverse();
    if(sampled.length<2)continue;
    if(points.length&&Math.hypot(points.at(-1).x-sampled[0].x,points.at(-1).y-sampled[0].y)<2)sampled.shift();
    points.push(...sampled);
  }
  return points;
}
function clearDiagramTrail(){
  if(tokenRaf){cancelAnimationFrame(tokenRaf);tokenRaf=0;}
  $("#flow-diagram-container #flow-trail")?.setAttribute("points","");
  $("#flow-diagram-container #flow-active-trail")?.setAttribute("points","");
  $("#flow-diagram-container #flow-token-ring")?.setAttribute("visibility","hidden");
  $("#flow-diagram-container #flow-token-label")?.setAttribute("visibility","hidden");
  $("#flow-diagram-container .flow-token")?.setAttribute("visibility","hidden");
}
function drawExecutionTrail(events){
  const points=[];let previous=null;
  for(const event of events){
    if(event.nodeId===null||event.nodeId===undefined)continue;
    if(previous!==null&&String(previous)!==String(event.nodeId)){
      const segment=routeCoordinates(routeBetweenNodes(previous,event.nodeId));
      if(points.length&&segment.length&&Math.hypot(points[points.length-1].x-segment[0].x,points[points.length-1].y-segment[0].y)<2)segment.shift();
      points.push(...segment);
    }
    previous=event.nodeId;
  }
  const polyline=points.slice(-1200).map(point=>point.x+","+point.y).join(" ");
  $("#flow-diagram-container #flow-trail")?.setAttribute("points",polyline);
  const stage=$("#diagram-stage");
  if(stage){
    stage.dataset.trailPointCount=String(points.length);
    stage.dataset.trailNodeCount=String(events.filter(event=>event.nodeId!==null&&event.nodeId!==undefined).length);
  }
}
function animateTokenRoute(route,event,animate=choreographyPlayback){
  tokenTravelDuration=0;
  const token=$("#flow-diagram-container .flow-token");
  const trail=$("#flow-diagram-container #flow-active-trail"),ring=$("#flow-diagram-container #flow-token-ring");
  if(!token)return;
  if(tokenRaf){cancelAnimationFrame(tokenRaf);tokenRaf=0;}
  const points=routeCoordinates(route);
  const node=diagram?.nodes.find(item=>String(item.sourceId)===String(event?.nodeId));
  const target=points.length?points[points.length-1]:node?{x:node.x,y:Math.max(10,node.y-12)}:null;
  if(!target){token.setAttribute("visibility","hidden");return;}
  const reduced=reducedMotion(),speed=currentSpeedFactor();
  token.setAttribute("visibility","visible");
  const place=point=>{
    token.setAttribute("cx",String(point.x));token.setAttribute("cy",String(point.y));
  };
  if(points.length<2||!animate||reduced){
    place(target);if(trail)trail.setAttribute("points","");
    if(ring)ring.setAttribute("visibility","hidden");
    return;
  }
  const lengths=[0];let total=0;
  for(let index=1;index<points.length;index++){
    total+=Math.hypot(points[index].x-points[index-1].x,points[index].y-points[index-1].y);
    lengths.push(total);
  }
  if(total<1){place(target);return;}
  const pointsValue=points.map(point=>point.x+","+point.y).join(" ");
  if(trail){trail.setAttribute("points",pointsValue);trail.style.strokeDasharray=String(total);trail.style.strokeDashoffset=String(total);}
  place(points[0]);
  const duration=Math.min(9000,Math.max(220,(500+total*1.6)/speed));
  tokenTravelDuration=duration;
  let started=0;
  const frame=now=>{
    if(!started)started=now;
    const u=Math.min(1,(now-started)/duration);
    const eased=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
    const distance=total*eased;
    let index=1;while(index<lengths.length-1&&lengths[index]<distance)index++;
    const segment=lengths[index]-lengths[index-1]||1,ratio=(distance-lengths[index-1])/segment;
    const from=points[index-1],to=points[index];
    const point={x:from.x+(to.x-from.x)*ratio,y:from.y+(to.y-from.y)*ratio};
    place(point);
    if(trail)trail.style.strokeDashoffset=String(total*(1-eased));
    if(u<1)tokenRaf=requestAnimationFrame(frame);
    else{
      place(target);tokenRaf=0;
      if(trail)trail.style.strokeDashoffset="0";
      if(ring){
        ring.setAttribute("cx",String(target.x));ring.setAttribute("cy",String(target.y));ring.setAttribute("visibility","visible");
        ring.classList.remove("is-expanding");void ring.getBoundingClientRect();ring.classList.add("is-expanding");
      }
      token.classList.remove("is-bouncing");void token.getBoundingClientRect();token.classList.add("is-bouncing");
      const pulseDuration=Math.max(100,Math.min(5000,500/speed));
      const timer=setTimeout(()=>{if(trail)trail.setAttribute("points","");token.classList.remove("is-bouncing");},pulseDuration);
      pulseTimeouts.push(timer);
    }
  };
  tokenRaf=requestAnimationFrame(frame);
}
function centerActiveNode(event,behavior){
  if(!cameraReady||!cameraAuto||!event||event.nodeId===null||event.nodeId===undefined)return;
  const stage=$("#diagram-stage");
  const model=diagram?.nodes.find(item=>String(item.sourceId)===String(event.nodeId)||String(item.id)===String(event.nodeId));
  const node=model?document.getElementById("flow-node-"+model.id):null;
  if(!stage||!node||!model)return;
  const stageRect=stage.getBoundingClientRect();
  if(stageRect.width<120||stageRect.height<120)return;
  const free=freeCanvasRect(),target=node.getBoundingClientRect();
  const goal={
    x:panOffset.x+(free.left+free.width/2-(target.left+target.width/2)),
    y:panOffset.y+(free.top+free.height/2-(target.top+target.height/2))
  };
  if(cameraRaf)cancelAnimationFrame(cameraRaf);
  const finish=()=>{
    panOffset=goal;cameraRaf=0;applyCanvasTransform();
    updateActiveNodeHint(timeline?.current);
    if(!$("#simulator-controls-panel")?.hidden)requestAnimationFrame(positionControlsPanel);
  };
  if(behavior==="auto"||reducedMotion()||Math.hypot(goal.x-panOffset.x,goal.y-panOffset.y)<1)finish();
  else{
    let previous=performance.now(),started=previous;
    const step=now=>{
      if(!cameraAuto){cameraRaf=0;return;}
      const dt=Math.max(0,now-previous);previous=now;
      const alpha=1-Math.exp(-dt/(210/currentSpeedFactor()));
      panOffset={x:panOffset.x+(goal.x-panOffset.x)*alpha,y:panOffset.y+(goal.y-panOffset.y)*alpha};
      applyCanvasTransform();
      updateActiveNodeHint(timeline?.current);
      const distance=Math.hypot(goal.x-panOffset.x,goal.y-panOffset.y);
      if(distance<1.2||now-started>Math.min(5000,1700/currentSpeedFactor()))finish();
      else cameraRaf=requestAnimationFrame(step);
    };
    cameraRaf=requestAnimationFrame(step);
  }
  stage.dataset.cameraTarget=String(event.nodeId);
}
function currentSpeedFactor(){
  const value=Number($("#simulator-speed")?.value??1);
  return Number.isFinite(value)&&value>0?Math.max(.1,Math.min(8,value)):1;
}
function publishTrace(){
  if(!execution||!timeline)return;
  document.dispatchEvent(new CustomEvent("traza:execution-updated",{detail:{
    exercise,exerciseId,methodIndex,method:method(),execution,
    event:timeline.current,index:timeline.index,length:timeline.length,
    diagram,source:method()?.pseudocode??""
  }}));
}
function parseInputs(){
  const raw=$("#simulator-inputs").value.trim();
  return raw?raw.split(/[\s,;]+/).filter(Boolean):[];
}
function pseudocode(source,active=null,visited=[],activeVariables=[]){
  const host=$("#pseudocode-lines");
  const rows=source.split("|").map((text,i)=>({line:i+1,text:text.trim()})).filter(x=>x.text);
  const seen=new Set(visited);
  const names=[...new Set(activeVariables)].filter(name=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)).sort((a,b)=>b.length-a.length);
  const matcher=names.length?new RegExp("\\b("+names.join("|")+")\\b","g"):null;
  const highlight=text=>{
    if(!matcher)return esc(text);
    let output="",last=0;
    matcher.lastIndex=0;
    for(const match of text.matchAll(matcher)){
      output+=esc(text.slice(last,match.index));
      output+='<mark class="pseudocode-variable '+variableTone(match[0])+'" data-variable="'+esc(match[0])+'">'+esc(match[0])+'</mark>';
      last=match.index+match[0].length;
    }
    return output+esc(text.slice(last));
  };
  $("#pseudocode-line-count").textContent=rows.length+" líneas";
  host.innerHTML=rows.map(row=>'<li class="'+(row.line===active?"is-active":seen.has(row.line)?"is-visited":"")+'" data-line="'+row.line+'"><span>'+String(row.line).padStart(2,"0")+'</span><code>'+highlight(row.text)+'</code></li>').join("");
  if(active){
    const row=host.querySelector('[data-line="'+active+'"]');
    if(row){
      const top=row.offsetTop,bottom=top+row.offsetHeight;
      if(top<host.scrollTop)host.scrollTop=top;
      else if(bottom>host.scrollTop+host.clientHeight)host.scrollTop=bottom-host.clientHeight;
    }
  }
}
function fitDiagramWhenVisible(attempt=0){
  if(fitDiagram())return true;
  if(attempt>=8)return false;
  requestAnimationFrame(()=>fitDiagramWhenVisible(attempt+1));
  return false;
}
function prepare(){
  stop();cameraReady=false;
  if(cameraRaf)cancelAnimationFrame(cameraRaf);
  cameraRaf=0;
  exercise=getExercise(exerciseId)??exercises[0];
  exerciseId=exercise.id;
  methodIndex=Math.max(0,Math.min(methodIndex,exercise.methods.length-1));
  paintExerciseSelector();
  $("#simulator-exercise-number").textContent=String(exercise.id).padStart(2,"0");
  $("#simulator-exercise-level").textContent=labels[exercise.level]??exercise.level;
  $("#simulator-exercise-level").className="exercise-level "+(exercise.level==="basic"?"level-basic":exercise.level==="intermediate"?"level-intermediate":"level-advanced");
  $("#simulator-exercise-title").textContent=exercise.title;
  $("#simulator-exercise-statement").textContent=exercise.statement;
  const problemBody=$("#sim-window-context .sim-window-body");if(problemBody)problemBody.scrollTop=0;
  $("#simulator-purpose").textContent=exercise.purpose??exercise.objective??"Comprender qué resuelve el algoritmo.";
  $("#simulator-idea").textContent=exercise.analysis??(exercise.concepts??[]).join(" · ");
  const sourceForCycle=method().pseudocode.toLowerCase();
  const cycles=[];
  if(sourceForCycle.includes("para "))cycles.push("Para");
  if(sourceForCycle.includes("mientras "))cycles.push("Mientras");
  if(sourceForCycle.includes("hacer"))cycles.push("Hacer–Mientras");
  $("#simulator-cycle").textContent=cycles.length?[...new Set(cycles)].join(" · "):"Este algoritmo no necesita ciclos.";
  $("#simulator-exercise-spec").innerHTML=[
    ["Entradas",exercise.inputs],["Salidas",exercise.outputs],["Restricciones",exercise.constraints]
  ].map(([name,items])=>'<p class="eyebrow">'+name.toUpperCase()+'</p><ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>').join("");
  $("#simulator-method").innerHTML=exercise.methods.map((m,i)=>'<option value="'+i+'">'+esc(m.name)+'</option>').join("");
  $("#simulator-method").value=String(methodIndex);
  paintMethodTabs();
  defaultInputSample=[...(method().sample??[])];
  $("#simulator-inputs").value=defaultInputSample.join(", ");
  pseudocode(method().pseudocode);
  const codeBody=$("#sim-window-code .sim-window-body");if(codeBody)codeBody.scrollTop=0;
  try{
    const ast=parsePseudocode(method().pseudocode);
    diagram=layoutFlow(ast);
    renderDiagram($("#flow-diagram-container"),diagram);
    buildRouteGraph();
    clearDiagramTrail();
    $("#diagram-empty").hidden=true;
    $("#diagram-dimensions").textContent=diagram.width+" × "+diagram.height;
    const svg=$("#flow-svg");if(svg){svg.style.width="100%";svg.style.maxWidth="none";}
    zoom=1;panOffset={x:0,y:0};applyCanvasTransform();
  }catch(error){
    diagram=null;routeGraph.clear();routeWeights.clear();routeCache.clear();clearDiagramTrail();
    $("#flow-diagram-container").innerHTML="";
    $("#diagram-empty").hidden=false;$("#diagram-empty h4").textContent="No se pudo construir el diagrama";
    $("#diagram-empty p").textContent=error.message;
  }
  run();
  requestAnimationFrame(()=>fitDiagramWhenVisible());
}
function typeName(type){
  return ({ "program-start":"INICIO",input:"ENTRADA",assignment:"ASIGNACIÓN",output:"SALIDA",
    decision:"DECISIÓN",branch:"RUTA","loop-init":"INICIALIZACIÓN","loop-condition":"CONDICIÓN DE CICLO",
    "loop-enter":"ITERACIÓN","loop-update":"AVANCE","loop-exit":"SALIDA DE CICLO",
    "program-end":"FIN",error:"ERROR"})[type]??String(type).toUpperCase();
}
function substituteValues(expression,values){
  let result=String(expression??"");
  for(const [name,value] of Object.entries(values??{}).sort((a,b)=>b[0].length-a[0].length)){
    result=result.replace(new RegExp("\\b"+name+"\\b","g"),fmt(value));
  }
  return result;
}
function loopNodeType(event){
  return diagram?.byId.get(String(event?.nodeId))?.type??null;
}
function symbolExplanation(event){
  const loopType=loopNodeType(event);
  if(event.type==="program-start")return {key:"terminal",name:"Óvalo · Inicio",text:"El óvalo señala dónde comienza la ejecución. Todavía no se han procesado datos."};
  if(event.type==="program-end")return {key:"terminal",name:"Óvalo · Fin",text:"El óvalo marca el punto donde termina el algoritmo. La memoria conserva los últimos valores."};
  if(event.type==="input")return {key:"input",name:"Paralelogramo · Entrada",text:"El paralelogramo representa Leer: un dato entra desde fuera y se guarda en la variable indicada."};
  if(event.type==="assignment")return {key:"process",name:"Rectángulo · Proceso",text:"El rectángulo representa un cálculo o una asignación. El resultado sustituye o crea el valor de una variable."};
  if(event.type==="output")return {key:"output",name:"Documento · Salida",text:"La figura de salida representa Imprimir: comunica un resultado en pantalla, sin modificar por sí misma las variables."};
  if(event.type==="decision"||event.type==="branch")return {key:"decision",name:"Rombo · Decisión",text:"El rombo evalúa una condición y abre dos rutas excluyentes: Verdadera (V) o Falsa (F). La etiqueta muestra cuál se tomó."};
  if(event.type==="loop-condition"){
    if(loopType==="for")return {key:"loop",name:"Hexágono · Ciclo Para",text:"El hexágono reúne el ciclo definido: preparación del contador, evaluación de la condición y avance. Esta comprobación decide si entra otra vuelta."};
    if(loopType==="doWhile")return {key:"decision",name:"Rombo · Hacer–Mientras",text:"El rombo aparece al final del cuerpo. La primera ejecución ya ocurrió; V repite y F termina."};
    return {key:"decision",name:"Rombo · Mientras",text:"El rombo pregunta antes de entrar al cuerpo. Si la respuesta inicial es Falsa, el cuerpo puede ejecutarse cero veces."};
  }
  if(["loop-init","loop-update"].includes(event.type)&&loopType==="for")return {key:"loop",name:"Hexágono · Ciclo Para",text:"Esta es una de las tres partes del Para: primero se prepara el contador y después se avanza según el paso definido."};
  if(event.type==="loop-enter"&&loopType==="for")return {key:"loop",name:"Hexágono · Ciclo Para",text:"La condición se cumplió y el flujo entra al cuerpo del Para. Al terminar sus instrucciones se realizará el avance."};
  if(event.type==="loop-enter"&&["while","doWhile"].includes(loopType))return {key:"decision",name:"Rombo · Ruta verdadera",text:"La condición se cumplió. El flujo entra al cuerpo y ejecuta sus instrucciones antes de volver a comprobarla cuando corresponda."};
  if(event.type==="loop-exit"&&loopType==="for")return {key:"loop",name:"Hexágono · Salida del Para",text:"La condición del Para resultó falsa. El flujo abandona el ciclo y continúa con la instrucción siguiente."};
  if(event.type==="loop-exit"&&["while","doWhile"].includes(loopType))return {key:"decision",name:"Rombo · Ruta falsa",text:"La condición dejó de cumplirse. Se toma la salida del rombo y el algoritmo continúa después del ciclo."};
  if(event.type==="loop-enter")return {key:"connector",name:"Conector · Entrada al ciclo",text:"La flecha conduce al cuerpo de la repetición. El número de vuelta identifica cuántas veces se ha ejecutado."};
  if(event.type==="loop-exit")return {key:"connector",name:"Conector · Salida del ciclo",text:"La ruta abandona el cuerpo porque la condición dejó de cumplirse. La ejecución continúa después del ciclo."};
  if(event.type==="loop-init")return {key:"process",name:"Rectángulo · Inicialización",text:"La variable de control recibe su valor inicial antes de comprobar la condición."};
  if(event.type==="loop-update")return {key:"process",name:"Rectángulo · Avance",text:"El contador cambia al terminar la vuelta. Ese avance permite que la condición llegue a ser falsa y el ciclo termine."};
  return {key:"connector",name:"Conector · Flujo",text:"Las flechas conectan las instrucciones y muestran el sentido en que se ejecuta el algoritmo."};
}
function symbolShapeMarkup(key){
  const shapes={
    terminal:'<rect x="7" y="12" width="86" height="36" rx="18"/>',
    input:'<polygon points="20,10 96,10 80,50 4,50"/>',
    process:'<rect x="7" y="10" width="86" height="40" rx="2"/>',
    output:'<path d="M7 8H93V43Q70 34 50 43T7 43Z"/>',
    decision:'<polygon points="50,3 98,30 50,57 2,30"/>',
    loop:'<polygon points="20,8 80,8 98,30 80,52 20,52 2,30"/>',
    connector:'<circle cx="50" cy="30" r="22"/>'
  };
  return '<svg viewBox="0 0 100 60" aria-hidden="true" focusable="false">'+(shapes[key]??shapes.connector)+'</svg>';
}
function orderExplanation(event){
  const loopType=loopNodeType(event);
  if(event.type==="program-start")return "El algoritmo debe iniciar antes de leer, calcular o decidir. Por eso el terminal aparece primero.";
  if(event.type==="input")return "Primero se reciben los datos. Las operaciones posteriores necesitan que las variables ya tengan un valor.";
  if(event.type==="assignment")return "El cálculo usa los valores que existían antes de esta línea; después guarda el nuevo resultado en la variable.";
  if(event.type==="output")return "La salida se produce después de calcular. Imprimir muestra el valor, pero no cambia la memoria del programa.";
  if(event.type==="decision"||event.type==="branch")return "La condición se evalúa antes de escoger una rama. Solo se recorre el camino que corresponde al resultado V o F.";
  if(event.type==="loop-init")return "En un ciclo Para, la inicialización se ejecuta una sola vez antes de la primera comprobación.";
  if(event.type==="loop-condition"){
    if(loopType==="doWhile")return "Hacer–Mientras evalúa al final: primero ejecuta el cuerpo al menos una vez y después decide si repite.";
    if(loopType==="for")return "Para comprueba la condición antes de cada vuelta. Si es verdadera ejecuta el cuerpo; después realiza el avance.";
    return "Mientras pregunta antes de cada vuelta. Si la condición es falsa desde el inicio, el cuerpo no se ejecuta.";
  }
  if(event.type==="loop-enter")return "La condición permitió entrar. Ahora se ejecutan las instrucciones del cuerpo en el orden en que están escritas.";
  if(event.type==="loop-update")return "El avance ocurre después del cuerpo y antes de la siguiente comprobación. Sin avance, un ciclo puede quedarse repitiéndose.";
  if(event.type==="loop-exit")return "La condición ya es falsa. El flujo sale del ciclo y continúa con la primera instrucción posterior.";
  if(event.type==="program-end")return "No quedan instrucciones por ejecutar. La salida y los valores finales quedan disponibles para revisar.";
  return "Las flechas mantienen el orden de ejecución y enlazan cada bloque con el siguiente.";
}
function symbolExplanationMarkup(event){
  const item=symbolExplanation(event);
  return '<div class="scene-symbol-explanation" data-symbol="'+item.key+'"><div class="scene-symbol-graphic">'+symbolShapeMarkup(item.key)+'</div><div><span>POR QUÉ ESTA FIGURA</span><strong>'+esc(item.name)+'</strong><p>'+esc(item.text)+'</p></div></div>';
}
function loopCountBefore(event){
  return execution?.events.slice(0,event.step).filter(item=>
    item.type==="loop-enter"&&String(item.nodeId)===String(event.nodeId)
  ).length??0;
}
function brief(e){
  if(e.type==="input")return "Se leyó "+fmt(e.value)+" y se guardó en "+e.change?.name+".";
  if(e.type==="loop-init")return (e.change?.name??"El contador")+" empieza en "+fmt(e.change?.value)+".";
  if(e.type==="loop-update")return e.change?.name+" avanza de "+fmt(e.change?.previous)+" a "+fmt(e.change?.value)+".";
  if(e.type==="assignment"){
    const match=/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/.exec(e.expression??e.sourceText??"");
    const before=execution?.events[e.step-1]?.variables??{};
    const calculation=match?substituteValues(match[2],before):fmt(e.change?.value);
    const previous=e.change?.previous===undefined?"empieza en":"pasa de "+fmt(e.change.previous)+" a";
    return e.change?.name+" "+previous+" "+fmt(e.change?.value)+": "+calculation+" = "+fmt(e.change?.value)+".";
  }
  if(e.type==="output")return "El resultado "+fmt(e.value)+" se muestra en la pantalla.";
  if(e.type==="decision"||e.type==="branch"){
    const substituted=substituteValues(e.condition,e.variables);
    return "Se comprueba "+e.condition+". Con los valores "+substituted+", la condición es "+(e.result?"verdadera: sigue la ruta V.":"falsa: sigue la ruta F.");
  }
  if(e.type==="loop-condition"){
    const substituted=substituteValues(e.condition,e.variables);
    const type=loopNodeType(e),completed=loopCountBefore(e);
    const round=type==="doWhile"?completed:(e.result?completed+1:completed);
    return "Se comprueba "+e.condition+" con "+substituted+". "+(e.result?"La condición es verdadera y el ciclo continúa.":"La condición es falsa y el ciclo termina.")+(round>0?" Vuelta "+round+".":"");
  }
  if(e.type==="loop-enter")return "Vuelta "+e.iteration+". Se ejecutan las instrucciones del cuerpo.";
  if(e.type==="loop-exit")return "El ciclo termina tras "+(e.iteration??0)+" vueltas. El flujo continúa después del ciclo.";
  if(e.type==="program-start")return "El algoritmo comienza. La memoria está vacía.";
  if(e.type==="program-end")return "El algoritmo terminó. Puedes revisar los valores y resultados finales.";
  return e.message||typeName(e.type);
}
function updateLoopBadge(event){
  let badge=$("#simulator-loop-round");
  if(!badge){
    badge=document.createElement("span");
    badge.id="simulator-loop-round";
    badge.className="dock-loop-round";
    badge.hidden=true;
    $("#dock-step-title")?.insertAdjacentElement("afterend",badge);
  }
  const type=loopNodeType(event);
  let round=null;
  if(event.type==="loop-enter")round=event.iteration;
  else if(event.type==="loop-exit")round=event.iteration;
  else if(event.type==="loop-condition"&&type){
    const completed=loopCountBefore(event);
    round=type==="doWhile"?completed:(event.result?completed+1:completed);
  }else if(event.loopStack?.length)round=event.loopStack.at(-1).iteration;
  badge.hidden=!(Number(round)>0);
  badge.textContent=Number(round)>0?"Vuelta "+round:"";
}
function history(){
  $("#trace-history").innerHTML=execution.events.map(e=>'<li data-history-step="'+e.step+'" role="button" tabindex="0" class="'+(e.step===timeline.index?"is-active":"")+'"><span>PASO '+String(e.step+1).padStart(2,"0")+' · '+typeName(e.type)+'</span><strong>'+esc(brief(e))+'</strong></li>').join("");
  $("#trace-count").textContent=String(execution.events.length);
}
function sceneSymbol(type){
  return ({
    input:"↓",assignment:"↦",output:"▣",decision:"◇",branch:"↗",
    "loop-init":"◉","loop-condition":"◇","loop-enter":"↻",
    "loop-update":"↑","loop-exit":"↘","program-start":"▶",
    "program-end":"■",error:"!"
  })[type]??"·";
}
function renderVariableHistory(){
  const host=$("#variable-history");
  if(!host)return;
  if(!selectedVariable){
    host.innerHTML='<span class="empty-state-copy">Selecciona una variable para inspeccionar su historial.</span>';
    return;
  }
  if(!execution||!timeline){
    host.textContent="Ejecuta un algoritmo para consultar el historial.";
    return;
  }
  const changes=execution.events.filter(event=>
    event.step<=timeline.index&&event.change?.name===selectedVariable
  );
  host.innerHTML='<div class="variable-history-heading"><strong>Historial · '+esc(selectedVariable)+'</strong><button type="button" class="text-link" id="variable-history-clear">Cerrar</button></div>'+
    (changes.length?'<ol class="variable-history-list">'+changes.map(event=>{
      const before=event.change.previous===undefined?"(primera asignación)":fmt(event.change.previous);
      const after=fmt(event.change.value);
      const loop=(event.loopStack??[]).map(item=>"vuelta "+item.iteration).join(" · ");
      return '<li><button type="button" data-variable-step="'+event.step+'"><span>Paso '+(event.step+1)+(loop?" · "+esc(loop):"")+'</span><strong>'+esc(before)+" → "+esc(after)+'</strong><small>'+esc(event.sourceText||event.scene?.title||"")+'</small></button></li>';
    }).join("")+'</ol>':'<span class="empty-state-copy">Esta variable todavía no cambia en los pasos recorridos.</span>');
}
function updateCameraButton(){
  const button=$("#diagram-camera-toggle");
  if(!button)return;
  button.setAttribute("aria-pressed",String(cameraAuto));
  button.setAttribute("aria-label",cameraAuto?"Desactivar cámara automática":"Activar cámara automática");
  button.title=cameraAuto?"Cámara automática":"Seguir el proceso";
  button.textContent=cameraAuto?"Cámara automática":"Seguir el proceso";
}
function setCameraFree(){
  cameraAuto=false;
  if(cameraRaf)cancelAnimationFrame(cameraRaf);
  cameraRaf=0;
  updateCameraButton();
  const stage=$("#diagram-stage");
  if(stage)stage.dataset.cameraMode="manual";
}
function setCameraFollowing(){
  cameraAuto=true;
  updateCameraButton();
  const stage=$("#diagram-stage");
  if(stage)stage.dataset.cameraMode="automatic";
  if(timeline)centerActiveNode(timeline.current,"auto");
}
function zoomAt(nextZoom,clientX,clientY){
  const stage=$("#diagram-stage");
  if(!stage)return;
  const box=stage.getBoundingClientRect(),oldZoom=zoom,target=Math.max(.4,Math.min(2.5,nextZoom));
  const anchorX=clientX-box.left,anchorY=clientY-box.top;
  const worldX=(anchorX-panOffset.x)/oldZoom,worldY=(anchorY-panOffset.y)/oldZoom;
  zoom=target;
  panOffset={x:anchorX-worldX*zoom,y:anchorY-worldY*zoom};
  stage.dataset.zoomCount=String((Number(stage.dataset.zoomCount)||0)+1);
  applyCanvasTransform();
  updateActiveNodeHint(timeline?.current);
}
function zoomDiagram(direction){
  if(!diagramFitWidth)fitDiagram();
  const free=freeCanvasRect();
  setCameraFree();
  zoomAt(zoom*(direction>0?1.18:1/1.18),free.left+free.width/2,free.top+free.height/2);
}

function centerDiagram(){
  if(!diagram)return;
  fitDiagram();setCameraFollowing();
}
function updateActiveNodeHint(event){
  const hint=$("#diagram-active-target"),stage=$("#diagram-stage");
  if(!hint||!stage)return;
  const model=diagram?.nodes.find(item=>String(item.sourceId)===String(event?.nodeId)||String(item.id)===String(event?.nodeId));
  const node=model?document.getElementById("flow-node-"+model.id):null;
  if(cameraAuto||!node){hint.hidden=true;return;}
  const bounds=stage.getBoundingClientRect(),rect=node.getBoundingClientRect(),margin=18;
  hint.hidden=rect.right>bounds.left+margin&&rect.left<bounds.right-margin&&rect.bottom>bounds.top+margin&&rect.top<bounds.bottom-margin;
}
function renderOperationBreakdown(event){
  let expression=null;
  let values=event.variables??{};
  if(event.type==="assignment"||event.type==="loop-init"||event.type==="loop-update"){
    const source=event.expression??event.sourceText??"";
    const updateStep=/^([A-Za-z_][A-Za-z0-9_]*)(\+\+|--)$/.exec(source.trim());
    if(updateStep&&event.change){
      const amount=updateStep[2]==="++"?1:-1;
      return '<div class="scene-operation-breakdown"><span>AVANCE DEL CONTADOR</span><p><code>'+esc(fmt(event.change.previous))+' '+(amount>0?"+":"−")+' 1 = '+esc(fmt(event.change.value))+'</code></p></div>';
    }
    const assignment=/^[A-Za-z_][A-Za-z0-9_]*\s*=(?!=)\s*(.+)$/.exec(source.trim());
    if(assignment){
      expression=assignment[1];
      const previous=execution.events[timeline.index-1];
      values=previous?.variables??{};
    }
  }else if(event.type==="output"){
    expression=event.expression;
  }else if(event.type==="decision"||event.type==="loop-condition"){
    expression=event.condition;
  }
  if(!expression)return "";
  try{
    const trace=traceExpression(expression,values);
    if(!trace.steps.length)return "";
    return '<div class="scene-operation-breakdown"><span>DESGLOSE DE OPERACIÓN</span><ol>'+
      trace.steps.map(step=>{
        const right=step.right===null?"":' '+(step.shortCircuited?"":esc(fmt(step.right)));
        return '<li><code>'+esc(fmt(step.left))+' '+esc(step.operator)+(right?' '+right:'')+' = <b>'+esc(fmt(step.result))+'</b></code></li>';
      }).join("")+
      '</ol><small>Los valores se sustituyen desde el estado del mismo paso de ejecución.</small></div>';
  }catch(error){
    return '<div class="scene-operation-breakdown"><span>DETALLE TÉCNICO</span><p>'+esc(error.message)+'</p></div>';
  }
}
function render(){
  if(!execution||!timeline)return;
  const e=timeline.current;
  const seen=execution.events.slice(0,timeline.index+1);
  const activeVariableNames=e.change?.name?[e.change.name]:e.condition
    ?[...new Set((e.condition.match(/[A-Za-z_][A-Za-z0-9_]*/g)??[]).filter(name=>Object.hasOwn(e.variables??{},name)))]
    :[];
  pseudocode(method().pseudocode,e.sourceLine,seen.map(x=>x.sourceLine).filter(Boolean),activeVariableNames);
  if(diagram){
    const routeEvent=[...seen].reverse().find(item=>item.route&&(item.type==="branch"||item.type==="decision"||item.type==="loop-condition"));
    const previousSource=[...seen.slice(0,-1)].reverse().find(item=>item.nodeId!==null&&item.nodeId!==undefined)?.nodeId;
    const walked=previousSource!==null&&e.nodeId!==null&&e.nodeId!==undefined?routeBetweenNodes(previousSource,e.nodeId):[];
    highlightDiagram($("#flow-diagram-container"),diagram,{
      activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined),
      route:routeEvent?.route??null,routeNodeId:routeEvent?.nodeId??null,previousNodeId:previousSource??null,
      walkEdgeIds:walked.map(item=>item.edgeId),
      activePart:e.type==="loop-init"?0:e.type==="loop-condition"?1:e.type==="loop-update"?2:-1
    });
    drawExecutionTrail(seen);
    animateTokenRoute(walked,e);
  }
  document.documentElement.style.setProperty("--sim-speed",String(currentSpeedFactor()));
  document.documentElement.style.setProperty("--sim-animation-duration",Math.round(Math.max(100,Math.min(5000,500/currentSpeedFactor())))+"ms");
  updateCameraButton();
  if(cameraAuto&&cameraReady)centerActiveNode(e);
  updateActiveNodeHint(e);
  /* La escena presenta una figura y una sola explicación del evento actual. */
  const sceneView=renderScene(e,{events:execution.events,inputValues:parseInputs(),execution});
  const scene=sceneView.model?.scene??e.scene??{title:typeName(e.type)};
  const sceneContent=$("#scene-content");
  sceneContent.dataset.eventType=e.type;
  const symbolMarkup=symbolExplanationMarkup(e);
  const orderMarkup='<details class="scene-order-explanation"><summary>¿Por qué se ejecuta en este orden?</summary><p>'+esc(orderExplanation(e))+'</p></details>';
  sceneContent.innerHTML='<div class="scene-figure-host" role="img" aria-label="'+sceneView.alt+'">'+sceneView.markup+'</div>'+
    '<span class="scene-event-type">'+typeName(e.type)+'</span>'+
    '<h4 class="scene-event-title">'+esc(scene.title??typeName(e.type))+'</h4>'+
    symbolMarkup+orderMarkup+
    '<p class="scene-event-body">'+esc(brief(e))+'</p>';
  sceneContent.scrollTop=0;
  const vars=e.variables??{},names=Object.keys(vars),change=e.change;
  const variableMarkup=names.map(name=>{
    const changed=change?.name===name,active=activeVariableNames.includes(name),tone=variableTone(name);
    const old=changed&&change.previous!==undefined?'<span class="variable-old-value">'+esc(fmt(change.previous))+'</span><span class="variable-value-arrow">→</span>':"";
    return '<button type="button" class="variable-card '+tone+(changed?" is-changed":"")+(active?" is-active-variable":"")+'" data-variable-card="'+esc(name)+'" data-variable-history="'+esc(name)+'" aria-pressed="'+String(selectedVariable===name)+'">'+
      '<span class="variable-card-name">'+esc(name)+'</span><span class="variable-card-values">'+old+'<strong>'+esc(fmt(vars[name]))+'</strong></span></button>';
  }).join("");
  $("#variables-content").innerHTML=names.length?'<div class="variable-cards">'+variableMarkup+'</div>':'<p class="empty-state-copy">La memoria aún está vacía. La primera asignación mostrará aquí cada cajita.</p>';
  $("#variable-change").textContent=change?"Por qué cambia: "+brief(e):"Sin cambios de variable en este paso.";
  $("#variables-content").scrollTop=0;
  const activeModel=diagramNodeForEvent(e),activeNode=activeModel?document.getElementById("flow-node-"+activeModel.id):null;
  document.querySelectorAll("#flow-svg .diagram-node").forEach(node=>{node.classList.remove("has-active-variable");node.style.removeProperty("--active-variable-color");});
  if(activeNode&&activeVariableNames.length){
    activeNode.classList.add("has-active-variable");
    activeNode.style.setProperty("--active-variable-color","var(--"+variableTone(activeVariableNames[0]).replace("variable-tone-","variable-color-")+")");
    activeNode.dataset.activeVariables=activeVariableNames.join(",");
  }
  renderVariableHistory();
  const out=e.outputs??[];
  $("#output-count").textContent=String(out.length);
  $("#simulator-output").innerHTML=out.length?out.map((value,index)=>'<li><span class="output-index">'+(index+1)+'.</span> '+esc(fmt(value))+'</li>').join(""):"<li>El algoritmo todavía no ha producido una salida.</li>";
  if(choreographyPlayback){
    choreographEvent(e);
    showContextWindow(e);
  }else showContextWindow(e);
  $("#trace-history").querySelectorAll("[data-history-step]").forEach(item=>item.classList.toggle("is-active",Number(item.dataset.historyStep)===timeline.index));
  if($("#simulator-history-details")?.open)$("#trace-history").querySelector('[data-history-step="'+timeline.index+'"]')?.scrollIntoView({block:"nearest",inline:"nearest"});
  if($("#simulator-output-details")&&out.length)$("#simulator-output-details").classList.toggle("has-new-output",e.type==="output");
  $("#timeline-count").textContent=(timeline.index+1)+" / "+timeline.length;
  $("#simulator-timeline").max=String(timeline.length-1);
  $("#simulator-timeline").value=String(timeline.index);
  $("#dock-step-title").textContent=typeName(e.type)+" · "+(timeline.index+1);
  document.body.dataset.simulatorStep=String(timeline.index);
  document.body.dataset.simulatorSteps=String(timeline.length);
  document.body.dataset.simulatorEvent=e.type;
  $("#dock-step-description").textContent=brief(e);
  updateLoopBadge(e);
  $("#simulator-first").disabled=timeline.index===0;
  $("#simulator-previous").disabled=timeline.index===0;
  $("#simulator-next").disabled=timeline.index>=timeline.length-1;
  $("#simulator-last").disabled=timeline.index>=timeline.length-1;
  $("#simulator-play").disabled=timeline.index>=timeline.length-1;
  if(e.type==="error"){
    $("#simulator-status").textContent="DETENIDO · "+e.message;
    $("#simulator-status").classList.add("simulator-status-error");
  }
  renderFocusState(e);
  publishTrace();
}


function showFocusControls(){
  const ui=$("#focus-ui");if(!ui||!document.body.classList.contains("focus"))return;
  ui.classList.remove("is-idle");clearTimeout(focusIdleTimer);
  focusIdleTimer=window.setTimeout(()=>ui.classList.add("is-idle"),3000);
}
function focusCopy(event){
  if(event.type==="input")return {title:"📥 Entra un dato",value:event.change?.name+" ← "+fmt(event.value),line:"El dato se guarda en "+event.change?.name+"."};
  if(event.type==="output")return {title:"🖨️ Sale en pantalla",value:fmt(event.value),line:"Ese valor aparece en la Pantalla."};
  if(event.condition)return {title:event.type==="decision"?"❓ Decisión":"🔁 Condición del ciclo",value:event.condition+" → "+(event.result?"V":"F"),line:event.result?"Sigue el camino V.":"Sigue el camino F."};
  if(event.change)return {title:"✏️ Cambia una variable",value:event.change.name+": "+(event.change.previous===undefined?"∅":fmt(event.change.previous))+" → "+fmt(event.change.value),line:"Se guarda el nuevo valor."};
  if(event.type==="program-end")return {title:"🏁 Fin del algoritmo",value:"Ejecución terminada",line:"La memoria y la Pantalla conservan el resultado."};
  if(event.type==="loop-enter")return {title:"🔁 Nueva vuelta",value:"Vuelta "+event.iteration,line:"Comienza otra repetición."};
  return {title:typeName(event.type),value:"Paso "+(timeline.index+1),line:brief(event)};
}
function placeFocusCard(){
  const card=$("#focus-card");if(!card||card.hidden)return;
  const node=timeline?.current?.nodeId==null?null:document.getElementById("flow-node-"+timeline.current.nodeId);
  if(!node){card.style.left="50%";card.style.top="18%";card.style.transform="translateX(-50%)";return;}
  const figure=node.getBoundingClientRect(),w=card.offsetWidth||300,h=card.offsetHeight||120,gap=16,margin=12;
  const choices=[
    {left:figure.right+gap,top:figure.top+figure.height/2-h/2},
    {left:figure.left-w-gap,top:figure.top+figure.height/2-h/2},
    {left:figure.left+figure.width/2-w/2,top:figure.top-h-gap},
    {left:figure.left+figure.width/2-w/2,top:figure.bottom+gap}
  ];
  const safe=choices.map(box=>({...box,right:box.left+w,bottom:box.top+h})).find(box=>
    box.left>=margin&&box.top>=margin&&box.right<=innerWidth-margin&&box.bottom<=innerHeight-margin&&!rectIntersects(box,figure,8)
  );
  const chosen=safe??{left:Math.max(margin,Math.min(innerWidth-w-margin,figure.right+gap)),top:Math.max(margin,Math.min(innerHeight-h-margin,figure.top))};
  card.style.left=chosen.left+"px";card.style.top=chosen.top+"px";card.style.transform="none";
}
function renderFocusState(event){
  if(!document.body.classList.contains("focus"))return;
  const copy=focusCopy(event),card=$("#focus-card");
  $("#focus-card-title").textContent=copy.title;$("#focus-card-value").textContent=copy.value;$("#focus-card-line").textContent=copy.line;
  if(card){card.hidden=false;requestAnimationFrame(placeFocusCard);}
  const memory=$("#focus-memory"),variables=event.variables??{};
  memory.innerHTML=Object.entries(variables).map(([name,value])=>
    '<span class="focus-memory-item '+(event.change?.name===name?"is-changed":"")+'"><small>'+esc(name)+'</small>'+
    (event.change?.name===name&&event.change.previous!==undefined?'<del>'+esc(fmt(event.change.previous))+'</del>':"")+
    '<strong>'+esc(fmt(value))+'</strong></span>'
  ).join("");
  memory.hidden=!Object.keys(variables).length;
  const output=event.outputs??[],screen=$("#focus-screen");
  if(output.length){screen.hidden=false;$("#focus-screen-lines").innerHTML=output.slice(-4).map(value=>'<li>'+esc(fmt(value))+'</li>').join("");}
  else screen.hidden=true;
  const loop=event.loopStack?.at(-1),counter=$("#focus-loop");
  counter.hidden=!loop&&!event.iteration;if(!counter.hidden)counter.textContent="Vuelta "+(event.iteration??loop.iteration);
  const code=$("#focus-code");code.textContent=event.sourceText||"";code.hidden=!event.sourceText;
  clearTimeout(code._fadeTimer);code.classList.remove("is-fading");code._fadeTimer=window.setTimeout(()=>code.classList.add("is-fading"),3000);
  $("#focus-subtitle").textContent=brief(event);$("#focus-step").textContent="Paso "+(timeline.index+1)+" de "+timeline.length;
  const progress=$("#focus-progress");progress.max=String(timeline.length-1);progress.value=String(timeline.index);
}

function eventAskable(event){
  if(!event||event.nodeId===null||event.nodeId===undefined||event.type==="input"||event.type==="error")return false;
  return ["decision","branch","loop-condition"].includes(event.type)||
    Boolean(event.change&&typeof event.change.value==="number")||
    (event.type==="output"&&typeof event.value==="number");
}
function predictionModel(event){
  if(["decision","branch","loop-condition"].includes(event.type)){
    return {answer:event.result?"V":"F",question:"¿Qué responde la condición?",detail:event.condition??event.sourceText,options:["V","F"]};
  }
  if(event.change&&typeof event.change.value==="number"){
    const value=event.change.value,candidates=[value,event.change.previous,value+1,value-1,value*2,0,value+2,value-2];
    const options=[];
    for(const item of candidates){
      if(typeof item==="number"&&Number.isFinite(item)){
        const label=fmt(item);if(!options.includes(label))options.push(label);
      }
      if(options.length===4)break;
    }
    return {answer:fmt(value),question:"¿Qué valor tendrá "+event.change.name+" después de este paso?",detail:event.expression??"",options:options.sort(()=>Math.random()-.5)};
  }
  const value=event.value,options=[];
  for(const item of [value,value+1,value-1,0,value*2]){
    if(typeof item==="number"&&Number.isFinite(item)){const label=fmt(item);if(!options.includes(label))options.push(label);}
    if(options.length===4)break;
  }
  return {answer:fmt(value),question:"¿Qué número sale en pantalla?",detail:event.expression??"",options:options.sort(()=>Math.random()-.5)};
}
function updatePredictionButton(){
  const button=$("#simulator-predict");if(!button)return;
  button.setAttribute("aria-pressed",String(predictEnabled));
  button.setAttribute("aria-label",predictEnabled?"Desactivar modo Predice":"Activar modo Predice");
  button.title=predictEnabled?"Predice activo · P":"Predice · P";
  button.classList.toggle("is-active",predictEnabled);
  button.textContent="🎯 Predice "+predictionCorrect+"/"+predictionAttempts;
  const focusButton=$("#focus-predict");
  if(focusButton){focusButton.setAttribute("aria-pressed",String(predictEnabled));focusButton.textContent="🎯 Predice "+predictionCorrect+"/"+predictionAttempts;}
}
function togglePredictionMode(){
  predictEnabled=!predictEnabled;predictionPending=null;
  const card=$("#simulator-question");if(card)card.hidden=true;
  updatePredictionButton();
}
function showPredictionQuestion(index){
  const event=execution?.events?.[index];if(!eventAskable(event))return;
  const model=predictionModel(event),card=$("#simulator-question");if(!card)return;
  predictionPending={index,event,model,answered:false};
  card.hidden=false;card.classList.toggle("is-focus",document.body.classList.contains("focus"));
  card.innerHTML='<div class="sim-question-card"><button type="button" id="simulator-question-close" aria-label="Cerrar pregunta">×</button><p class="sim-question-eyebrow">🎯 PREDICE ANTES DE VER</p><h3>'+esc(model.question)+'</h3><p class="sim-question-detail">'+esc(model.detail??"")+'</p><div class="sim-question-options">'+model.options.map(value=>'<button type="button" data-prediction-answer="'+esc(value)+'">'+esc(value)+'</button>').join("")+'</div><p id="sim-question-feedback" role="status" aria-live="polite"></p><button type="button" id="simulator-question-reveal" hidden>Ver el paso</button></div>';
}
function answerPrediction(button){
  if(!predictionPending||predictionPending.answered)return;
  const correct=button.dataset.predictionAnswer===predictionPending.model.answer;
  predictionPending.answered=true;predictionAttempts++;if(correct)predictionCorrect++;
  $("#simulator-question").querySelectorAll("[data-prediction-answer]").forEach(item=>{
    item.disabled=true;
    item.classList.toggle("is-correct",item.dataset.predictionAnswer===predictionPending.model.answer);
    item.classList.toggle("is-wrong",item===button&&!correct);
    item.classList.toggle("is-muted",item!==button&&item.dataset.predictionAnswer!==predictionPending.model.answer);
  });
  $("#sim-question-feedback").textContent=correct?"✓ ¡Correcto!":"✗ Era "+predictionPending.model.answer+".";
  $("#simulator-question-reveal").hidden=false;updatePredictionButton();
}
function revealPrediction(){
  if(!predictionPending?.answered)return;
  const index=predictionPending.index,resume=predictionResume;predictionPending=null;
  $("#simulator-question").hidden=true;timeline.seek(index);choreographyPlayback=true;
  try{render();}finally{choreographyPlayback=false;}
  if(resume)play();
}
function run(){
  stop();
  try{
    execution=executePseudocode(method().pseudocode,parseInputs());
    timeline=createTimeline(execution);
    selectedVariable=null;
    history();render();
    $("#simulator-status").textContent=execution.ok?"Simulación lista · "+execution.events.length+" pasos":"Ejecución detenida";
    $("#simulator-status").classList.toggle("simulator-status-error",!execution.ok);
  }catch(error){
    execution=null;timeline=null;
    $("#simulator-status").textContent="ERROR DE ANÁLISIS";
    $("#simulator-status").classList.add("simulator-status-error");
    $("#scene-content").innerHTML='<div class="simulator-error">'+esc(error.message)+'</div>';
    $("#trace-history").innerHTML="<li>Error de análisis</li>";
    $("#simulator-output").innerHTML="<li>Sin salida.</li>";
    $("#variables-content").innerHTML='<p class="empty-state-copy">No hay un estado de ejecución.</p>';
    $("#variable-history").innerHTML='<span class="empty-state-copy">No hay historial disponible.</span>';
    $("#timeline-count").textContent="— / —";
    $("#simulator-timeline").max="0";$("#simulator-timeline").value="0";
  }
}
function seek(index){
  if(!timeline)return;
  stop();timeline.seek(index);
  render();
}
function move(delta){
  if(!timeline||predictionPending)return;
  const destination=Math.max(0,Math.min(timeline.length-1,timeline.index+delta));
  if(destination===timeline.index)return;
  if(delta>0&&predictEnabled&&eventAskable(execution.events[destination])){
    predictionResume=timer!==null;stop();showPredictionQuestion(destination);return;
  }
  stop();timeline.seek(destination);
  choreographyPlayback=true;
  try{render();}finally{choreographyPlayback=false;}
}
function play(){
  if(!timeline)return;
  if(timer!==null){stop();return;}
  if(timeline.index>=timeline.length-1)timeline.first();
  const button=$("#simulator-play");button.textContent="Ⅱ";button.title="Pausar";button.setAttribute("aria-label","Pausar");
  const advance=()=>{
    timer=null;
    if(predictionPending)return;
    const destination=timeline.index+1;
    if(predictEnabled&&eventAskable(execution.events[destination])){
      predictionResume=true;stop();showPredictionQuestion(destination);return;
    }
    cancelChoreography();
    timeline.next();
    choreographyPlayback=true;
    try{render();}finally{choreographyPlayback=false;}
    if(timeline.index>=timeline.length-1)stop();
    else{
      const speed=currentSpeedFactor();
      const animation=Math.max(tokenTravelDuration,flightTravelDuration,Math.min(5000,500/speed));
      timer=window.setTimeout(advance,Math.min(15000,Math.max(600,animation)+Math.max(100,120/speed)+600));
    }
  };
  timer=window.setTimeout(advance,0);
}
function applyDiagramZoom(){
  const svg=$("#flow-svg");
  if(!svg||!diagramFitWidth||!diagramFitHeight)return;
  svg.style.minWidth="0";svg.style.maxWidth="none";
  svg.style.width=diagramFitWidth+"px";svg.style.height=diagramFitHeight+"px";
  applyCanvasTransform();
}
function setPseudocodeSize(size){
  pseudocodeSize=Math.max(13,Math.min(26,size));
  document.documentElement.style.setProperty("--pseudocode-font-size",pseudocodeSize+"px");
  document.body.style.setProperty("--fs",String(pseudocodeSize));
  const smaller=$("#simulator-text-smaller"),larger=$("#simulator-text-larger");
  if(smaller)smaller.disabled=pseudocodeSize<=13;
  if(larger)larger.disabled=pseudocodeSize>=26;
  try{window.localStorage.setItem("traza:v2:pseudocode-size",String(pseudocodeSize));}catch{}
}
function fitDiagram(){
  const stage=$("#diagram-stage"),svg=$("#flow-svg"),canvas=$("#flow-diagram-container");
  if(!stage||!svg||!diagram)return false;
  const stageBox=stage.getBoundingClientRect();
  if(stageBox.width<120||stageBox.height<120)return false;
  const viewBox=svg.viewBox?.baseVal;
  if(!viewBox?.width||!viewBox?.height)return false;
  const free=freeCanvasRect();
  if(free.width<120||free.height<120)return false;
  const focus=document.body.classList.contains("focus");
  const widthScale=Math.max(.1,(free.width-36)/viewBox.width);
  const heightScale=Math.max(.1,(free.height-30)/viewBox.height);
  fitScale=focus
    ?Math.max(.42,Math.min(2.8,Math.min(innerWidth*.9/viewBox.width,innerHeight*.88/viewBox.height)))
    :Math.max(.42,Math.min(1.6,Math.min(widthScale,Math.max(.42,heightScale))));
  diagramFitWidth=viewBox.width*fitScale;diagramFitHeight=viewBox.height*fitScale;
  zoom=1;
  panOffset={x:free.left-stageBox.left+(free.width-diagramFitWidth)/2,y:free.top-stageBox.top+(free.height-diagramFitHeight)/2};
  if(cameraRaf)cancelAnimationFrame(cameraRaf);cameraRaf=0;
  stage.dataset.fitCount=String((Number(stage.dataset.fitCount)||0)+1);
  if(canvas){canvas.style.transition="none";canvas.style.transformOrigin="0 0";}
  applyDiagramZoom();
  cameraReady=true;
  if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
  return true;
}
const FOCUS_LAYOUT=[
  ["#main-content",{position:"fixed",inset:"0",width:"100vw",height:"100svh",minWidth:"0",minHeight:"0",maxWidth:"100vw",maxHeight:"100svh",margin:"0",padding:"0",overflow:"hidden"}],
  ["#view-simulator",{position:"fixed",inset:"0",width:"100vw",height:"100svh",minWidth:"0",minHeight:"0",maxWidth:"100vw",maxHeight:"100svh",margin:"0",padding:"0",overflow:"hidden"}],
  [".simulator-grid.simulator-grid-four",{position:"absolute",inset:"0",display:"block",width:"100vw",height:"100svh",minWidth:"0",minHeight:"0",margin:"0",padding:"0",overflow:"hidden"}],
  [".diagram-panel.sim-world-panel",{position:"absolute",inset:"0",display:"block",width:"100vw",height:"100svh",minWidth:"0",minHeight:"0",margin:"0",padding:"0",overflow:"hidden",border:"0",borderRadius:"0"}],
  ["#wrap.sim-wrap",{position:"absolute",inset:"0",width:"100vw",height:"100svh",minWidth:"0",minHeight:"0",margin:"0",padding:"0",overflow:"hidden"}],
  ["#diagram-stage.simulator-diagram-stage",{position:"absolute",inset:"0",width:"100vw",height:"100svh",minWidth:"0",minHeight:"0",margin:"0",padding:"0",overflow:"hidden"}]
];
function setFocusLayout(enabled){
  const focusTop="0px";
  const focusHeight="100svh";
  for(const [selector,properties] of FOCUS_LAYOUT){
    const element=$(selector);if(!element)continue;
    const layout={...properties};
    if(enabled&&(selector==="#main-content"||selector==="#view-simulator")){
      layout.inset=`${focusTop} 0 0`;
      layout.height=focusHeight;
      layout.maxHeight=focusHeight;
    }
    for(const [property,value] of Object.entries(layout)){
      if(enabled)element.style.setProperty(property.replace(/[A-Z]/g,letter=>"-"+letter.toLowerCase()),value,"important");
      else element.style.removeProperty(property.replace(/[A-Z]/g,letter=>"-"+letter.toLowerCase()));
    }
  }
}
async function toggleDiagramFullscreen(){
  const body=document.body;
  if(body.classList.contains("focus")){
    setFocusLayout(false);
    body.classList.remove("focus");
    clearTimeout(focusIdleTimer);
    if(document.fullscreenElement&&document.exitFullscreen){try{await document.exitFullscreen();}catch{}}
    document.documentElement.dataset.fullscreenRequested="false";
    updateFullscreenButton();
    requestAnimationFrame(()=>{fitDiagramWhenVisible();if(timeline&&cameraAuto)centerActiveNode(timeline.current,"auto");});
    return;
  }
  /* Concentración debe salir del panel flotante antes de ocultarlo:
     así Escape siempre queda asociado a salir del modo, no a cerrar un menú invisible. */
  const controls=$("#simulator-controls-panel");
  if(controls&&!controls.hidden)toggleControls(false);
  body.classList.remove("sim-controls-open");
  body.classList.add("focus");
  setFocusLayout(true);
  if(document.documentElement.requestFullscreen){
    document.documentElement.dataset.fullscreenRequested="true";
    try{await document.documentElement.requestFullscreen();}
    catch{document.documentElement.dataset.fullscreenRequested="false";}
  }
  updateFullscreenButton();
  requestAnimationFrame(()=>{fitDiagram();if(timeline){renderFocusState(timeline.current);if(cameraAuto)centerActiveNode(timeline.current,"auto");}showFocusControls();});
}
function updateFullscreenButton(){
  const active=document.body.classList.contains("focus");
  const button=$("#diagram-fullscreen");
  button?.setAttribute("aria-pressed",String(active));
  button?.setAttribute("aria-label",active?"Salir del modo Concentración":"Entrar al modo Concentración");
  if(button){button.title=active?"Salir de Concentración · F":"Concentración · F";button.textContent=active?"⤢ Salir":"⛶ Concentración";}
  const exitButton=$("#diagram-fullscreen-exit");
  if(exitButton)exitButton.hidden=!active;
}
function bindDiagramPan(){
  const stage=$("#diagram-stage"),hit=$("#diagram-pan-hit");
  if(!stage||!hit)return;
  let drag=null;
  const onDown=event=>{
    if(event.pointerType==="mouse"&&event.button!==0)return;
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest("button,a,input,select,textarea,.simulator-control-dock,.simulator-controls-panel,.sim-window,.focus-ui"))return;
    const rect=stage.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)return;
    event.preventDefault();
    try{hit.setPointerCapture(event.pointerId);}catch{}
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,originX:panOffset.x,originY:panOffset.y,moved:false};
    stage.classList.add("is-panning");
  };
  const onMove=event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>2&&!drag.moved){
      drag.moved=true;
      stage.dataset.panStart=String((Number(stage.dataset.panStart)||0)+1);
      setCameraFree();
    }
    if(!drag.moved)return;
    panOffset={x:drag.originX+dx,y:drag.originY+dy};
    applyCanvasTransform();
    updateActiveNodeHint(timeline?.current);
    stage.dataset.panMoved=String((Number(stage.dataset.panMoved)||0)+1);
  };
  const onUp=event=>{
    if(!drag||drag.id!==event.pointerId)return;
    drag=null;stage.classList.remove("is-panning");
    try{if(hit.hasPointerCapture(event.pointerId))hit.releasePointerCapture(event.pointerId);}catch{}
  };
  hit.addEventListener("pointerdown",onDown);
  hit.addEventListener("pointermove",onMove);
  hit.addEventListener("pointerup",onUp);
  hit.addEventListener("pointercancel",onUp);
  hit.addEventListener("lostpointercapture",onUp);
  stage.addEventListener("wheel",event=>{
    if(event.target instanceof Element&&event.target.closest(".simulator-control-dock,.simulator-controls-panel,.sim-window,.focus-ui"))return;
    event.preventDefault();
    if(event.ctrlKey||event.metaKey){
      stage.dataset.wheelZoomBlocked=String((Number(stage.dataset.wheelZoomBlocked)||0)+1);
      return;
    }else{
      setCameraFree();
      const multiplier=event.deltaMode===1?18:event.deltaMode===2?stage.clientHeight:1;
      panOffset={x:panOffset.x-event.deltaX*multiplier,y:panOffset.y-event.deltaY*multiplier};
      applyCanvasTransform();
      updateActiveNodeHint(timeline?.current);
      stage.dataset.wheelPanCount=String((Number(stage.dataset.wheelPanCount)||0)+1);
    }
  },{passive:false});
}

function setMobilePanel(name){
  const valid=["problem","diagram","scene","variables"];
  if(!valid.includes(name))return;
  document.body.dataset.simulatorMobilePanel=name;
  $("#simulator-mobile-tabs")?.querySelectorAll("[data-mobile-panel]").forEach(button=>{
    const active=button.dataset.mobilePanel===name;
    button.setAttribute("aria-selected",String(active));
    button.tabIndex=active?0:-1;
  });
}
function setPresentationMode(value){
  const mode=value==="complete"?"complete":"appear";
  document.body.dataset.presentationMode=mode;
  try{localStorage.setItem("traza:v3:presentation-mode",mode);}catch{}
  const control=$("#simulator-presentation-mode");if(control)control.value=mode;
}
function positionControlsPanel(){
  const panel=$("#simulator-controls-panel"),trigger=$("#simulator-controls-toggle");
  if(!panel||panel.hidden||!trigger)return;
  const margin=10,width=panel.getBoundingClientRect().width||Math.min(360,innerWidth-20);
  const height=panel.getBoundingClientRect().height||300,button=trigger.getBoundingClientRect();
  const event=timeline?.current;
  const model=event&&diagram?.nodes.find(item=>String(item.sourceId)===String(event.nodeId)||String(item.id)===String(event.nodeId));
  const node=model?document.getElementById("flow-node-"+model.id):null,box=node?.getBoundingClientRect(),dock=$("#dock")?.getBoundingClientRect();
  const overlaps=(a,b,g=10)=>!!b&&a.left<b.right+g&&a.right>b.left-g&&a.top<b.bottom+g&&a.bottom>b.top-g;
  const candidates=[
    {left:button.right-width,top:button.bottom+8},{left:button.left-width-8,top:button.top},
    {left:button.right-width,top:button.top-height-8},{left:button.left,top:button.bottom+8},
    {left:innerWidth-width-margin,top:margin},{left:margin,top:margin},
    {left:innerWidth-width-margin,top:innerHeight-height-margin},{left:margin,top:innerHeight-height-margin}
  ].map(p=>({left:Math.max(margin,Math.min(innerWidth-width-margin,p.left)),top:Math.max(margin,Math.min(innerHeight-height-margin,p.top))}));
  const score=p=>{
    const r={left:p.left,top:p.top,right:p.left+width,bottom:p.top+height};
    return (overlaps(r,box,14)?1e7:0)+(overlaps(r,dock,8)?1e6:0)+(overlaps(r,button,2)?1e5:0);
  };
  candidates.sort((a,b)=>score(a)-score(b));
  const p=candidates[0],r={left:p.left,top:p.top,right:p.left+width,bottom:p.top+height};
  panel.style.position="fixed";panel.style.left=Math.round(p.left)+"px";panel.style.top=Math.round(p.top)+"px";
  panel.style.right="auto";panel.style.bottom="auto";panel.dataset.avoidsActiveNode=String(!overlaps(r,box,14));
}
function toggleControls(open){
  const panel=$("#simulator-controls-panel"),button=$("#simulator-controls-toggle");
  if(!panel||!button)return;
  const visible=typeof open==="boolean"?open:panel.hidden;
  panel.hidden=!visible;
  document.body.classList.toggle("sim-controls-open",visible);
  button.setAttribute("aria-expanded",String(visible));
  button.classList.toggle("is-active",visible);
  if(visible)requestAnimationFrame(()=>{positionControlsPanel();$("#sim-exercise-search")?.focus({preventScroll:true});});
  else{
    panel.style.removeProperty("left");panel.style.removeProperty("top");
    panel.style.removeProperty("right");panel.style.removeProperty("bottom");
  }
}

function bind(){
  $("#sim-exercise-strip")?.addEventListener("input",event=>{
    if(["sim-exercise-search","sim-exercise-level-filter"].includes(event.target.id))paintExerciseSelector();
  });
  $("#sim-exercise-strip")?.addEventListener("change",event=>{
    if(event.target.id!=="sim-exercise-select")return;
    exerciseId=Number(event.target.value)||1;methodIndex=0;selectedVariable=null;prepare();
  });
  $("#simulator-controls-toggle")?.addEventListener("click",()=>toggleControls());
  $("#simulator-controls-panel")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-exercise-shortcut]");
    if(!button)return;
    exerciseId=Number(button.dataset.exerciseShortcut)||1;methodIndex=0;selectedVariable=null;
    prepare();toggleControls(false);
  });
  document.addEventListener("pointerdown",event=>{
    const panel=$("#simulator-controls-panel"),target=event.target instanceof Element?event.target:null;
    if(!panel||panel.hidden||target?.closest("#simulator-controls-panel,#simulator-controls-toggle"))return;
    toggleControls(false);
  });
  $("#simulator-method-tabs")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-method-index]");
    if(!button)return;
    const next=Number(button.dataset.methodIndex);
    if(!Number.isInteger(next)||next<0||next>=exercise.methods.length||next===methodIndex)return;
    methodIndex=next;prepare();
  });
  $("#simulator-predict")?.addEventListener("click",togglePredictionMode);
  $("#focus-predict")?.addEventListener("click",()=>{togglePredictionMode();showFocusControls();});
  $("#simulator-question")?.addEventListener("click",event=>{
    const answer=event.target.closest("[data-prediction-answer]");
    if(answer){answerPrediction(answer);return;}
    if(event.target.closest("#simulator-question-reveal"))revealPrediction();
    if(event.target.closest("#simulator-question-close")){predictionPending=null;$("#simulator-question").hidden=true;}
  });
  $("#simulator-presentation-mode")?.addEventListener("change",event=>setPresentationMode(event.target.value));
  $("#simulator-mobile-tabs")?.addEventListener("click",event=>{
    const tab=event.target.closest("[data-mobile-panel]");
    if(tab){
      setMobilePanel(tab.dataset.mobilePanel);
      if(tab.dataset.mobilePanel==="diagram")requestAnimationFrame(()=>{if(cameraReady&&cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");});
    }
  });
  $("#simulator-run")?.addEventListener("click",run);
  $("#simulator-restore-inputs")?.addEventListener("click",()=>{
    $("#simulator-inputs").value=defaultInputSample.join(", ");
    run();
  });
  $("#simulator-text-smaller")?.addEventListener("click",()=>setPseudocodeSize(pseudocodeSize-1));
  $("#simulator-text-larger")?.addEventListener("click",()=>setPseudocodeSize(pseudocodeSize+1));
  $("#simulator-text-reset")?.addEventListener("click",()=>setPseudocodeSize(17));
  $("#diagram-camera-toggle")?.addEventListener("click",()=>{
    cameraAuto=!cameraAuto;updateCameraButton();
    if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
  });
  $("#diagram-active-target")?.addEventListener("click",()=>setCameraFollowing());
  $("#diagram-fullscreen")?.addEventListener("click",toggleDiagramFullscreen);
  $("#diagram-fullscreen-exit")?.addEventListener("click",toggleDiagramFullscreen);
  $("#focus-previous")?.addEventListener("click",()=>{move(-1);showFocusControls();});
  $("#focus-next")?.addEventListener("click",()=>{move(1);showFocusControls();});
  $("#focus-progress")?.addEventListener("input",event=>{seek(Number(event.target.value));showFocusControls();});
  $("#diagram-pan-hit")?.addEventListener("click",event=>{
    if(!document.body.classList.contains("focus")||event.target.closest("button,input,select"))return;
    if(event.clientX<innerWidth/3)move(-1);else if(event.clientX>innerWidth*2/3)move(1);
    showFocusControls();
  });
  document.addEventListener("pointermove",()=>showFocusControls(),{passive:true});
  $("#simulator-shortcuts-close")?.addEventListener("click",()=>{$("#simulator-shortcuts").hidden=true;});
  $("#vf-close")?.addEventListener("click",closeContextWindow);
  bindWindows();
  document.addEventListener("fullscreenchange",()=>{
    if(document.body.classList.contains("focus")&&!document.fullscreenElement&&document.documentElement.dataset.fullscreenRequested==="true"){
      document.documentElement.dataset.fullscreenRequested="false";
      setFocusLayout(false);
      document.body.classList.remove("focus");
      clearTimeout(focusIdleTimer);
      requestAnimationFrame(()=>{fitDiagram();if(timeline&&cameraAuto)centerActiveNode(timeline.current,"auto");});
    }
    updateFullscreenButton();
  });
  $("#variables-content")?.addEventListener("click",event=>{
    const card=event.target.closest("[data-variable-history]");
    if(card){selectedVariable=card.dataset.variableHistory;render();}
  });
  $("#variable-history")?.addEventListener("click",event=>{
    if(event.target.closest("#variable-history-clear")){selectedVariable=null;render();return;}
    const row=event.target.closest("[data-variable-step]");
    if(row)seek(Number(row.dataset.variableStep));
  });
  $("#simulator-method")?.addEventListener("change",event=>{
    methodIndex=Number(event.target.value)||0;prepare();
  });
  $("#simulator-inputs")?.addEventListener("keydown",event=>{
    if(event.key==="Enter"){event.preventDefault();run();}
  });
  /* Cada control de transporte recibe su propio listener. No depende de
     que el click burbujee a través de capas del dock/lienzo. */
  const transportActions=[
    ["#simulator-first",()=>seek(0)],
    ["#simulator-previous",()=>move(-1)],
    ["#simulator-next",()=>move(1)],
    ["#simulator-last",()=>seek((timeline?.length??1)-1)],
    ["#simulator-play",play]
  ];
  for(const [selector,action] of transportActions){
    $(selector)?.addEventListener("click",event=>{
      if(event.currentTarget.disabled)return;
      event.preventDefault();
      action();
    });
  }
  $("#simulator-timeline")?.addEventListener("input",event=>seek(Number(event.target.value)));
  $("#simulator-speed")?.addEventListener("change",()=>{
    document.documentElement.style.setProperty("--sim-speed",String(currentSpeedFactor()));
    document.documentElement.style.setProperty("--sim-animation-duration",Math.round(Math.max(100,Math.min(5000,500/currentSpeedFactor())))+"ms");
    if(timer!==null){stop();play();}
  });
  $("#trace-history")?.addEventListener("click",event=>{
    const row=event.target.closest("[data-history-step]");if(row)seek(Number(row.dataset.historyStep));
  });
  $("#trace-history")?.addEventListener("keydown",event=>{
    if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-history-step]")){
      event.preventDefault();seek(Number(event.target.dataset.historyStep));
    }
  });
  $("#diagram-zoom-in")?.addEventListener("click",()=>zoomDiagram(1));
  $("#diagram-zoom-out")?.addEventListener("click",()=>zoomDiagram(-1));
  $("#diagram-fit")?.addEventListener("click",centerDiagram);
  bindDiagramPan();
  document.addEventListener("keydown",event=>{
    const key=event.key;
    if(key==="Escape"&&$("#simulator-controls-panel")&&!$("#simulator-controls-panel").hidden){event.preventDefault();toggleControls(false);return;}
    if(key==="Escape"&&document.body.classList.contains("focus")){event.preventDefault();toggleDiagramFullscreen();return;}
    const target=event.target;
    if(target instanceof HTMLElement&&(target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(target.tagName)))return;
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    if(key===" "){event.preventDefault();play();}
    else if(key==="ArrowRight"){event.preventDefault();move(1);}
    else if(key==="ArrowLeft"){event.preventDefault();move(-1);}
    else if(key==="Home"){event.preventDefault();seek(0);}
    else if(key==="End"){event.preventDefault();seek((timeline?.length??1)-1);}
    else if(key==="+"||key==="="){event.preventDefault();zoomDiagram(1);}
    else if(key==="-"||key==="_"){event.preventDefault();zoomDiagram(-1);}
    else if(key==="0"){event.preventDefault();centerDiagram();}
    else if(key.toLowerCase()==="c"){event.preventDefault();if(cameraAuto)setCameraFree();else setCameraFollowing();}
    else if(key.toLowerCase()==="p"){event.preventDefault();togglePredictionMode();}
    else if(key.toLowerCase()==="f"){event.preventDefault();toggleDiagramFullscreen();}
    else if(key==="?"){event.preventDefault();const help=$("#simulator-shortcuts");if(help)help.hidden=!help.hidden;}
  });
  document.querySelector('[data-space="simulator"]')?.addEventListener("click",()=>{
    if(!execution)prepare();
    setMobilePanel("diagram");
    requestAnimationFrame(()=>{syncDockHeight();fitDiagramWhenVisible();if(timeline&&cameraAuto)centerActiveNode(timeline.current,"auto");});
  });
  syncDockHeight();
  const dock=$("#dock");
  if(dock&&"ResizeObserver" in window){
    const dockObserver=new ResizeObserver(()=>syncDockHeight());dockObserver.observe(dock);
  }
  const stage=$("#diagram-stage");
  if(stage&&"ResizeObserver" in window){
    const observer=new ResizeObserver(entries=>{
      const box=entries[0]?.contentRect;
      if(box?.width>0&&box?.height>0)requestAnimationFrame(()=>fitDiagram());
    });
    observer.observe(stage);
  }else window.addEventListener("resize",()=>requestAnimationFrame(()=>fitDiagram()));
  document.addEventListener("traza:request-simulation",event=>{
    exerciseId=Number(event.detail?.exerciseId)||1;
    methodIndex=Number(event.detail?.methodIndex)||0;
    selectedVariable=null;
    prepare();
    requestAnimationFrame(()=>{fitDiagram();if(timeline&&cameraAuto)centerActiveNode(timeline.current,"auto");});
  });
  document.addEventListener("traza:jump-to-step",event=>{
    if(Number.isInteger(event.detail?.index))seek(event.detail.index);
  });
  document.addEventListener("traza:lab-sync-request",publishTrace);
}

export function initSimulator(){
  if(!$("#simulator-run"))return;
  setPseudocodeSize(readPseudocodeSize());
  paintExerciseSelector();
  document.documentElement.style.setProperty("--fs",String(pseudocodeSize));
  setPresentationMode((()=>{try{return localStorage.getItem("traza:v3:presentation-mode")||"appear";}catch{return "appear";}})());
  document.documentElement.style.setProperty("--sim-speed",String(currentSpeedFactor()));
  document.documentElement.style.setProperty("--sim-animation-duration",Math.round(Math.max(100,Math.min(5000,500/currentSpeedFactor())))+"ms");
  syncDockHeight();
  setMobilePanel("diagram");
  updateCameraButton();
  bind();updatePredictionButton();updateFullscreenButton();prepare();
}
