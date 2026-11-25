import { escapeHTML } from "../scenes/common.js";

const recipes = {
  algorithm: {
    id:"R02-algorithm", idea:"Un algoritmo es una ruta: cada instrucción marca el siguiente paso.", term:"Algoritmo",
    cierre:"El orden de las instrucciones lleva de Inicio a Fin.",
    moments:["Aparece Inicio","Se conectan los pasos","La ruta llega a Fin"],
    figures:[["terminal","Inicio"],["input","Leer n"],["process","doble = n × 2"],["output","Mostrar doble"],["terminal","Fin"]]
  },
  reading: {
    id:"R02-sequence", idea:"Las flechas son calles de un solo sentido. Síguelas para encontrar el paso que continúa.", term:"Flujo y secuencia",
    cierre:"La dirección de cada flecha define el orden.",
    moments:["Se conectan tres pasos","La bolita sigue las flechas","El recorrido conserva su orden"],
    figures:[["process","Paso 1"],["process","Paso 2"],["process","Paso 3"]]
  },
  terminals: {
    id:"R01-figures", idea:"Como en un mapa, cada símbolo anuncia qué ocurre en ese punto.", term:"Símbolo de diagrama",
    cierre:"La forma indica el papel de cada instrucción.",
    moments:["Inicio y Fin usan óvalos","Las instrucciones toman su forma","Las flechas conectan el recorrido"],
    figures:[["terminal","Inicio"],["input","Leer"],["process","Proceso"],["decision","Decisión"],["document","Imprimir"],["terminal","Fin"]]
  },
  input: {
    id:"R05-input", idea:"Leer funciona como un mostrador: recibes un dato y lo guardas para usarlo.", term:"Entrada de datos",
    cierre:"El dato entra por Leer y queda guardado en la variable indicada.",
    moments:["Aparece Leer", "El dato 2 llega por la entrada", "El valor queda en B"],
    figures:[["input","Leer B"],["process","2"],["process","B = 2"],["process","Continuar"]]
  },
  process: {
    id:"R08-process", idea:"Un proceso transforma los datos y conserva el resultado para el siguiente paso.", term:"Proceso",
    cierre:"El proceso calcula el resultado antes de enviarlo a la salida.",
    moments:["Aparecen los valores", "La operación combina los datos", "El resultado queda guardado"],
    figures:[["process","A = 2"],["process","A × B"],["process","A = 4"]]
  },
  output: {
    id:"R06-output", idea:"Imprimir copia un valor en la pantalla. La variable conserva su contenido.", term:"Salida de datos",
    cierre:"Imprimir muestra el valor y deja intacta la variable.",
    moments:["El valor está en la variable", "Una copia llega a Imprimir", "El valor aparece en pantalla"],
    figures:[["process","resultado = 4"],["document","Imprimir resultado"],["output","4 en pantalla"]]
  },
  variables: {
    id:"R03-variables", idea:"Una variable es un casillero con nombre. Guarda un valor y puede recibir otro después.", term:"Variable y asignación",
    cierre:"La asignación guarda el nuevo valor en A; B conserva el suyo.",
    moments:["A y B aparecen vacías", "B entrega una copia de su valor", "El valor nuevo queda guardado en A"],
    figures:[["process","A = ∅"],["process","B = 17"],["process","A = B"],["process","A = 17"]]
  },
  arithmetic: {
    id:"R08-arithmetic", idea:"Una operación mezcla valores como ingredientes y produce un resultado.", term:"Operación aritmética",
    cierre:"La operación calcula A × B y guarda el resultado en A.",
    moments:["A y B llegan a la operación", "La expresión muestra 2 × 2", "El resultado 4 se guarda en A"],
    figures:[["process","A = 2"],["process","A × B"],["process","2 × 2"],["process","A = 4"]]
  },
  comparisons: {
    id:"R09-comparisons", idea:"Una comparación responde una pregunta para que el algoritmo pueda elegir qué hacer.", term:"Operador relacional",
    cierre:"La comparación produce verdadero o falso para dirigir la decisión.",
    moments:["Aparece la pregunta edad ≥ 18", "Se comparan 20 y 18", "El resultado verdadero permite continuar"],
    figures:[["process","edad ≥ 18"],["process","20 ≥ 18"],["decision","¿Verdadero?"],["process","Sí · continuar"]]
  },
  decisions: {
    id:"R09-decisions", idea:"Una decisión es un cruce con una pregunta. La respuesta indica qué camino seguir.", term:"Decisión y condición",
    cierre:"La condición es verdadera; el flujo continúa por Sí ✓.",
    moments:["El rombo pregunta si edad ≥ 18", "20 ≥ 18 resulta verdadero", "La bolita sigue la rama Sí"],
    figures:[["process","edad ≥ 18"],["process","20 ≥ 18"],["decision","¿Se cumple?"],["process","Continuar"]],
    choices:["Sí ✓","No ✗"]
  },
  "nested-decisions": {
    id:"R09-nested-decisions", idea:"Una condición puede abrir otra pregunta. Cada respuesta lleva a una ruta concreta.", term:"Decisión anidada",
    cierre:"La segunda pregunta solo se evalúa dentro de la primera ruta elegida.",
    moments:["Se evalúa la primera condición", "La ruta Sí abre otra pregunta", "La segunda respuesta elige el resultado"],
    figures:[["decision","¿Mayor de edad?"],["decision","¿Tiene permiso?"],["process","Permitir ingreso"]],
    choices:["Sí ✓","No ✗"]
  },
  "counters-accumulators": {
    id:"R11-counters", idea:"Un contador suma unidades. Un acumulador reúne cantidades que cambian en cada vuelta.", term:"Contador y acumulador",
    cierre:"El contador aumenta de uno en uno; el acumulador recibe cada monto.",
    moments:["El contador empieza en 0", "Entra una persona y suma 1", "El acumulador agrega el monto"],
    figures:[["process","cont = 0"],["process","entra persona"],["process","cont = cont + 1"],["process","suma += monto"]]
  },
  for: {
    id:"R12-for", idea:"Un ciclo Para recorre una pista un número definido de veces.", term:"Ciclo Para",
    cierre:"El ciclo inicia M en 1, repite mientras M sea menor que E y aumenta M en cada vuelta.",
    moments:["La cabecera reúne inicio, condición y avance", "M empieza en 1 y la condición se cumple", "El cuerpo se ejecuta y M aumenta", "La condición deja de cumplirse y el ciclo termina"],
    figures:[["loop","M=1; M<E; M++"],["process","M = 1"],["decision","1 < 4 · Sí ✓"],["process","Ejecutar cuerpo"],["process","M++ · M = 2"]],
    loopPartByMoment:[0,1,2,1]
  },
  while: {
    id:"R13-while", idea:"Mientras repite una acción mientras su condición siga siendo verdadera.", term:"Ciclo Mientras",
    cierre:"La condición se revisa antes de cada vuelta; al cambiar a falso, el ciclo termina.",
    moments:["La condición se comprueba antes del cuerpo", "La respuesta Sí permite una vuelta", "El cuerpo cambia el valor comprobado", "La condición pasa a No y el ciclo termina"],
    figures:[["decision","¿Hay sol?"],["process","Jugar"],["process","El sol se oculta"],["decision","¿Hay sol? No ✗"]],
    choices:["Sí ✓","No ✗"]
  },
  "do-while": {
    id:"R13-do-while", idea:"Hacer–Mientras ejecuta el cuerpo una vez y después comprueba si debe repetir.", term:"Ciclo Hacer–Mientras",
    cierre:"El cuerpo ocurre antes de comprobar la condición de repetición.",
    moments:["El cuerpo se ejecuta primero", "La condición se comprueba después", "Si es verdadera, comienza otra vuelta", "Cuando es falsa, el ciclo termina"],
    figures:[["process","Hacer: jugar"],["decision","¿Sigue habiendo sol?"],["process","Repetir"],["output","Fin"]],
    choices:["Sí ✓","No ✗"]
  },
  "nested-loops": {
    id:"R16-nested-loops", idea:"En ciclos anidados, la pista interior se recorre completa dentro de cada vuelta exterior.", term:"Ciclos anidados",
    cierre:"El ciclo interior termina antes de que avance el contador exterior.",
    moments:["Empieza una vuelta exterior", "El contador interior vuelve a empezar", "El ciclo interior completa sus vueltas", "Avanza el contador exterior"],
    figures:[["loop","I=1; I<=2; I++"],["process","J = 1"],["process","Cuerpo interior"],["process","J++"],["process","I++"]],
    loopPartByMoment:[0,1,2,2],
    returnLink:[3,1]
  },
  "validation-sentinel": {
    id:"R17-validation", idea:"Un valor centinela marca el final de una serie y no se procesa como un dato normal.", term:"Validación y centinela",
    cierre:"El centinela detiene la repetición y queda fuera de los datos procesados.",
    moments:["Leer un dato", "Comprobar si es el centinela", "Procesar el dato válido", "Repetir hasta encontrar el centinela"],
    figures:[["input","Leer dato"],["decision","¿dato = -1?"],["process","Procesar dato"],["output","Terminar"]],
    choices:["Sí ✓","No ✗"],
    returnLink:[2,0]
  }
};

