import { FICHA } from "../content/ficha.js";
import { documentosPublicados } from "./documentos.js";
import { formatearFecha, escaparHTML } from "./view-utils.js";
import { competenceMarker } from "./competencias-ui.js";

let consulta = "";
let filtros = { competencia: "todas", tema: "todos", instructor: "todos", tipo: "todos", desde: "", hasta: "" };
let orden = "reciente";
let destacado = null;
let timerDestacado;

const nombreCompetencia = id => FICHA.competencias.find(item => item.id === id)?.nombre ?? "Competencia por confirmar";
const nombreInstructor = id => FICHA.instructores.find(item => item.id === id)?.nombre ?? "Instructor por confirmar";
function tipoDocumento(documento) {
  const mime = (documento.mimeType || "").toLowerCase();
  const name = (documento.nombreArchivo || "").toLowerCase();
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.includes("presentation") || /\.pptx?$/.test(name)) return "presentacion";
  if (mime.includes("spreadsheet") || /\.xlsx?$/.test(name)) return "hoja";
  if (mime.startsWith("image/")) return "imagen";
  if (mime.startsWith("video/")) return "video";
  return "enlace";
}
function valor(documento, campo) {
  return campo === "competencia" ? documento.competenciaId || "por-confirmar" :
    campo === "instructor" ? documento.instructorId || "por-confirmar" :
      documento[campo] || "por-confirmar";
}
export function filtrarDocumentosBiblioteca(documentos, textoBusqueda = "", filtrosActivos = filtros, ordenActual = orden) {
  const texto = textoBusqueda.trim().toLocaleLowerCase("es");
  return documentos.filter(documento => {
    const contenido = [documento.titulo, documento.nombreArchivo, documento.descripcion, documento.tema, nombreCompetencia(documento.competenciaId), nombreInstructor(documento.instructorId)].join(" ").toLocaleLowerCase("es");
    if (texto && !contenido.includes(texto)) return false;
    if (filtrosActivos.competencia !== "todas" && valor(documento, "competencia") !== filtrosActivos.competencia) return false;
    if (filtrosActivos.tema !== "todos" && valor(documento, "tema") !== filtrosActivos.tema) return false;
    if (filtrosActivos.instructor !== "todos" && valor(documento, "instructor") !== filtrosActivos.instructor) return false;
    if (filtrosActivos.tipo !== "todos" && tipoDocumento(documento) !== filtrosActivos.tipo) return false;
    if (filtrosActivos.desde && (!documento.publicadoEn || documento.publicadoEn < filtrosActivos.desde)) return false;
    if (filtrosActivos.hasta && (!documento.publicadoEn || documento.publicadoEn > filtrosActivos.hasta)) return false;
    return true;
  }).sort((a, b) => (ordenActual === "reciente" ? b.publicadoEn.localeCompare(a.publicadoEn) : a.publicadoEn.localeCompare(b.publicadoEn)) || a.id.localeCompare(b.id));
}
function listaDocumentos() {
  return filtrarDocumentosBiblioteca(documentosPublicados("biblioteca"), consulta);
}

