import { evaluateMathExpression, formatDecimalOrRational, rational, solveDirectRule, solveInverseRule } from "./exact.js";

function hashSeed(seed){let hash=2166136261;for(const char of String(seed)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
function randomSource(seed){let state=hashSeed(seed)||1;return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};}
const integer=(random,min=2,max=12)=>Math.floor(random()*(max-min+1))+min;
const signed=(random,min=2,max=12)=>integer(random,min,max)*(random()<.5?-1:1);

export function generateMathExercise(topic,difficulty=1,seed="senapsis"){
  if(!["enteros","racionales","regla-de-tres"].includes(topic))throw new RangeError("Tema matemático desconocido.");
  if(!Number.isInteger(difficulty)||difficulty<1||difficulty>4)throw new RangeError("La dificultad debe estar entre 1 y 4.");
  const random=randomSource(`${topic}:${difficulty}:${seed}`),id=`GEN-${topic.toUpperCase()}-${difficulty}-${hashSeed(seed).toString(16)}`;
  if(topic==="enteros"){
    let expression;
    if(difficulty===1){const a=signed(random),b=signed(random);expression=`${a<0?`(${a})`:a}+(${b})`;}
    else if(difficulty===2){const a=signed(random),b=integer(random),c=integer(random,2,8),d=integer(random,2,8);expression=`${a}×${b}+${c*d}÷${d}`;}
    else if(difficulty===3){const a=signed(random),b=integer(random),c=integer(random,2,5),d=integer(random,2,9);expression=`(${a}+${b})×${c}−${d}`;}
    else {const a=signed(random),b=integer(random),c=integer(random,2,5),d=integer(random),e=integer(random,2,5);expression=`[${a}−(${b}×${c})]+${d}×${e}`;}
    const result=evaluateMathExpression(expression);
    return {id,topic,difficulty,title:"Reto generado · Números enteros",statement:"Resuelve respetando los signos y la jerarquía de operaciones.",expression,expected:result.value,expectedText:result.formatted,solution:result.steps,classExercise:false,seed:String(seed)};
  }
  if(topic==="racionales"){
    const a=integer(random,1,7),b=integer(random,1,7),d=integer(random,2,9),sign=random()<.5?"−":"+";
    let expression;
    if(difficulty===1)expression=`${a}/${d}+${b}/${d}`;
    else if(difficulty===2){const multiplier=integer(random,2,4);expression=`${a}/${d}+${b}/${d*multiplier}`;}
    else if(difficulty===3){let other=integer(random,2,9);while(other===d)other=integer(random,2,9);expression=`${a}/${d}+${b}/${other}`;}
    else expression=`(${sign}${a}/${d}+${b}/${d*2})−${integer(random,1,4)}/${d}`;
    const result=evaluateMathExpression(expression);
    return {id,topic,difficulty,title:"Reto generado · Números racionales",statement:"Opera con fracciones exactas y simplifica el resultado.",expression,expected:result.value,expectedText:result.formatted,solution:result.steps,classExercise:false,seed:String(seed)};
  }
  const decimalLevel=difficulty===4,a=decimalLevel?4:integer(random,2,12),scale=decimalLevel?1:integer(random,2,8),b=decimalLevel?3+2*integer(random,0,3):a*scale,c=decimalLevel?integer(random,8,60)*2+1:integer(random,15,120),type=difficulty===1||difficulty===4?"directa":difficulty===2?"inversa":random()<.5?"directa":"inversa";
  const expected=type==="directa"?solveDirectRule(a,b,c):solveInverseRule(a,c,b);
  const prompt=type==="directa"?`${a} unidades producen ${c} resultados. ¿Cuántos resultados corresponden a ${b} unidades?`:`${a} personas completan un trabajo en ${c} horas. ¿Cuántas horas tardan ${b} personas?`;
  return {id,topic,difficulty,title:"Reto generado · Regla de tres",statement:prompt,type,rule:{a,b,c},expected,expectedText:formatDecimalOrRational(expected),classExercise:false,seed:String(seed),verification:type==="directa"?"Comprueba la tasa por unidad.":"Comprueba que el producto de magnitudes se conserva."};
}
