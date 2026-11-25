import { mathExerciseById } from "../../math/exercises.js";
import { add, formatDecimalOrRational, formatRational, parseRationalAnswer, rational, subtract } from "../../math/exact.js";
import { createClock } from "../kit/clock.js";
import { createSimulatorShell } from "../simulator-shell.js";
import { buildCalculationSteps, calculationTemplate } from "../templates/calculation.js";
import { renderCalculationScene } from "../scenes/calculation.js";

const $=(selector,root=document)=>root.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const exact=value=>value&&typeof value==="object"&&"n" in value?value:parseRationalAnswer(value);
let activeExercise=null,steps=[],activeStep=0,timeline=null,clock=null,raf=0,playing=false,playSpeed=1,fontScale=1;
function exactChoiceValues(value){
  value=exact(value);
  const one=rational(1),choices=[value,add(value,one),subtract(value,one)];
  return [...new Map(choices.map(item=>[formatRational(item),item])).values()];
}
function predictMarkup(step,index){
  if(activeExercise.topic==="regla-de-tres"){
    const correct=activeExercise.type;
    return '<section class="math-predict" aria-label="Predice el tipo de proporción"><h3>Predice</h3><p>¿Qué tipo de proporción describe este problema?</p>'+[correct,correct==="directa"?"inversa":"directa"].sort((a,b)=>(a.charCodeAt(0)+index)%3-(b.charCodeAt(0)+index)%3).map((option,i)=>'<button type="button" data-math-predict="'+option+'">'+(i===0?"A":"B")+' · '+option+'</button>').join("")+'<p class="math-predict-feedback" role="status"></p></section>';
  }
  const current=step.result??activeExercise.expected,options=exactChoiceValues(current);
  while(options.length<3)options.push(add(current,rational(BigInt(options.length+1))));
  const ordered=[...options].slice(0,3).sort((a,b)=>{
    const av=String(a.n)+"/"+a.d,bv=String(b.n)+"/"+b.d;
    return (av.length+index)%5-(bv.length+index)%5;
  });
  return '<section class="math-predict" aria-label="Predice el resultado parcial"><h3>Predice</h3><p>¿Cuál será el resultado de este paso?</p>'+ordered.map((option,i)=>'<button type="button" data-math-predict="'+esc(formatRational(option))+'">'+String.fromCharCode(65+i)+' · '+esc(formatRational(option))+'</button>').join("")+'<p class="math-predict-feedback" role="status"></p></section>';
}
function render(){
  const root=$("#math-player");if(!root||!activeExercise)return;
  root.hidden=false;
  if(activeExercise.pending){root.innerHTML='<div class="math-player-empty"><p class="eyebrow">POR CONFIRMAR CON EL ORIGINAL</p><h2>'+esc(activeExercise.title)+'</h2><p>'+esc(activeExercise.statement)+'</p><button type="button" class="button button-secondary" data-math-player-close>Volver a ejercicios</button></div>';return;}
  const step=timeline.current.escena.datos.step,partial=steps.slice(0,activeStep+1).filter(item=>item.result!==undefined);
  root.style.setProperty("--math-player-scale",String(fontScale));
  root.innerHTML='<header class="math-player-head"><div><p class="eyebrow">SIMULADOR · MATEMÁTICAS</p><h2>'+esc(activeExercise.title)+'</h2><p>'+esc(activeExercise.statement)+'</p></div><button type="button" class="button button-secondary" data-math-player-close>← Volver</button></header>'+
    '<div class="math-player-layout"><main class="math-player-main"><div class="math-player-progress"><span>PASO '+(activeStep+1)+' / '+steps.length+'</span><strong>'+esc(step.title)+'</strong></div><div class="math-player-stage" aria-live="polite">'+renderCalculationScene(timeline.current.escena)+'</div><p class="math-player-explanation">'+esc(step.detail)+'</p><div class="math-player-mini"><span class="eyebrow">VISTA RÁPIDA</span><strong>'+esc(step.result!==undefined?`${step.expression??step.detail} → ${formatDecimalOrRational(exact(step.result))}`:step.detail)+'</strong><span>'+esc(activeExercise.topic==="regla-de-tres"?(activeExercise.type==="directa"?"Más tiempo, más producción.":"Más personas, menos tiempo."):activeExercise.topic==="racionales"?"Busca partes del mismo tamaño.":"Primero multiplicar y dividir.")+'</span><details><summary>Ver más</summary><p>'+esc(activeExercise.topic==="regla-de-tres"?step.detail:activeExercise.statement)+'</p></details></div>'+predictMarkup(step,activeStep)+'</main><aside class="math-player-side"><section><h3>Resultados parciales</h3><ol>'+partial.map((item,index)=>'<li class="'+(index===partial.length-1?"is-current":"")+'">'+(index===partial.length-1?'<strong>':'<del>')+esc(formatRational(exact(item.result)))+(index===partial.length-1?'</strong>':'</del>')+'</li>').join("")+'</ol></section><details class="math-player-solution"><summary>Ver solución paso a paso</summary><ol>'+steps.map(item=>'<li><strong>'+esc(item.title)+'</strong><p>'+esc(item.detail)+'</p></li>').join("")+'</ol><b>Resultado: '+esc(activeExercise.expectedText)+'</b></details><section class="math-player-tools"><h3>Presentación</h3><button type="button" data-math-player-action="smaller" aria-label="Reducir texto">A−</button><button type="button" data-math-player-action="larger" aria-label="Aumentar texto">A+</button><button type="button" data-math-player-action="center">Centrar escena</button><button type="button" data-math-player-action="focus" aria-pressed="'+String(document.body.classList.contains("math-focus"))+'">Concentración</button></section></aside></div>'+playerControls();
}
function playerControls(){return '<footer class="math-player-controls" aria-label="Controles del reproductor"><button type="button" data-math-player-action="first" aria-label="Primer paso">|◀</button><button type="button" data-math-player-action="previous" aria-label="Paso anterior">◀</button><button type="button" data-math-player-action="play" aria-label="Reproducir o pausar">'+(playing?"Ⅱ Pausar":"▶ Reproducir")+'</button><button type="button" data-math-player-action="next" aria-label="Paso siguiente">▶</button><button type="button" data-math-player-action="last" aria-label="Último paso">▶|</button><input type="range" min="0" max="'+Math.max(0,steps.length-1)+'" value="'+activeStep+'" step="1" data-math-player-range aria-label="Buscar paso"><label>Velocidad <select data-math-player-speed><option value="0.5" '+(clock?.speed===.5?"selected":"")+'>0,5×</option><option value="1" '+((clock?.speed??1)===1?"selected":"")+'>1×</option><option value="2" '+(clock?.speed===2?"selected":"")+'>2×</option></select></label></footer>';}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;clock?.pause();playing=false;}
function setStep(step){stop();timeline.seek(step);activeStep=timeline.index;clock?.seek(activeStep*1400);render();}
function play(){if(playing){stop();render();return;}if(!steps.length||window.matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.motion==="reduced")return;if(activeStep>=steps.length-1){timeline.first();activeStep=timeline.index;}clock=createClock({duration:steps.length*1400,speed:playSpeed});clock.seek(activeStep*1400);clock.play();playing=true;render();let previous=null;const frame=timestamp=>{if(!playing||!clock)return;if(previous!==null){clock.advance(Math.min(100,Math.max(0,timestamp-previous)));const next=Math.min(steps.length-1,Math.floor(clock.time/1400));if(next!==activeStep){timeline.seek(next);activeStep=timeline.index;render();}}previous=timestamp;if(clock.playing)raf=requestAnimationFrame(frame);else{playing=false;raf=0;timeline.last();activeStep=timeline.index;render();}};raf=requestAnimationFrame(frame);}
function openExercise(id,provided){activeExercise=provided?.id===id?provided:mathExerciseById(id);if(!activeExercise)return;stop();steps=buildCalculationSteps(activeExercise);timeline=steps.length?createSimulatorShell(calculationTemplate,activeExercise,steps):null;activeStep=timeline?.index??0;clock=createClock({duration:Math.max(1,steps.length)*1400,speed:playSpeed});const root=$("#math-player"),view=$("#view-simulator");if(root){root.hidden=false;view.dataset.mathPlayer="true";}render();}
function hidePlayer(){stop();document.body.classList.remove("math-focus");const root=$("#math-player"),view=$("#view-simulator");if(root)root.hidden=true;if(view)delete view.dataset.mathPlayer;}
function close(){hidePlayer();document.querySelector('#primary-nav [data-space="exercises"]')?.click();}
function bind(){
  document.addEventListener("senapsis:open-math-player",event=>openExercise(event.detail?.exerciseId,event.detail?.exercise));
  document.addEventListener("senapsis:close-math-player",hidePlayer);
  document.addEventListener("senapsis:space-change",event=>{if(event.detail?.space==="simulator"&&activeExercise)render();});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.body.classList.contains("math-focus")){document.body.classList.remove("math-focus");render();}});
  $("#math-player")?.addEventListener("click",event=>{
    if(event.target.closest("[data-math-player-close]")){close();return;}
    const prediction=event.target.closest("[data-math-predict]");if(prediction){const correct=activeExercise.topic==="regla-de-tres"?prediction.dataset.mathPredict===activeExercise.type:prediction.dataset.mathPredict===formatRational(exact(steps[activeStep].result??activeExercise.expected));const feedback=$(".math-predict-feedback",$("#math-player"));if(feedback)feedback.textContent=correct?"Correcto. El cálculo conserva exactamente los valores.":"Revisa el paso activo y vuelve a predecir.";prediction.classList.add(correct?"is-correct":"is-wrong");return;}
    const action=event.target.closest("[data-math-player-action]")?.dataset.mathPlayerAction;if(!action)return;
    if(action==="first")setStep(0);else if(action==="previous")setStep(activeStep-1);else if(action==="next")setStep(activeStep+1);else if(action==="last")setStep(steps.length-1);else if(action==="play")play();else if(action==="smaller"){fontScale=Math.max(.85,fontScale-.1);render();}else if(action==="larger"){fontScale=Math.min(1.3,fontScale+.1);render();}else if(action==="center")$(".math-player-stage",$("#math-player"))?.scrollIntoView({block:"center",behavior:"smooth"});else if(action==="focus"){document.body.classList.toggle("math-focus");render();}
  });
  $("#math-player")?.addEventListener("change",event=>{if(event.target.matches("[data-math-player-range]"))setStep(Number(event.target.value));if(event.target.matches("[data-math-player-speed]")){playSpeed=Number(event.target.value);clock?.setSpeed(playSpeed);}});
}
export function initMathPlayer(){bind();}