function opciones(campo, titulo, items) {
  const current = filtros[campo];
  const option = ([id, label]) => `<option value="${escaparHTML(id)}"${current === id ? " selected" : ""}>${escaparHTML(label)}</option>`;
  const contents = campo === "competencia" ? ["principal", "transversal"].map(tipo => {
    const group = items.filter(([, , category]) => category === tipo);
    return group.length ? `<optgroup label="${tipo === "principal" ? "Principales" : "Transversales"}">${group.map(option).join("")}</optgroup>` : "";
  }).join("") + items.filter(([, , category]) => !category).map(option).join("") : items.map(option).join("");
  return `<label>${titulo}<select data-library-filter="${campo}"><option value="${campo === "competencia" ? "todas" : "todos"}">Todas</option>${contents}</select></label>`;
}
function renderFiltros() {
  const docs = documentosPublicados("biblioteca");
  const documentCompetences = new Set(docs.map(d => d.competenciaId).filter(Boolean));
  const competencias = FICHA.competencias.filter(item => documentCompetences.has(item.id)).sort((a,b)=>(a.tipo==="principal"?0:1)-(b.tipo==="principal"?0:1)||a.orden-b.orden).map(item => [item.id, item.nombre, item.tipo]);
  const temas = [...new Set(docs.map(d => d.tema).filter(Boolean))].map(id => [id, id]);
  const instructores = [...new Set(docs.map(d => d.instructorId).filter(Boolean))].map(id => [id, nombreInstructor(id)]);
  const tipos = [["pdf", "PDF"], ["enlace", "Enlace"], ["presentacion", "Presentación"], ["hoja", "Hoja de cálculo"], ["imagen", "Imagen"], ["video", "Video"]];
  const hayFiltrosActivos = Object.entries(filtros).some(([key, value]) => key === "competencia" ? value !== "todas" : key === "tema" || key === "instructor" || key === "tipo" ? value !== "todos" : Boolean(value));
  const activeCount = Object.entries(filtros).filter(([key, value]) => key === "competencia" ? value !== "todas" : key === "tema" || key === "instructor" || key === "tipo" ? value !== "todos" : Boolean(value)).length;
  const mobile = globalThis.window?.matchMedia?.("(max-width: 760px)").matches ?? false;
  return `<details class="library-filters"${mobile ? "" : " open"}><summary>Filtros (${activeCount})</summary><div class="library-filter-fields">${opciones("competencia", "Competencia", competencias)}${opciones("tema", "Tema", temas)}${opciones("instructor", "Instructor", instructores)}${opciones("tipo", "Tipo", tipos)}<label>Desde<input type="date" data-library-filter="desde" value="${filtros.desde}"></label><label>Hasta<input type="date" data-library-filter="hasta" value="${filtros.hasta}"></label><label>Orden<select data-library-order><option value="reciente"${orden === "reciente" ? " selected" : ""}>Más reciente</option><option value="antiguo"${orden === "antiguo" ? " selected" : ""}>Más antiguo</option></select></label></div><button type="button" class="ficha-filter-clear" data-library-clear>Limpiar todo</button></details>`;
}

function renderCard(documento) {
  const tipo = tipoDocumento(documento);
  const fecha = documento.publicadoEn || documento.actualizado;
  const clase = documento.claseId ? FICHA.clases.find(item => item.id === documento.claseId) : null;
  const claseFecha = documento.claseFecha || clase?.fecha;
  const mark = documento.id === destacado ? " is-highlighted" : "";
  return `<article class="library-card${mark}" id="library-doc-${escaparHTML(documento.id)}"><div class="library-card-heading"><span class="library-file-icon" data-type="${tipo}" aria-hidden="true">${({ pdf: "PDF", enlace: "↗", presentacion: "▧", hoja: "▦", imagen: "▧", video: "▷" })[tipo]}</span><time>${escaparHTML(formatearFecha(fecha, { day: "numeric", month: "short", year: "numeric" }))}</time></div><h3>${escaparHTML(documento.titulo)}</h3><p class="library-competence">${competenceMarker(documento.competenciaId)}${escaparHTML(nombreCompetencia(documento.competenciaId))}</p><p>${escaparHTML(documento.tema || "Tema por confirmar")}</p><p class="library-instructor">${escaparHTML(nombreInstructor(documento.instructorId))}</p><div class="library-card-actions"><a class="button button-primary" href="${escaparHTML(documento.url)}" target="_blank" rel="noopener">Abrir ↗</a>${claseFecha ? `<button type="button" class="button button-secondary" data-library-class="${escaparHTML(claseFecha)}" data-go="clases">Ver clase del ${escaparHTML(formatearFecha(claseFecha, { day: "numeric", month: "short" }))}</button>` : ""}</div></article>`;
}