function explanationRole(type,label){
  if(type==="input")return "data";
  if(type==="output"||type==="document")return "result";
  if(type==="loop")return "repeat";
  if(type==="terminal")return "structure";
  if(type==="decision")return "decision";
  if(type==="process"&&/(?:\+\+|\+=|cont(?:ador)?|contador|suma)/i.test(label))return "counter";
  if(type==="process"&&(/(?:>=|<=|==|!=|≥|≤|>|<)/.test(label)||/[×÷+*/]/.test(label)))return "calculation";
  return "variable";
}

function wrapLabel(label,limit){
  const words=label.split(/\s+/),lines=[];
  let line="";
  for(const word of words){
    const candidate=line?line+" "+word:word;
    if(line&&candidate.length>limit){lines.push(line);line=word;}else line=candidate;
  }
  if(line)lines.push(line);
  return lines;
}

const roleNames={focus:"Ahora: mira aquí",structure:"Trazo: estructura y camino",data:"Dato: entra",calculation:"Cálculo: se transforma",result:"Resultado: sale",repeat:"Repite: ciclo",variable:"Variable: memoria",counter:"Contador: avance"};

function shape(type,x,y,label,active,index,activePart=-1){
  const role=explanationRole(type,label);
  const common='class="recipe-node recipe-role-'+role+(active?" is-active":"")+'"';
  let figure="";
  if(type==="terminal")figure='<ellipse '+common+' cx="'+x+'" cy="'+y+'" rx="57" ry="31"/>';
  else if(type==="input"||type==="output")figure='<polygon '+common+' points="'+(x-48)+','+(y-28)+' '+(x+58)+','+(y-28)+' '+(x+48)+','+(y+28)+' '+(x-58)+','+(y+28)+'"/>';
  else if(type==="decision")figure='<polygon '+common+' points="'+x+','+(y-38)+' '+(x+64)+','+y+' '+x+','+(y+38)+' '+(x-64)+','+y+'"/>';
  else if(type==="document")figure='<path '+common+' d="M'+(x-49)+' '+(y-30)+'h88l12 12v48h-100z M'+(x+39)+' '+(y-30)+'v13h13"/>';
  else if(type==="loop")figure='<polygon '+common+' points="'+(x-70)+','+(y-31)+' '+(x+53)+','+(y-31)+' '+(x+70)+','+y+' '+(x+53)+','+(y+31)+' '+(x-70)+','+(y+31)+' '+(x-53)+','+y+'"/>';
  else figure='<rect '+common+' x="'+(x-66)+'" y="'+(y-32)+'" width="132" height="64" rx="7"/>';
  let text;
  if(type==="loop"&&label.includes(";"))text='<text class="recipe-node-label recipe-loop-label recipe-role-text-'+role+'" x="'+x+'" y="'+(y+5)+'" text-anchor="middle">'+label.split(";").map((part,position)=>'<tspan class="'+(position===activePart?"is-active":"")+'">'+escapeHTML(part.trim())+'</tspan>').join('<tspan> ; </tspan>')+'</text>';
  else{
    const limit=type==="decision"?9:type==="terminal"?11:type==="input"||type==="output"?12:type==="loop"?14:type==="document"?11:14;
    const lines=wrapLabel(label,limit),offset=(lines.length-1)*8;
    text='<text class="recipe-node-label recipe-role-text-'+role+'" x="'+x+'" y="'+(y+5-offset)+'" text-anchor="middle">'+lines.map((line,lineIndex)=>'<tspan x="'+x+'" dy="'+(lineIndex===0?0:16)+'">'+escapeHTML(line)+'</tspan>').join("")+'</text>';
  }
  return figure+text+'<text class="recipe-order" x="'+x+'" y="'+(y+57)+'" text-anchor="middle">'+(index+1)+'</text>';
}

