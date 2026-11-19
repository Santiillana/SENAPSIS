import { FICHA } from "./content/ficha.js";

const $=selector=>document.querySelector(selector);
const copy=value=>JSON.parse(JSON.stringify(value));
const today=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;};
const apiBase=()=>$("meta[name='traza-api-base']")?.content?.replace(/\/$/,"")??"";
let state=null,baseVersion=0,dirty=false,saved=false,timer=0,sessionEmail="",classIds=new Map();
const form=$("#admin-daily-form");

async function api(path,options={}){
  const response=await fetch(`${apiBase()}/api/v1${path}`,{credentials:"same-origin",cache:"no-store",...options});
  const body=response.status===204?{}:await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body.details?.join(" ")||body.error||`Error ${response.status}`);
  return body;
}
function feedback(message,kind=""){$("#admin-feedback").textContent=message;$("#admin-draft-status").textContent=kind||message;}
function escape(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function selectOptions(select,items,placeholder){
  select.replaceChildren();const blank=document.createElement("option");blank.value="";blank.textContent=placeholder;select.append(blank);
  for(const item of items){const option=document.createElement("option");option.value=item.id;option.textContent=item.nombre??item.nombre;select.append(option);}
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
  selectOptions(form.elements.competencia,state.competencias.filter(item=>item.activa!==false),"Elige una competencia");
  selectOptions(form.elements.instructor,state.instructores,"Instructor por confirmar");
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
async function saveDraft(){
  clearTimeout(timer);let payload;
  try{payload=compileDraft();}catch(error){feedback(error.message,"Revisa los datos");return false;}
  feedback("Guardando borrador…","Guardando");
  try{
    const result=await api("/admin/draft",{method:"PUT",headers:{"content-type":"application/json","if-match":`"${baseVersion}"`},body:JSON.stringify(payload)});
    state=payload;saved=true;dirty=false;$("[data-admin-publish]").disabled=false;feedback(`Borrador guardado · ${new Date(result.updatedAt).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}`);return true;
  }catch(error){saved=false;feedback(error.message,"No se pudo guardar");return false;}
}
function scheduleSave(){
  dirty=true;saved=false;$("[data-admin-publish]").disabled=false;feedback("Cambios pendientes de guardar","Sin guardar");
  clearTimeout(timer);timer=setTimeout(()=>void saveDraft(),800);
}
async function publish(){
  clearTimeout(timer);if(dirty&&!await saveDraft())return;
  if(!saved){feedback("Guarda el borrador antes de publicar.");return;}
  try{
    const result=await api("/admin/publish",{method:"POST"});baseVersion=result.version;saved=false;dirty=false;
    $("#admin-version").textContent=`Publicado · versión ${result.version}`;$("[data-admin-publish]").disabled=true;$("[data-admin-undo]").disabled=result.version<2;
    feedback("Publicado. La ficha compartida ya está actualizada.");
  }catch(error){feedback(error.message,"No se pudo publicar");}
}
async function undo(){
  if(!window.confirm("¿Deshacer la última publicación? Se creará una nueva versión con el contenido anterior."))return;
  try{const result=await api("/admin/undo",{method:"POST"});baseVersion=result.version;$("#admin-version").textContent=`Publicación deshecha · versión ${result.version}`;$("[data-admin-undo]").disabled=true;feedback("Última publicación deshecha.");}
  catch(error){feedback(error.message,"No se pudo deshacer");}
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
    form.addEventListener("submit",event=>{event.preventDefault();void saveDraft();});
    $("[data-admin-publish]").addEventListener("click",()=>void publish());$("[data-admin-undo]").addEventListener("click",()=>void undo());
    document.addEventListener("keydown",event=>{if(event.key==="Enter"&&event.ctrlKey&&event.target.closest("#admin-daily-form")){event.preventDefault();void saveDraft();}});
  }catch(error){alert.hidden=false;alert.textContent=error.message==="access_denied"?"Inicia sesión con el correo autorizado en Cloudflare Access para administrar la ficha.":`No se pudo abrir Administración: ${error.message}.`;$("#admin-session").textContent="Acceso no disponible";}
}

void initialize();
