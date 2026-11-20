import { escapeHTML } from "./common.js";

const TYPE_LABELS={P:"Primaria",S:"Secundaria",T:"Terciaria"};
const badge=type=>`<span class="source-type-badge source-badge-${type}" aria-label="Fuente ${TYPE_LABELS[type]}"><b aria-hidden="true">${type}</b></span>`;

export function renderClassificationScene(scene){
  const data=scene?.tipo==="clasificacion"?scene.datos:null,source=data?.source;
  if(!source)return '<section class="source-classification-scene"><p>Escena de clasificación no disponible.</p></section>';
  const labels=source.type==="P"?[{title:source.title,type:source.type},{title:"Persona analista",symbol:"⌕"}]:source.type==="S"?[{title:"Dato o actividad original",symbol:"▤"},{title:source.title,type:source.type},{title:"Persona analista",symbol:"⌕"}]:[{title:"Información original",symbol:"▤"},{title:"Documento fuente",symbol:"▤"},{title:source.title,type:source.type},{title:"Persona analista",symbol:"⌕"}];
  const nodes=labels.map((node,index)=>`<span class="source-sim-route-node ${index===labels.length-1?"is-current":"is-passed"}">${node.type?badge(node.type):`<b class="source-sim-route-symbol" aria-hidden="true">${node.symbol}</b>`}<small>${escapeHTML(node.title)}</small></span>`).join('<span class="source-sim-route-arrow" aria-hidden="true">→</span>');
  const output=data.emitted.map(item=>`<article>${badge(source.type)}<b>${escapeHTML(item.id)}</b><span>${escapeHTML(item.text)}</span></article>`).join("");
  const destination=output?"Hoja de requisitos":"Análisis";
  return `<section class="source-classification-scene" aria-label="Clasificación de fuente"><div class="source-sim-route">${nodes}<span class="source-sim-route-destination">${destination}</span></div><article class="source-sim-contribution"><div class="source-sim-evidence-type">${badge(source.type)}<span>${source.hops} salto${source.hops===1?"":"s"} desde el origen</span></div><p class="eyebrow">QUÉ APORTA</p><strong>${escapeHTML(source.contribution)}</strong>${output?`<div class="source-sim-emitted">${output}</div>`:'<p class="source-sim-no-requirement">Esta fuente orienta la búsqueda; no produce un requisito directo.</p>'}</article><details class="source-sim-mini-window" open><summary>Qué aporta y qué limita</summary><div><p><b>Aporta</b>${escapeHTML(source.contribution)}</p><p><b>Límite</b>${escapeHTML(source.limitation)}</p></div></details></section>`;
}
