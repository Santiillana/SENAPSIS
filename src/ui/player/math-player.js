import { mathExerciseById } from "../../math/exercises.js";
import { add, formatDecimalOrRational, formatRational, parseRationalAnswer, rational, subtract } from "../../math/exact.js";
import { createClock } from "../kit/clock.js";

const $=(selector,root=document)=>root.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const exact=value=>value&&typeof value==="object"&&"n" in value?value:parseRationalAnswer(value);
let activeExercise=null,steps=[],activeStep=0,clock=null,raf=0,playing=false,playSpeed=1,fontScale=1;

function ruleSteps(item){
  const {rule,type,expected}=item;
  const result=formatDecimalOrRational(expected),base=type==="directa"?`${rule.a} : ${rule.c} = ${rule.b} : x`:`${rule.a} × ${rule.b} = ${rule.c} × x`;
  const cross=type==="directa"?`${rule.b} × ${rule.c}`:`${rule.a} × ${rule.b}`;
  const denominator=type==="directa"?rule.a:rule.c;
  return [
    {title:"Identifica la relación",detail:`Proporcionalidad ${type}. ${type==="directa"?"Las magnitudes cambian en el mismo sentido.":"El área representa el trabajo constante."}`,kind:type==="inversa"?"area":"table"},
    {title:"Organiza los datos",detail:base,kind:"table"},
    {title:"Multiplica en cruz",detail:cross,kind:"cross"},
    {title:"Despeja la incógnita",detail:`${cross} ÷ ${denominator} = ${result}`,result:expected,kind:"result"},
    {title:"Comprueba el resultado",detail:item.verification,result:expected,kind:"check"}
  ];
}
function rationalSteps(item){
  const fractions=[...item.expression.matchAll(/([−-]?\d+)\s*\/\s*(\d+)/g)].map(match=>({n:BigInt(match[1].replace("−","-")),d:BigInt(match[2])}));
  if(!fractions.length)return item.solution.map(step=>({title:"Resuelve la operación",detail:`${step.expression} = ${step.result}`,expression:step.expression,result:step.result,kind:"tree"}));
  const lcm=fractions.reduce((current,value)=>{
    const gcd=(a,b)=>b?gcd(b,a%b):a;
    const denominator=value.d<0n?-value.d:value.d;
    return current/gcd(current,denominator)*denominator;
  },1n);
  const converted=item.expression.replace(/([−-]?\d+)\s*\/\s*(\d+)/g,(_match,n,d)=>`${BigInt(n.replace("−","-"))*(lcm/BigInt(d))}/${lcm}`);
  const operation=item.solution.map(step=>`${step.expression} = ${step.result}`).join(" → ");
  return [
    {title:"Encuentra el denominador común",detail:`Los denominadores se pueden expresar en ${lcm}.`,kind:"fraction"},
    {title:"Convierte en fracciones equivalentes",detail:converted,kind:"fraction"},
    {title:"Opera conservando el tamaño de las partes",detail:operation||item.expression,kind:"fraction"},
    {title:"Simplifica el resultado",detail:`${item.expression} = ${item.expectedText}`,result:item.expected,kind:"result"}
  ];
}
function buildSteps(item){
  if(item.pending)return [];
  if(item.topic==="regla-de-tres")return ruleSteps(item);
  if(item.topic==="racionales")return rationalSteps(item);
  return item.solution.map(step=>({title:"Resuelve según la jerarquía",detail:`${step.expression} = ${step.result}`,expression:step.expression,result:step.result,left:step.left,right:step.right,operator:step.operator,kind:"tree"}));
}
function fractionBarsMarkup(expression){
  const fractions=[...expression.matchAll(/([−-]?\d+)\s*\/\s*(\d+)/g)];
  return '<div class="math-fraction-bars" aria-label="Barras divididas en partes iguales">'+fractions.map(match=>{
    const numerator=BigInt(match[1].replace("−","-")),denominator=BigInt(match[2]),absolute=numerator<0n?-numerator:numerator;
    const wholes=absolute/denominator,remainder=absolute%denominator,parts=Number(denominator),filled=Number(remainder);
    return '<div class="math-frac-unit '+(numerator<0n?"is-negative":"")+'"><strong>'+esc(match[0])+'</strong>'+(wholes?'<span>'+wholes+' unidad(es) completa(s)</span>':"")+'<div>'+Array.from({length:parts},(_,index)=>'<i class="'+(index<filled?"is-filled":"")+'"></i>').join("")+'</div></div>';
  }).join("")+'</div>';
}
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
function currentVisual(step){
  if(activeExercise.topic==="regla-de-tres"){
    const {rule,type}=activeExercise;
    if(type==="inversa"&&step.kind==="area")return '<div class="math-player-area" role="img" aria-label="Rectángulo de área constante, 24 unidades de trabajo"><div><span>Trabajo constante</span><strong>'+rule.a+' × '+rule.b+' = '+(rule.a*rule.b)+'</strong><section style="--area-columns:6">'+Array.from({length:24},()=>'<i></i>').join("")+'</section></div><b aria-hidden="true">↔</b><div><span>Al cambiar personas</span><strong>'+rule.c+' × x</strong><section style="--area-columns:8">'+Array.from({length:24},()=>'<i></i>').join("")+'</section></div></div>';
    const firstRight=type==="directa"?rule.c:rule.b,secondLeft=type==="directa"?rule.b:rule.c;
    return '<div class="math-player-table" role="img" aria-label="Tabla de regla de tres '+type+'"><div><b>'+esc(rule.unitA)+'</b><b>'+esc(rule.unitB)+'</b></div><div><span>'+rule.a.toLocaleString("es-CO")+'</span><span>'+firstRight.toLocaleString("es-CO")+'</span></div><div><span>'+secondLeft.toLocaleString("es-CO")+'</span><strong>'+esc(step.result?formatDecimalOrRational(step.result):"x")+'</strong></div>'+((step.kind==="cross"||step.kind==="result")?'<svg class="math-cross-lines" viewBox="0 0 240 88" aria-hidden="true"><path d="M48 25 192 68M192 25 48 68"/></svg>':"")+'</div>';
  }
  if(activeExercise.topic==="racionales"){
    return '<div class="math-player-fraction" role="img" aria-label="Paso de operación con barras de fracciones"><strong>'+esc(activeExercise.expression)+'</strong>'+fractionBarsMarkup(activeExercise.expression)+'<span>'+esc(step.detail)+'</span><b>'+esc(step.result?formatRational(exact(step.result)):activeExercise.expectedText)+'</b></div>';
  }
  const expression=activeExercise.expression,highlight=step.expression??"",comparable=expression.replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/"),position=highlight?comparable.indexOf(highlight):-1;
  const highlighted=position<0?esc(expression):esc(expression.slice(0,position))+'<mark>'+esc(highlight)+'</mark>'+esc(expression.slice(position+highlight.length));
  const operation=step.left!==undefined?'<div class="math-player-operation"><span>'+esc(step.left)+'</span><b>'+esc(step.operator)+'</b>'+(step.right!==undefined?'<span>'+esc(step.right)+'</span>':"")+'<i>→</i><strong>'+esc(step.result)+'</strong></div>':"";
  return '<div class="math-player-expression" role="img" aria-label="Árbol de expresión y operación actual"><strong>'+highlighted+'</strong>'+operation+'<span>'+esc(step.detail)+'</span><b>'+esc(step.result?formatRational(exact(step.result)):activeExercise.expectedText)+'</b></div>';
}
function render(){
  const root=$("#math-player");if(!root||!activeExercise)return;
  root.hidden=false;
  if(activeExercise.pending){root.innerHTML='<div class="math-player-empty"><p class="eyebrow">POR CONFIRMAR CON EL ORIGINAL</p><h2>'+esc(activeExercise.title)+'</h2><p>'+esc(activeExercise.statement)+'</p><button type="button" class="button button-secondary" data-math-player-close>Volver a ejercicios</button></div>';return;}
  const step=steps[Math.max(0,Math.min(activeStep,steps.length-1))],partial=steps.slice(0,activeStep+1).filter(item=>item.result!==undefined);
  root.style.setProperty("--math-player-scale",String(fontScale));
  root.innerHTML='<header class="math-player-head"><div><p class="eyebrow">SIMULADOR · MATEMÁTICAS</p><h2>'+esc(activeExercise.title)+'</h2><p>'+esc(activeExercise.statement)+'</p></div><button type="button" class="button button-secondary" data-math-player-close>← Volver</button></header>'+
    '<div class="math-player-layout"><main class="math-player-main"><div class="math-player-progress"><span>PASO '+(activeStep+1)+' / '+steps.length+'</span><strong>'+esc(step.title)+'</strong></div><div class="math-player-stage" aria-live="polite">'+currentVisual(step)+'</div><p class="math-player-explanation">'+esc(step.detail)+'</p><div class="math-player-mini"><span class="eyebrow">VISTA RÁPIDA</span><strong>'+esc(step.result!==undefined?`${step.expression??step.detail} → ${formatDecimalOrRational(exact(step.result))}`:step.detail)+'</strong><span>'+esc(activeExercise.topic==="regla-de-tres"?(activeExercise.type==="directa"?"Más tiempo, más producción.":"Más personas, menos tiempo."):activeExercise.topic==="racionales"?"Busca partes del mismo tamaño.":"Primero multiplicar y dividir.")+'</span><details><summary>Ver más</summary><p>'+esc(activeExercise.topic==="regla-de-tres"?step.detail:activeExercise.statement)+'</p></details></div>'+predictMarkup(step,activeStep)+'</main><aside class="math-player-side"><section><h3>Resultados parciales</h3><ol>'+partial.map((item,index)=>'<li class="'+(index===partial.length-1?"is-current":"")+'">'+(index===partial.length-1?'<strong>':'<del>')+esc(formatRational(exact(item.result)))+(index===partial.length-1?'</strong>':'</del>')+'</li>').join("")+'</ol></section><details class="math-player-solution"><summary>Ver solución paso a paso</summary><ol>'+steps.map(item=>'<li><strong>'+esc(item.title)+'</strong><p>'+esc(item.detail)+'</p></li>').join("")+'</ol><b>Resultado: '+esc(activeExercise.expectedText)+'</b></details><section class="math-player-tools"><h3>Presentación</h3><button type="button" data-math-player-action="smaller" aria-label="Reducir texto">A−</button><button type="button" data-math-player-action="larger" aria-label="Aumentar texto">A+</button><button type="button" data-math-player-action="center">Centrar escena</button><button type="button" data-math-player-action="focus" aria-pressed="'+String(document.body.classList.contains("math-focus"))+'">Concentración</button></section></aside></div>'+playerControls();
}
function playerControls(){return '<footer class="math-player-controls" aria-label="Controles del reproductor"><button type="button" data-math-player-action="first" aria-label="Primer paso">|◀</button><button type="button" data-math-player-action="previous" aria-label="Paso anterior">◀</button><button type="button" data-math-player-action="play" aria-label="Reproducir o pausar">'+(playing?"Ⅱ Pausar":"▶ Reproducir")+'</button><button type="button" data-math-player-action="next" aria-label="Paso siguiente">▶</button><button type="button" data-math-player-action="last" aria-label="Último paso">▶|</button><input type="range" min="0" max="'+Math.max(0,steps.length-1)+'" value="'+activeStep+'" step="1" data-math-player-range aria-label="Buscar paso"><label>Velocidad <select data-math-player-speed><option value="0.5" '+(clock?.speed===.5?"selected":"")+'>0,5×</option><option value="1" '+((clock?.speed??1)===1?"selected":"")+'>1×</option><option value="2" '+(clock?.speed===2?"selected":"")+'>2×</option></select></label></footer>';}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;clock?.pause();playing=false;}
function setStep(step){stop();activeStep=Math.max(0,Math.min(steps.length-1,step));clock?.seek(activeStep*1400);render();}
function play(){if(playing){stop();render();return;}if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.motion==="reduced")return;if(activeStep>=steps.length-1)activeStep=0;clock=createClock({duration:steps.length*1400,speed:playSpeed});clock.seek(activeStep*1400);clock.play();playing=true;render();let previous=null;const frame=timestamp=>{if(!playing||!clock)return;if(previous!==null){clock.advance(Math.min(100,Math.max(0,timestamp-previous)));const next=Math.min(steps.length-1,Math.floor(clock.time/1400));if(next!==activeStep){activeStep=next;render();}}previous=timestamp;if(clock.playing)raf=requestAnimationFrame(frame);else{playing=false;raf=0;render();}};raf=requestAnimationFrame(frame);}
function openExercise(id,provided){activeExercise=provided?.id===id?provided:mathExerciseById(id);if(!activeExercise)return;stop();steps=buildSteps(activeExercise);activeStep=0;clock=createClock({duration:Math.max(1,steps.length)*1400,speed:playSpeed});const root=$("#math-player"),view=$("#view-simulator");if(root){root.hidden=false;view.dataset.mathPlayer="true";}render();}
function hidePlayer(){stop();document.body.classList.remove("math-focus");const root=$("#math-player"),view=$("#view-simulator");if(root)root.hidden=true;if(view)delete view.dataset.mathPlayer;}
function close(){hidePlayer();document.querySelector('#primary-nav [data-space="exercises"]')?.click();}
function bind(){
  document.addEventListener("traza:open-math-player",event=>openExercise(event.detail?.exerciseId,event.detail?.exercise));
  document.addEventListener("traza:close-math-player",hidePlayer);
  document.addEventListener("traza:space-change",event=>{if(event.detail?.space==="simulator"&&activeExercise)render();});
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
