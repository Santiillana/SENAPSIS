import { formatDecimalOrRational, formatRational, parseRationalAnswer } from "../../math/exact.js";
import { escapeHTML } from "./common.js";

const exact=value=>value&&typeof value==="object"&&"n" in value?value:parseRationalAnswer(value);
const esc=escapeHTML;

function fractionBarsMarkup(expression){
  const fractions=[...expression.matchAll(/([−-]?\d+)\s*\/\s*(\d+)/g)];
  return '<div class="math-fraction-bars" aria-label="Barras divididas en partes iguales">'+fractions.map(match=>{
    const numerator=BigInt(match[1].replace("−","-")),denominator=BigInt(match[2]),absolute=numerator<0n?-numerator:numerator;
    const wholes=absolute/denominator,remainder=absolute%denominator,parts=Number(denominator),filled=Number(remainder);
    return '<div class="math-frac-unit '+(numerator<0n?"is-negative":"")+'"><strong>'+esc(match[0])+'</strong>'+(wholes?'<span>'+wholes+' unidad(es) completa(s)</span>':"")+'<div>'+Array.from({length:parts},(_,index)=>'<i class="'+(index<filled?"is-filled":"")+'"></i>').join("")+'</div></div>';
  }).join("")+'</div>';
}

export function renderCalculationScene(scene){
  const data=scene?.tipo==="calculo"?scene.datos:null,exercise=data?.exercise,step=data?.step;
  if(!exercise||!step)return '<div class="math-player-empty">Escena de cálculo no disponible.</div>';
  if(exercise.topic==="regla-de-tres"){
    const {rule,type}=exercise;
    if(type==="inversa"&&step.kind==="area")return '<div class="math-player-area" role="img" aria-label="Rectángulo de área constante, 24 unidades de trabajo"><div><span>Trabajo constante</span><strong>'+rule.a+' × '+rule.b+' = '+(rule.a*rule.b)+'</strong><section style="--area-columns:6">'+Array.from({length:24},()=>'<i></i>').join("")+'</section></div><b aria-hidden="true">↔</b><div><span>Al cambiar personas</span><strong>'+rule.c+' × x</strong><section style="--area-columns:8">'+Array.from({length:24},()=>'<i></i>').join("")+'</section></div></div>';
    const firstRight=type==="directa"?rule.c:rule.b,secondLeft=type==="directa"?rule.b:rule.c;
    return '<div class="math-player-table" role="img" aria-label="Tabla de regla de tres '+esc(type)+'"><div><b>'+esc(rule.unitA)+'</b><b>'+esc(rule.unitB)+'</b></div><div><span>'+rule.a.toLocaleString("es-CO")+'</span><span>'+firstRight.toLocaleString("es-CO")+'</span></div><div><span>'+secondLeft.toLocaleString("es-CO")+'</span><strong>'+esc(step.result?formatDecimalOrRational(step.result):"x")+'</strong></div>'+((step.kind==="cross"||step.kind==="result")?'<svg class="math-cross-lines" viewBox="0 0 240 88" aria-hidden="true"><path d="M48 25 192 68M192 25 48 68"/></svg>':"")+'</div>';
  }
  if(exercise.topic==="racionales")return '<div class="math-player-fraction" role="img" aria-label="Paso de operación con barras de fracciones"><strong>'+esc(exercise.expression)+'</strong>'+fractionBarsMarkup(exercise.expression)+'<span>'+esc(step.detail)+'</span><b>'+esc(step.result?formatRational(exact(step.result)):exercise.expectedText)+'</b></div>';
  const expression=exercise.expression,highlight=step.expression??"",comparable=expression.replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/"),position=highlight?comparable.indexOf(highlight):-1;
  const highlighted=position<0?esc(expression):esc(expression.slice(0,position))+'<mark>'+esc(highlight)+'</mark>'+esc(expression.slice(position+highlight.length));
  const operation=step.left!==undefined?'<div class="math-player-operation"><span>'+esc(step.left)+'</span><b>'+esc(step.operator)+'</b>'+(step.right!==undefined?'<span>'+esc(step.right)+'</span>':"")+'<i>→</i><strong>'+esc(step.result)+'</strong></div>':"";
  return '<div class="math-player-expression" role="img" aria-label="Árbol de expresión y operación actual"><strong>'+highlighted+'</strong>'+operation+'<span>'+esc(step.detail)+'</span><b>'+esc(step.result?formatRational(exact(step.result)):exercise.expectedText)+'</b></div>';
}
