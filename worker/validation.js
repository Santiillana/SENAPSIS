const FICHA_FIELDS=["meta","competencias","instructores","horario","horarioNotas","comunicados","actividades","clases","documentos","recursos","accesos"];
const META_FIELDS=["programa","codigo","version","ficha","actualizado","fuente","esDemostracion"];
const ARRAY_FIELDS=FICHA_FIELDS.filter(field=>field!=="meta");
const DATE_FIELDS=["fecha","apertura","limite","actualizado","vigenteDesde","vigenteHasta","deletedAt"];

export function validateFichaPayload(payload){
  const errors=[];
  if(!payload||typeof payload!=="object"||Array.isArray(payload))return ["La ficha debe ser un objeto."];
  for(const field of Object.keys(payload))if(!FICHA_FIELDS.includes(field))errors.push(`Campo no permitido: ${field}.`);
  for(const field of FICHA_FIELDS)if(!Object.hasOwn(payload,field))errors.push(`Falta el campo ${field}.`);
  if(!payload.meta||typeof payload.meta!=="object"||Array.isArray(payload.meta))errors.push("meta debe ser un objeto.");
  for(const field of ARRAY_FIELDS)if(!Array.isArray(payload[field]))errors.push(`${field} debe ser una lista.`);
  if(errors.length)return errors;
  for(const field of Object.keys(payload.meta))if(!META_FIELDS.includes(field))errors.push(`Campo meta no permitido: ${field}.`);
  if(typeof payload.meta.esDemostracion!=="boolean")errors.push("meta.esDemostracion debe ser booleano.");
  for(const field of META_FIELDS.filter(field=>field!=="esDemostracion"))if(typeof payload.meta[field]!=="string")errors.push(`meta.${field} debe ser texto.`);
  if(payload.meta.actualizado&&!/^\d{4}-\d{2}-\d{2}$/.test(payload.meta.actualizado))errors.push("meta.actualizado debe usar AAAA-MM-DD.");
  for(const field of ARRAY_FIELDS){
    const ids=new Set();
    payload[field].forEach((item,index)=>{
      const path=`${field}[${index}]`;
      if(!item||typeof item!=="object"||Array.isArray(item)){errors.push(`${path} debe ser un objeto.`);return;}
      if(typeof item.id!=="string"||!item.id.trim())errors.push(`${path}.id es obligatorio.`);
      else if(ids.has(item.id))errors.push(`${path}.id está duplicado.`);else ids.add(item.id);
      for(const key of DATE_FIELDS){
        if(item[key]==null||item[key]==="")continue;
        if(typeof item[key]!=="string"||!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(item[key])||Number.isNaN(Date.parse(item[key])))errors.push(`${path}.${key} no es una fecha válida.`);
      }
      if(Object.hasOwn(item,"url")&&item.url!=null&&item.url!==""){
        try{if(new URL(item.url).protocol!=="https:")errors.push(`${path}.url debe usar HTTPS.`);}catch{errors.push(`${path}.url no es un enlace válido.`);}
      }
      for(const [key,value] of Object.entries(item))if(typeof value==="string"&&value.length>20_000)errors.push(`${path}.${key} supera el máximo permitido.`);
    });
  }
  return errors;
}

export function parseFichaPayload(text){
  if(typeof text!=="string"||new TextEncoder().encode(text).byteLength>512_000)return {payload:null,errors:["El cuerpo supera el máximo de 500 KiB."]};
  let body;try{body=JSON.parse(text);}catch{return {payload:null,errors:["El cuerpo debe ser JSON válido."]};}
  const errors=validateFichaPayload(body);
  return errors.length?{payload:null,errors}:{payload:body,errors:[]};
}
