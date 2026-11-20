import { formatDecimalOrRational, formatRational, parseRationalAnswer } from "../../math/exact.js";

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

export function buildCalculationSteps(item){
  if(item.pending)return [];
  if(item.topic==="regla-de-tres")return ruleSteps(item);
  if(item.topic==="racionales")return rationalSteps(item);
  return item.solution.map(step=>({title:"Resuelve según la jerarquía",detail:`${step.expression} = ${step.result}`,expression:step.expression,result:step.result,left:step.left,right:step.right,operator:step.operator,kind:"tree"}));
}

export const calculationTemplate=Object.freeze({
  construirPasos(exercise,domainSteps){
    if(!exercise||!Array.isArray(domainSteps))return [];
    return domainSteps.map((step,index)=>({
      id:`calculo:${exercise.id}:${index+1}`,foco:String(step.kind??"calculo"),globo:String(step.detail??""),
      escena:{tipo:"calculo",datos:{exercise,step,index,count:domainSteps.length}},
      estado:{resultadoParcial:step.result??null,paso:index+1,total:domainSteps.length},
      salida:step.result===undefined?[]:[formatRational(exact(step.result))],
      frase:String(step.title??step.detail??"Paso de cálculo")
    }));
  }
});

function exact(value){return value&&typeof value==="object"&&"n" in value?value:parseRationalAnswer(value);}