export function lessonRecipe(id){return recipes[id]??null;}

export function recipeSceneMarkup(recipe,frame=0,momentIndex=0){
  if(!recipe)return "";
  const nodes=recipe.figures,margin=76,width=760,y=106;
  const gap=nodes.length>1?(width-margin*2)/(nodes.length-1):0;
  const xs=nodes.map((_,index)=>margin+gap*index);
  const current=Math.max(0,Math.min(nodes.length-1,frame));
  const halfWidth=kind=>kind==="terminal"?57:kind==="decision"?64:kind==="loop"?70:kind==="input"||kind==="output"?58:kind==="document"?55:66;
  const halfHeight=kind=>kind==="decision"?38:kind==="terminal"?31:32;
  const arrows=nodes.slice(1).map((_,index)=>'<path class="recipe-arrow" d="M'+(xs[index]+halfWidth(nodes[index][0])+3)+' '+y+'H'+(xs[index+1]-halfWidth(nodes[index+1][0])-10)+'" marker-end="url(#recipe-arrowhead)"/>').join("");
  const activePart=recipe.loopPartByMoment?.[momentIndex]??-1;
  const shapes=nodes.map(([kind,label],index)=>shape(kind,xs[index],y,label,index===current,index,kind==="loop"?activePart:-1)).join("");
  const choiceIndex=nodes.findIndex(([kind])=>kind==="decision"),choiceX=xs[choiceIndex];
  const choices=recipe.choices&&choiceIndex>=0?'<path class="recipe-choice-arrow" d="M'+(choiceX-18)+' 151L'+(choiceX-62)+' 176M'+(choiceX+18)+' 151L'+(choiceX+62)+' 176" marker-end="url(#recipe-arrowhead)"/><g class="recipe-choice"><rect x="'+(choiceX-122)+'" y="185" width="60" height="30" rx="15"/><text x="'+(choiceX-92)+'" y="205" text-anchor="middle">'+escapeHTML(recipe.choices[0])+'</text></g><g class="recipe-choice"><rect x="'+(choiceX+62)+'" y="185" width="60" height="30" rx="15"/><text x="'+(choiceX+92)+'" y="205" text-anchor="middle">'+escapeHTML(recipe.choices[1])+'</text></g>':'';
  const [from,to]=recipe.returnLink??[];
  const returnPath=Number.isInteger(from)&&Number.isInteger(to)?'<path class="recipe-return" d="M'+(xs[from]+halfWidth(nodes[from][0])+4)+' '+y+'H'+(width-12)+'V30H'+xs[to]+'V'+(y-halfHeight(nodes[to][0])-9)+'" marker-end="url(#recipe-arrowhead)"/>':'';
  const roles=[...new Set(nodes.map(([kind,label])=>explanationRole(kind,label)).filter(role=>role!=="decision"))];
  const legendRoles=["focus",...roles],legendStart=(width-legendRoles.length*136)/2;
  const legend='<g class="recipe-legend" aria-hidden="true">'+legendRoles.map((role,index)=>'<g class="recipe-legend-item recipe-role-'+role+'" transform="translate('+(legendStart+index*136)+' 0)"><circle cx="0" cy="0" r="5"/><text x="9" y="4">'+escapeHTML(roleNames[role]??role)+'</text></g>').join("")+'</g>';
  const legendY=recipe.choices?240:205,height=recipe.choices?258:224;
  const usedNames=legendRoles.map(role=>roleNames[role]??role).join("; ");
  return '<svg class="lesson-recipe-svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+escapeHTML(recipe.cierre+" Colores: "+usedNames)+ '"><defs><marker id="recipe-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>'+arrows+returnPath+choices+shapes+'<circle class="recipe-guide" cx="'+xs[0]+'" cy="55" r="8" transform="translate('+(xs[current]-xs[0])+' 0)" aria-hidden="true"/><g transform="translate(0 '+legendY+')">'+legend+'</g></svg>';
}

export function recipeFrame(recipe,step,eventCount=1){
  if(!recipe)return 0;
  const count=Math.max(1,eventCount),progress=count===1?0:Math.max(0,Math.min(1,step/(count-1)));
  const moment=Math.round(progress*(recipe.moments.length-1));
  return Math.round((recipe.moments.length<=1?0:moment/(recipe.moments.length-1))*(recipe.figures.length-1));
}

export function recipeMomentIndex(recipe,step,eventCount=1){
  if(!recipe)return 0;
  const count=Math.max(1,eventCount),progress=count===1?0:Math.max(0,Math.min(1,step/(count-1)));
  return Math.round(progress*(recipe.moments.length-1));
}

export function recipeMoment(recipe,step,eventCount=1){
  if(!recipe)return "";
  return recipe.moments[recipeMomentIndex(recipe,step,eventCount)];
}