export function resaltarDocumento(id) {
  destacado = typeof id === "string" ? id : null;
  renderBiblioteca();
  if (destacado) {
    document.getElementById("library-doc-" + destacado)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    clearTimeout(timerDestacado);
    timerDestacado = setTimeout(() => { destacado = null; renderBiblioteca(); }, 1500);
  }
}

export function renderBiblioteca() {
  const root = document.querySelector("#view-biblioteca"); if (!root) return;
  const all = documentosPublicados("biblioteca"); const visible = listaDocumentos();
  const active = Object.entries(filtros).filter(([, value]) => value && !["todas", "todos"].includes(value));
  const etiqueta = (key, value) => key === "competencia" ? nombreCompetencia(value) : key === "instructor" ? nombreInstructor(value) : key === "tipo" ? ({ pdf: "PDF", enlace: "Enlace", presentacion: "Presentación", hoja: "Hoja de cálculo", imagen: "Imagen", video: "Video" })[value] || value : key === "desde" ? "Desde " + value : key === "hasta" ? "Hasta " + value : value;
  root.innerHTML = `<div class="ficha-view-content library-view"><header class="ficha-view-heading"><div><p class="eyebrow">MI FICHA · RECURSOS</p><h2 id="biblioteca-title">Biblioteca</h2><p>Busca los documentos que compartieron contigo.</p></div><span class="library-count">${visible.length} de ${all.length} documentos</span></header><label class="library-search">Buscar documentos<input type="search" data-library-search value="${escaparHTML(consulta)}" placeholder="Nombre, tema o instructor" autocomplete="off"></label>${renderFiltros()}${active.length ? `<div class="library-active-filters">${active.map(([key, value]) => `<button type="button" data-library-remove="${key}" aria-label="Quitar filtro: ${escaparHTML(etiqueta(key, value))}">${escaparHTML(etiqueta(key, value))} ×</button>`).join("")}<button type="button" data-library-clear>Limpiar todo</button></div>` : ""}<div class="library-grid">${visible.length ? visible.map(renderCard).join("") : `<div class="library-empty"><strong>${all.length ? "Ningún documento coincide" : "Sin documentos por ahora"}</strong>${all.length ? '<button type="button" class="ficha-filter-clear" data-library-clear>Limpiar todo</button>' : ""}</div>`}</div></div>`;
}

export function initBiblioteca() {
  const root = document.querySelector("#view-biblioteca"); if (!root || root.dataset.libraryReady) return;
  root.dataset.libraryReady = "true";
  root.addEventListener("input", event => { if (event.target.matches("[data-library-search]")) { consulta = event.target.value; renderBiblioteca(); const input = root.querySelector("[data-library-search]"); input?.focus(); input?.setSelectionRange(consulta.length, consulta.length); } });
  root.addEventListener("change", event => { const field = event.target.dataset.libraryFilter; if (field) { filtros[field] = event.target.value; renderBiblioteca(); return; } if (event.target.matches("[data-library-order]")) { orden = event.target.value; renderBiblioteca(); } });
  root.addEventListener("click", event => {
    if (event.target.closest("[data-library-clear]")) { consulta = ""; filtros = { competencia: "todas", tema: "todos", instructor: "todos", tipo: "todos", desde: "", hasta: "" }; renderBiblioteca(); return; }
    const remove = event.target.closest("[data-library-remove]"); if (remove) { const key = remove.dataset.libraryRemove; filtros[key] = key === "competencia" ? "todas" : "todos"; renderBiblioteca(); return; }
    const clase = event.target.closest("[data-library-class]"); if (clase) document.dispatchEvent(new CustomEvent("senapsis:clase-seleccionada", { detail: { fecha: clase.dataset.libraryClass } }));
  });
  document.addEventListener("senapsis:documento-resaltar", event => resaltarDocumento(event.detail?.id));
  document.addEventListener("senapsis:space-change", event => {
    if (event.detail?.space !== "biblioteca") return;
    renderBiblioteca();
    if (destacado) document.getElementById("library-doc-" + destacado)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  });
  renderBiblioteca();
}
