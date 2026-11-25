import { FICHA } from "./content/ficha.js";
import { parseFichaPayload } from "../worker/validation.js";

const $=selector=>document.querySelector(selector);
const copy=value=>JSON.parse(JSON.stringify(value));
const today=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;};
const apiBase=()=>$("meta[name='senapsis-api-base']")?.content?.replace(/\/$/,"")??"";
let state=null,baseVersion=0,dirty=false,saved=false,timer=0,sessionEmail="",classIds=new Map();
const form=$("#admin-daily-form");
const PREVIEW_KEY="senapsis:v1:admin-preview";

async function api(path,options={}){
  const response=await fetch(`${apiBase()}/api/v1${path}`,{credentials:"same-origin",cache:"no-store",...options});
  const body=response.status===204?{}:await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body.details?.join(" ")||body.error||`Error ${response.status}`);
  return body;
}
function feedback(message,kind=""){$("#admin-feedback").textContent=message;$("#admin-draft-status").textContent=kind||message;const managementStatus=$("#admin-management-feedback");if(managementStatus)managementStatus.textContent=message;}
function escape(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function selectOptions(select,items,placeholder){
  select.replaceChildren();const blank=document.createElement("option");blank.value="";blank.textContent=placeholder;select.append(blank);
  for(const item of items){const option=document.createElement("option");option.value=item.id;option.textContent=item.nombre??item.titulo??item.id;select.append(option);}
}
function refreshDailyOptions(){
  const competence=form.elements.competencia.value,instructor=form.elements.instructor.value;
  selectOptions(form.elements.competencia,state.competencias.filter(item=>item.activa!==false&&!item.deletedAt),"Elige una competencia");
  selectOptions(form.elements.instructor,state.instructores.filter(item=>!item.deletedAt),"Instructor por confirmar");
  form.elements.competencia.value=competence;form.elements.instructor.value=instructor;
}
function daySchedule(date){
  const parsed=new Date(`${date}T12:00:00`),day=parsed.getDay()||7;
  return state.horario.find(item=>item.dia===day&&(!item.vigenteDesde||item.vigenteDesde<=date)&&(!item.vigenteHasta||item.vigenteHasta>=date));
}
function updateClassFields(){
  const noClass=form.elements.huboClase.value==="no";
  for(const field of form.querySelectorAll("[data-class-field]")){field.hidden=noClass;for(const control of field.querySelectorAll("input,textarea"))control.disabled=noClass;}
}
function initializeForm(){
  refreshDailyOptions();
  form.elements.fecha.value=today();populateDate(form.elements.fecha.value);
  form.elements.fecha.addEventListener("change",()=>{populateDate(form.elements.fecha.value);scheduleSave();});
  form.addEventListener("input",()=>{updateClassFields();scheduleSave();});
  form.addEventListener("change",()=>{updateClassFields();scheduleSave();});
  updateClassFields();
}
function populateDate(date){
  const current=state.clases.find(item=>item.fecha===date),scheduled=daySchedule(date);
  const competenceId=current?.competenciaId??scheduled?.competenciaId??state.competencias.find(item=>item.activa!==false)?.id??"";
  const previous=current?null:[...state.clases].filter(item=>item.competenciaId===competenceId&&item.fecha<date).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)))[0];
  const record=current??previous,activity=record?state.actividades.find(item=>item.id===`evidencia-${record.id}`):null;
  form.elements.competencia.value=competenceId;form.elements.instructor.value=current?.instructorId??scheduled?.instructorId??record?.instructorId??"";
  form.elements.huboClase.value=current?.estado==="no_hubo"?"no":"si";
  form.elements.titulo.value=current?.titulo??previous?.titulo??"";
  form.elements.temas.value=(record?.temas??[]).map(item=>item.texto).join("\n");
  form.elements.documentos.value=(current?.documentoIds??[]).map(id=>state.documentos.find(item=>item.id===id&&!item.deletedAt)).filter(Boolean).map(item=>`${item.titulo} | ${item.url}`).join("\n");
  form.elements.evidenciaTitulo.value=activity?.titulo??"";form.elements.evidenciaDescripcion.value=activity?.descripcion??"";form.elements.evidenciaLimite.value=activity?.limite??"";
  updateClassFields();
}
function classIdFor(date){
  if(!classIds.has(date)){classIds.set(date,state.clases.find(item=>item.fecha===date)?.id??`clase-${crypto.randomUUID()}`);}
  return classIds.get(date);
}
function topicLines(){return form.elements.temas.value.split(/\r?\n/).map(text=>text.trim()).filter(Boolean).map((texto,index)=>({id:`tema-${classIdFor(form.elements.fecha.value)}-${index+1}`,texto}));}
function documentLines(classId,activityId){
  const offset=state.documentos.filter(item=>item.claseId===classId).length;
  return form.elements.documentos.value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
    const [rawTitle,...urlParts]=line.split("|");const titulo=rawTitle.trim(),url=urlParts.join("|").trim();
    const extension=url.split(/[?#]/)[0].split(".").pop()?.toLowerCase(),host=(()=>{try{return new URL(url).hostname;}catch{return "";}})();
    const mimeType=({pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg"})[extension]??(host==="docs.google.com"?"application/vnd.google-apps.document":host==="drive.google.com"?"application/vnd.google-apps.file":"text/html");
    return {id:`doc-${classId}-${offset+index+1}`,titulo,nombreArchivo:titulo,mimeType,descripcion:"",tamanoBytes:null,url,secciones:["clases","biblioteca"],claseId:classId,actividadId:activityId||null,estadoPublicacion:"publicado",publicadoEn:form.elements.fecha.value,actualizado:form.elements.fecha.value,fuente:"Enlace registrado por moderación"};
  });
}
function compileDraft(){
  const payload=copy(state),date=form.elements.fecha.value,competenciaId=form.elements.competencia.value;
  if(!date||!competenciaId)throw new Error("Completa la fecha y la competencia.");
  const classId=classIdFor(date),classIndex=payload.clases.findIndex(item=>item.id===classId),oldClass=payload.clases[classIndex];
  const activityId=`evidencia-${classId}`,evidenceTitle=form.elements.evidenciaTitulo.value.trim(),activityIndex=payload.actividades.findIndex(item=>item.id===activityId);
  const documents=documentLines(classId,evidenceTitle?activityId:null),documentoIds=documents.map(item=>item.id);
  const title=form.elements.titulo.value.trim()||topicLines().map(item=>item.texto).join(" · ")||"Registro de clase";
  const record={id:classId,fecha:date,competenciaId,instructorId:form.elements.instructor.value||null,titulo:form.elements.huboClase.value==="no"?"No hubo clase":title,temas:form.elements.huboClase.value==="no"?[]:topicLines(),documentoIds,estado:form.elements.huboClase.value==="no"?"no_hubo":"se_dicto"};
  if(classIndex>=0)payload.clases[classIndex]=record;else payload.clases.push(record);
  if(oldClass)for(const item of payload.documentos.filter(doc=>doc.claseId===classId&&!doc.deletedAt))item.deletedAt=date;
  payload.documentos.push(...documents);
  if(activityIndex>=0){if(evidenceTitle)payload.actividades[activityIndex]={...payload.actividades[activityIndex],competenciaId,titulo:evidenceTitle,descripcion:form.elements.evidenciaDescripcion.value.trim(),apertura:date,limite:form.elements.evidenciaLimite.value||null,documentoIds};else payload.actividades[activityIndex].deletedAt=date;}
  else if(evidenceTitle)payload.actividades.push({id:activityId,competenciaId,titulo:evidenceTitle,descripcion:form.elements.evidenciaDescripcion.value.trim(),paraQueSirve:"",instrucciones:[],entregables:[],apertura:date,limite:form.elements.evidenciaLimite.value||null,fuente:"Registro de clase",actualizado:date,leccionIds:[],ejercicioIds:[],documentoIds});
  return payload;
}
async function saveDraft(payloadOverride=null,auditAction="draft_saved"){
  clearTimeout(timer);let payload;
  try{payload=payloadOverride?copy(payloadOverride):compileDraft();}catch(error){feedback(error.message,"Revisa los datos");return false;}
  feedback("Guardando borrador…","Guardando");
  try{
    const result=await api("/admin/draft",{method:"PUT",headers:{"content-type":"application/json","if-match":`"${baseVersion}"`,"x-senapsis-action":auditAction},body:JSON.stringify(payload)});
    state=payload;saved=true;dirty=false;$("[data-admin-publish]").disabled=false;feedback(`Borrador guardado · ${new Date(result.updatedAt).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}`);return true;
  }catch(error){saved=false;feedback(error.message,"No se pudo guardar");return false;}
}
function scheduleSave(payloadOverride=null){
  dirty=true;saved=false;$("[data-admin-publish]").disabled=false;feedback("Cambios pendientes de guardar","Sin guardar");
  clearTimeout(timer);const snapshot=payloadOverride?copy(payloadOverride):null;timer=setTimeout(()=>void saveDraft(snapshot),800);
}
async function publish(){
  clearTimeout(timer);if(dirty&&!await saveDraft())return;
  if(!saved){feedback("Guarda el borrador antes de publicar.");return;}
  try{
    const result=await api("/admin/publish",{method:"POST"});baseVersion=result.version;saved=false;dirty=false;
    $("#admin-version").textContent=`Publicado · versión ${result.version}`;$("[data-admin-publish]").disabled=true;$("[data-admin-undo]").disabled=result.version<2;
    feedback("Publicado. La ficha compartida ya está actualizada.");void renderHistory();
  }catch(error){feedback(error.message,"No se pudo publicar");}
}
async function undo(){
  if(!window.confirm("¿Deshacer la última publicación? Se creará una nueva versión con el contenido anterior."))return;
  try{const result=await api("/admin/undo",{method:"POST"});baseVersion=result.version;$("#admin-version").textContent=`Publicación deshecha · versión ${result.version}`;$("[data-admin-undo]").disabled=true;feedback("Última publicación deshecha.");void renderHistory();}
  catch(error){feedback(error.message,"No se pudo deshacer");}
}
function closePreview(){try{localStorage.removeItem(PREVIEW_KEY);}catch{}}
function openPreview(){
  try{localStorage.setItem(PREVIEW_KEY,JSON.stringify({version:Math.max(1,baseVersion),updatedAt:new Date().toISOString(),payload:state}));}
  catch{feedback("El navegador no permitió preparar la vista previa.","No se pudo abrir");return;}
  const frame=$("#admin-preview-frame"),dialog=$("#admin-preview-dialog");frame.src=`/?preview=admin&v=${Date.now()}`;dialog.showModal();$("[data-admin-preview-close]").focus();
}
function exportBackup(){
  const backup={format:"senapsis-ficha",schemaVersion:1,exportedAt:new Date().toISOString(),payload:state};
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:"application/json"})),link=document.createElement("a");
  link.href=url;link.download=`senapsis-ficha-${today()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importBackup(file){
  if(!file)return;
  if(file.size>512_000){feedback("El respaldo supera el máximo de 500 KiB.","Importación rechazada");return;}
  let backup;try{backup=JSON.parse(await file.text());}catch{feedback("El archivo no contiene JSON válido.","Importación rechazada");return;}
  if(backup?.format!=="senapsis-ficha"||backup.schemaVersion!==1){feedback("El formato o la versión del respaldo no son compatibles.","Importación rechazada");return;}
  const parsed=parseFichaPayload(JSON.stringify(backup.payload));if(parsed.errors.length){feedback(parsed.errors.join(" "),"Respaldo inválido");return;}
  if(!window.confirm("Importar reemplazará el borrador actual de la ficha. ¿Continuar?"))return;
  state=parsed.payload;dirty=true;refreshDailyOptions();renderManagement();
  await saveDraft(state,"backup_imported");
}
async function renderHistory(){
  const host=$("#admin-history");if(!host)return;
  host.textContent="Cargando historial…";
  try{
    const history=await api("/admin/history"),items=history.audit??[];
    if(!items.length){host.textContent="Aún no hay cambios registrados.";return;}
    const list=document.createElement("ol");list.className="admin-history-list";
    for(const item of items){const row=document.createElement("li"),when=new Date(item.created_at),summary=Object.keys(item.summary??{}).join(", ");row.textContent=`${item.action.replaceAll("_"," ")} · ${Number.isInteger(item.version)?`versión ${item.version} · `:""}${Number.isNaN(when.getTime())?item.created_at:when.toLocaleString("es-CO")} · ${item.actor}${summary?` · ${summary}`:""}`;list.append(row);}
    host.replaceChildren(list);
  }catch{host.textContent="No se pudo cargar el historial.";}
}
const slug=value=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||"nuevo-registro";
function manageRows(type,items,secondary){
  return `<div class="admin-manage-list">${items.map(item=>`<div class="admin-manage-row"${item.deletedAt?' data-deleted="true"':""}><span>${escape(item.nombre??item.titulo??item.id)}${item.activa===false?" · Inactiva":""}${item.deletedAt?" · Eliminada":""}<small>${escape(secondary(item))}</small></span><span class="admin-manage-actions"><button type="button" data-manage-edit="${type}" data-id="${escape(item.id)}">Editar</button>${type==="competencia"&&!item.deletedAt?`<button type="button" data-manage-active data-id="${escape(item.id)}">${item.activa===false?"Activar":"Desactivar"}</button>`:""}<button type="button" data-manage-toggle="${type}" data-id="${escape(item.id)}">${item.deletedAt?"Restaurar":"Eliminar"}</button></span></div>`).join("")||'<p class="admin-feedback">Sin registros.</p>'}</div>`;
}
function managementSection(title,type,formMarkup,items,secondary){
  return `<section class="admin-manage-section"><h3>${title}</h3><form class="admin-manage-form" data-manage-form="${type}">${formMarkup}<input type="hidden" name="id"><button type="submit">Guardar ${title.toLocaleLowerCase("es")}</button><button type="reset" data-manage-reset="${type}">Limpiar</button></form>${manageRows(type,items,secondary)}</section>`;
}
function renderManagement(){
  const host=$("#admin-management");if(!host||!state)return;
  host.innerHTML=`<header class="admin-panel-heading"><div><p class="eyebrow">GESTIÓN DE LA FICHA</p><h2>Organiza la información compartida</h2><p>Desactivar conserva la referencia; eliminar usa borrado lógico.</p></div><span class="admin-draft-status">Los cambios se guardan como borrador</span></header><div class="admin-management-grid">${managementSection("Competencias","competencia",'<label class="admin-wide">Nombre<input name="nombre" required maxlength="120"></label><label>Código<input name="codigo" maxlength="40"></label><label>Tipo<select name="tipo"><option value="principal">Principal</option><option value="transversal">Transversal</option></select></label><label>Color<input name="color" type="color" value="#5865d8"></label><label>Forma<select name="forma"><option value="circulo">Círculo</option><option value="rombo">Rombo</option><option value="cuadrado">Cuadrado</option><option value="triangulo">Triángulo</option><option value="hexagono">Hexágono</option></select></label><label>Orden<input name="orden" type="number" min="1" value="99"></label>',state.competencias,item=>`${item.codigo??"Sin código"} · ${item.tipo??"Principal"} · ${item.color??"color del tema"}`)}${managementSection("Horario semanal","horario",'<label>Día<select name="dia"><option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miércoles</option><option value="4">Jueves</option><option value="5">Viernes</option><option value="6">Sábado</option></select></label><label>Competencia<select name="competenciaId" required>'+state.competencias.filter(item=>!item.deletedAt).map(item=>`<option value="${escape(item.id)}">${escape(item.nombre)}</option>`).join("")+'</select></label><label>Inicio<input name="inicio" type="time" required></label><label>Fin<input name="fin" type="time" required></label><label>Instructor<select name="instructorId"><option value="">Por confirmar</option>'+state.instructores.filter(item=>!item.deletedAt).map(item=>`<option value="${escape(item.id)}">${escape(item.nombre)}</option>`).join("")+'</select></label><label>Vigente desde<input name="vigenteDesde" type="date"></label><label>Vigente hasta<input name="vigenteHasta" type="date"></label>',state.horario,item=>`Día ${item.dia} · ${item.inicio}–${item.fin} · ${item.competenciaId}`)}${managementSection("Instructores","instructor",'<label class="admin-wide">Nombre<input name="nombre" required maxlength="120"></label><label>Correo (requiere consentimiento)<input name="correo" type="email"></label><label>Teléfono (requiere consentimiento)<input name="telefono" type="tel"></label><label class="admin-wide">Foto o perfil HTTPS<input name="foto" type="url" placeholder="https://…"></label><label class="admin-wide"><span><input name="contactoPublico" type="checkbox"> Autorizó mostrar sus datos de contacto</span></label>',state.instructores,item=>`${item.contactoPublico?"Contacto público":"Contacto privado"} · ${item.competenciaIds?.length??0} competencias`)}${managementSection("Comunicados","comunicado",'<label class="admin-wide">Título<input name="titulo" required maxlength="160"></label><label class="admin-wide">Texto<textarea name="texto" required maxlength="3000"></textarea></label><label>Fecha<input name="fecha" type="date" required></label><label>Tipo<select name="tipo"><option value="informativo">Informativo</option><option value="importante">Importante</option></select></label><label class="admin-wide"><span><input name="fijado" type="checkbox"> Fijar en el centro de control</span></label>',state.comunicados,item=>`${item.fecha??"Sin fecha"} · ${item.tipo??"Informativo"}${item.fijado?" · Fijado":""}`)}<section class="admin-manage-section"><h3>Datos de la ficha</h3><form class="admin-manage-form" data-manage-form="meta"><label>Programa<input name="programa" required maxlength="120" value="${escape(state.meta.programa)}"></label><label>Código<input name="codigo" required maxlength="50" value="${escape(state.meta.codigo)}"></label><label>Nombre de la ficha<input name="ficha" required maxlength="120" value="${escape(state.meta.ficha)}"></label><label>Actualizado<input name="actualizado" type="date" value="${escape(state.meta.actualizado||today())}"></label><label class="admin-wide">Fuente o nota<input name="fuente" maxlength="500" value="${escape(state.meta.fuente)}"></label><label class="admin-wide"><span><input name="esDemostracion" type="checkbox"${state.meta.esDemostracion?" checked":""}> Mostrar como datos de demostración</span></label><input type="hidden" name="id"><button type="submit">Guardar datos de ficha</button></form></section><section class="admin-manage-section admin-tools"><h3>Vista previa y respaldo</h3><div class="admin-actions"><button type="button" class="admin-button" data-admin-preview>Vista previa como aprendiz</button><button type="button" class="admin-button" data-admin-export>Exportar JSON</button><label class="admin-button admin-import-label">Importar JSON<input type="file" data-admin-import accept="application/json,.json"></label></div><h4>Historial reciente</h4><div id="admin-history" role="status" aria-live="polite">Cargando historial…</div></section></div><p id="admin-management-feedback" class="admin-management-feedback" role="status" aria-live="polite"></p>`;
  void renderHistory();
}
function manageSubmit(event){
  const form=event.target.closest("[data-manage-form]");if(!form)return;
  event.preventDefault();const type=form.dataset.manageForm,data=new FormData(form),id=String(data.get("id")||""),name=String(data.get("nombre")||data.get("titulo")||"").trim();
  if(type==="meta"){
    state.meta={...state.meta,programa:String(data.get("programa")),codigo:String(data.get("codigo")),ficha:String(data.get("ficha")),actualizado:String(data.get("actualizado")||today()),fuente:String(data.get("fuente")||""),esDemostracion:data.get("esDemostracion")==="on"};
    renderManagement();scheduleSave(copy(state));return;
  }
  let collection,key,record;
  if(type==="competencia"){
    collection=state.competencias;key="id";const existing=collection.find(item=>item.id===id),nextId=id||`${slug(name)}-${collection.filter(item=>item.id===slug(name)||item.id.startsWith(`${slug(name)}-`)).length+1}`;
    record={...existing,id:nextId,nombre:name,codigo:String(data.get("codigo")||"Por confirmar").trim(),tipo:String(data.get("tipo")),color:String(data.get("color")),forma:String(data.get("forma")),token:existing?.token??slug(name),orden:Number(data.get("orden"))||99,activa:existing?.activa??true,enAprende:existing?.enAprende??false};
  }else if(type==="instructor"){
    collection=state.instructores;key="id";const existing=collection.find(item=>item.id===id),publicContact=data.get("contactoPublico")==="on";
    record={...existing,id:id||`${slug(name)}-${collection.length+1}`,nombre:name,contactoPublico:publicContact,correo:publicContact?String(data.get("correo")||"").trim():"",telefono:publicContact?String(data.get("telefono")||"").trim():"",foto:String(data.get("foto")||"").trim()};
  }else if(type==="horario"){
    collection=state.horario;key="id";const existing=collection.find(item=>item.id===id),dia=Number(data.get("dia")),inicio=String(data.get("inicio")),fin=String(data.get("fin"));
    if(inicio>=fin){$("#admin-management-feedback").textContent="La hora de fin debe ser posterior al inicio.";return;}
    record={...existing,id:id||`horario-${dia}-${slug(String(data.get("competenciaId")))}`,dia,inicio,fin,competenciaId:String(data.get("competenciaId")),instructorId:String(data.get("instructorId")||"")||null,vigenteDesde:String(data.get("vigenteDesde")||"")||null,vigenteHasta:String(data.get("vigenteHasta")||"")||null};
  }else{
    collection=state.comunicados;key="id";const existing=collection.find(item=>item.id===id);
    record={...existing,id:id||`comunicado-${crypto.randomUUID()}`,titulo:name,texto:String(data.get("texto")||"").trim(),fecha:String(data.get("fecha")),tipo:String(data.get("tipo")),fijado:data.get("fijado")==="on"};
  }
  const index=collection.findIndex(item=>item[key]===record[key]);if(index>=0)collection[index]=record;else collection.push(record);
  refreshDailyOptions();
  renderManagement();scheduleSave(copy(state));
}
function managementClick(event){
  const tab=event.target.closest("[data-admin-tab]");if(tab){const management=tab.dataset.adminTab==="management";$("#admin-daily-form").hidden=management;$("#admin-management").hidden=!management;for(const button of document.querySelectorAll("[data-admin-tab]"))button.setAttribute("aria-pressed",String(button===tab));return;}
  const edit=event.target.closest("[data-manage-edit]");if(edit){const type=edit.dataset.manageEdit,id=edit.dataset.id,item=(type==="competencia"?state.competencias:type==="horario"?state.horario:type==="instructor"?state.instructores:state.comunicados).find(entry=>entry.id===id),form=document.querySelector(`[data-manage-form="${type}"]`);if(!item||!form)return;form.elements.id.value=item.id;for(const [key,value] of Object.entries({nombre:item.nombre,titulo:item.titulo,codigo:item.codigo,tipo:item.tipo,color:item.color,forma:item.forma,orden:item.orden,dia:item.dia,competenciaId:item.competenciaId,inicio:item.inicio,fin:item.fin,instructorId:item.instructorId,vigenteDesde:item.vigenteDesde,vigenteHasta:item.vigenteHasta,correo:item.correo,telefono:item.telefono,foto:item.foto,contactoPublico:item.contactoPublico,fecha:item.fecha,texto:item.texto,fijado:item.fijado}))if(form.elements[key]){if(form.elements[key].type==="checkbox")form.elements[key].checked=value===true;else form.elements[key].value=value??"";}form.querySelector("input:not([type=hidden]),select,textarea")?.focus();return;}
  const active=event.target.closest("[data-manage-active]");if(active){const item=state.competencias.find(entry=>entry.id===active.dataset.id);if(item)item.activa=item.activa===false;refreshDailyOptions();renderManagement();scheduleSave(copy(state));return;}
  const toggle=event.target.closest("[data-manage-toggle]");if(toggle){const type=toggle.dataset.manageToggle,collection=type==="competencia"?state.competencias:type==="horario"?state.horario:type==="instructor"?state.instructores:state.comunicados,item=collection.find(entry=>entry.id===toggle.dataset.id);if(!item)return;if(item.deletedAt)delete item.deletedAt;else item.deletedAt=today();renderManagement();scheduleSave(copy(state));}
}
async function initialize(){
  const alert=$("#admin-access-error");
  try{
    const session=await api("/admin/session");sessionEmail=session.email;$("#admin-session").textContent=`Sesión protegida · ${sessionEmail}`;
    const draft=await api("/admin/draft"),published=await api("/state");baseVersion=draft.baseVersion;
    state=copy(draft.payload??published.payload??FICHA);
    $("#admin-version").textContent=published.version?`Publicado · versión ${published.version}`:"Sin publicar";
    $("[data-admin-undo]").disabled=published.version<2;
    form.hidden=false;initializeForm();
    $("#admin-tabs").hidden=false;$("#admin-management").hidden=true;renderManagement();
    form.addEventListener("submit",event=>{event.preventDefault();void saveDraft();});
    $("[data-admin-publish]").addEventListener("click",()=>void publish());$("[data-admin-undo]").addEventListener("click",()=>void undo());
    $("#admin-tabs").addEventListener("click",managementClick);$("#admin-management").addEventListener("click",managementClick);$("#admin-management").addEventListener("submit",manageSubmit);
    $("#admin-management").addEventListener("click",event=>{if(event.target.closest("[data-admin-preview]"))openPreview();if(event.target.closest("[data-admin-export]"))exportBackup();});
    $("#admin-management").addEventListener("change",event=>{if(event.target.matches("[data-admin-import]")){void importBackup(event.target.files[0]);event.target.value="";}});
    $("#admin-preview-dialog").addEventListener("close",closePreview);$("[data-admin-preview-close]").addEventListener("click",()=>$("#admin-preview-dialog").close());
    void renderHistory();
    document.addEventListener("keydown",event=>{if(event.key==="Enter"&&event.ctrlKey&&event.target.closest("#admin-daily-form")){event.preventDefault();void saveDraft();}});
  }catch(error){alert.hidden=false;alert.textContent=error.message==="access_denied"?"Inicia sesión con el correo autorizado en Cloudflare Access para administrar la ficha.":`No se pudo abrir Administración: ${error.message}.`;$("#admin-session").textContent="Acceso no disponible";}
}

void initialize();
