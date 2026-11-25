import { FICHA } from "../content/ficha.js";
import { clasificar } from "./selectores.js";

const INICIALES = Object.freeze({ competenciaId: "todas", estado: "todos" });
const ESTADOS_VALIDOS = new Set(["todos", "pendiente", "en_curso", "entregada", "por_corregir", "aprobada", "atrasada"]);
let activos = { ...INICIALES };

export function obtenerFiltros() {
  return { ...activos };
}

export function actualizarFiltro(campo, valor, emitir = true) {
  if (campo === "competenciaId") {
    const permitidos = new Set(["todas", ...FICHA.competencias.map(item => item.id)]);
    if (!permitidos.has(valor)) return obtenerFiltros();
  } else if (campo === "estado") {
    if (!ESTADOS_VALIDOS.has(valor)) return obtenerFiltros();
  } else {
    return obtenerFiltros();
  }
  activos = { ...activos, [campo]: valor };
  if (emitir && typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent("senapsis:filtros-ficha-cambiados"));
  }
  return obtenerFiltros();
}

export function limpiarFiltros(emitir = true) {
  activos = { ...INICIALES };
  if (emitir && typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent("senapsis:filtros-ficha-cambiados"));
  }
  return obtenerFiltros();
}

export function actividadPasaFiltros(actividad, personal = {}, fechaActual, filtros = activos) {
  if (filtros.competenciaId !== "todas" && actividad.competenciaId !== filtros.competenciaId) return false;
  if (filtros.estado === "todos") return true;
  const estadoReal = personal?.actividades?.[actividad.id]?.estado ?? actividad.estado ?? "pendiente";
  const estadoVisible = clasificar(actividad, personal, fechaActual) === "atrasada"
    ? "atrasada"
    : estadoReal;
  return estadoVisible === filtros.estado;
}

export function filtrarActividades(actividades, personal = {}, fechaActual, filtros = activos) {
  return actividades.filter(item => actividadPasaFiltros(item, personal, fechaActual, filtros));
}

export function competenciaPasaFiltro(competenciaId, filtros = activos) {
  return filtros.competenciaId === "todas" || filtros.competenciaId === competenciaId;
}

function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

export function renderFiltros(prefix, ficha = FICHA) {
  const filtros = obtenerFiltros();
  const competencias = ficha.competencias.map(item =>
    `<option value="${esc(item.id)}" ${filtros.competenciaId === item.id ? "selected" : ""}>${esc(item.codigo)} · ${esc(item.nombre)}</option>`
  ).join("");
  const estados = [
    ["todos", "Todos los estados"], ["pendiente", "Pendiente"],
    ["en_curso", "En curso"], ["entregada", "Entregada"],
    ["por_corregir", "Por corregir"], ["aprobada", "Aprobada"],
    ["atrasada", "Atrasada"]
  ].map(([value, label]) =>
    `<option value="${value}" ${filtros.estado === value ? "selected" : ""}>${label}</option>`
  ).join("");

  return `<div class="ficha-filters" aria-label="Filtros de Mi ficha">
    <label for="${prefix}-competencia">Competencia
      <select id="${prefix}-competencia" data-ficha-filter="competenciaId">
        <option value="todas" ${filtros.competenciaId === "todas" ? "selected" : ""}>Todas las competencias</option>
        ${competencias}
      </select>
    </label>
    <label for="${prefix}-estado">Estado
      <select id="${prefix}-estado" data-ficha-filter="estado">${estados}</select>
    </label>
    <button type="button" class="ficha-filter-clear" data-ficha-filter-clear>Limpiar filtros</button>
  </div>`;
}

let inicializado = false;
export function initFiltros() {
  if (inicializado || typeof document === "undefined") return;
  inicializado = true;
  document.addEventListener("change", event => {
    const control = event.target.closest("[data-ficha-filter]");
    if (control) actualizarFiltro(control.dataset.fichaFilter, control.value);
  });
  document.addEventListener("click", event => {
    if (event.target.closest("[data-ficha-filter-clear]")) limpiarFiltros();
  });
}
