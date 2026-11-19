import { FICHA } from "../content/ficha.js";

const SNAPSHOT_KEY="traza:v1:ficha-publicada";
const API_BASE=()=>document.querySelector('meta[name="traza-api-base"]')?.content?.replace(/\/$/,"")??"";
const fields=["meta","competencias","instructores","horario","horarioNotas","comunicados","actividades","clases","documentos","recursos","accesos"];
let lastRefresh=0,refreshPromise=null;

function showSyncStatus(message,kind="online"){
  const indicator=document.querySelector("#ficha-sync-indicator");if(!indicator)return;
  indicator.textContent=message;indicator.dataset.status=kind;indicator.hidden=!message;
}
function updatedLabel(value){
  const date=value?new Date(value):new Date();if(Number.isNaN(date.getTime()))return "Actualizado";
  const today=new Intl.DateTimeFormat("en-CA").format(new Date()),dateLabel=new Intl.DateTimeFormat("en-CA").format(date);
  const time=new Intl.DateTimeFormat("es-CO",{hour:"2-digit",minute:"2-digit"}).format(date);
  return dateLabel===today?`Actualizado hoy a las ${time}`:`Actualizado ${new Intl.DateTimeFormat("es-CO",{day:"numeric",month:"short"}).format(date)} a las ${time}`;
}

export function isPublishedFicha(value){
  return Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&fields.every(field=>Object.hasOwn(value,field))&&
    value.meta&&typeof value.meta==="object"&&fields.filter(field=>field!=="meta").every(field=>Array.isArray(value[field])));
}
function applyPayload(payload){
  if(!isPublishedFicha(payload))return false;
  for(const key of Object.keys(FICHA))delete FICHA[key];
  for(const field of fields)FICHA[field]=payload[field];
  if(!FICHA.meta.version)FICHA.meta.version="publicada";
  FICHA.meta.esDemostracion=payload.meta.esDemostracion===true;
  return true;
}
function readSnapshot(){
  try{
    const stored=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)??"null");
    if(!stored||!Number.isInteger(stored.version)||stored.version<1||!isPublishedFicha(stored.payload))return null;
    return stored;
  }catch{return null;}
}
function restoreSnapshot(){const stored=readSnapshot();if(stored)applyPayload(stored.payload);return stored;}
function saveSnapshot(value){try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(value));}catch{}}
async function registerOfflineShell(){
  if(!("serviceWorker"in navigator)||!isSecureContext)return;
  try{await navigator.serviceWorker.register("/service-worker.js",{scope:"/"});}catch{}
}

async function refreshPublishedState(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
    const base=API_BASE(),current=readSnapshot();
    const versionResponse=await fetch(`${base}/api/v1/version`,{cache:"no-store",credentials:"same-origin",signal:AbortSignal.timeout(6000)});
    if(!versionResponse.ok)throw new Error("No se pudo consultar la versión publicada.");
    const versionInfo=await versionResponse.json();
    if(!Number.isInteger(versionInfo.version)||versionInfo.version<1)return;
    if(current?.version===versionInfo.version){lastRefresh=Date.now();showSyncStatus(updatedLabel(versionInfo.updatedAt??current.updatedAt));return;}
    const stateResponse=await fetch(`${base}/api/v1/state`,{cache:"no-store",credentials:"same-origin",headers:current?{"If-None-Match":`"${current.version}"`}:{},signal:AbortSignal.timeout(8000)});
    if(stateResponse.status===304){lastRefresh=Date.now();return;}
    if(!stateResponse.ok)throw new Error("No se pudo descargar la ficha publicada.");
    const state=await stateResponse.json();
    if(state.version!==versionInfo.version||!isPublishedFicha(state.payload))throw new Error("La publicación recibida no coincide con el formato esperado.");
    if(!applyPayload(state.payload))return;
    saveSnapshot(state);lastRefresh=Date.now();
    const wasUpdated=Boolean(current&&current.version<state.version);
    showSyncStatus(`${wasUpdated?"Nuevo · ":""}${updatedLabel(state.updatedAt)}`);
    document.dispatchEvent(new CustomEvent("traza:ficha-actualizada",{detail:{version:state.version,updatedAt:state.updatedAt,source:"remote",newlyPublished:wasUpdated}}));
  })().catch(()=>{
    const stored=readSnapshot();if(stored)showSyncStatus(`Sin conexión · ${updatedLabel(stored.updatedAt)}`,"offline");
  }).finally(()=>{refreshPromise=null;});
  return refreshPromise;
}

export function initFichaRepository(){
  const stored=restoreSnapshot();
  if(stored)showSyncStatus(`Sin conexión · ${updatedLabel(stored.updatedAt)}`,"offline");
  void registerOfflineShell();
  void refreshPublishedState();
  const refresh=()=>{if(Date.now()-lastRefresh>30_000)void refreshPublishedState();};
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh();});
  document.addEventListener("traza:space-change",event=>{const indicator=document.querySelector("#ficha-sync-indicator");if(indicator)indicator.hidden=event.detail?.section!=="ficha"||!indicator.textContent;});
}
