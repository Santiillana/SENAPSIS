import { FICHA } from "../content/ficha.js";
import { lessons } from "../content/lessons.js";
import { exercises } from "../content/exercises.js";
import { ESTADO, ESTADOS } from "./estados.js";
import { leerFichaEstricto, leerFicha, guardarFicha } from "./store.js";
import { clasificar } from "./selectores.js";
import { parsearFechaLocal, fechaISO, hoy, textoRelativo } from "./fechas.js";
import { documentosPublicados } from "./documentos.js";
import {
  registroActividad,
  actualizarChecklistActividad,
  actualizarNotasActividad,
  registrarResultadoTranscrito
} from "./actividades.js";
import { escaparHTML, formatearFecha, renderEstado } from "./view-utils.js";
import { competenceMarker } from "./competencias-ui.js";

let seleccionada = FICHA.actividades[0]?.id ?? null;
let busqueda = "";
let filtroCompetencia = "todas";
let vistaLista = "pendientes";
let detalleMovil = false;
let mensajeGuardado = "";

const ETIQUETAS_JUICIO = {
  aprobado: "Aprobada",
  no_aprobado: "Por corregir"
};
const RESULTADOS = {
  aprobada: { icono: "✓", etiqueta: "Aprobada" },
  por_corregir: { icono: "✎", etiqueta: "Por corregir" },
  no_aprobada: { icono: "✗", etiqueta: "No aprobada" }
};

function hoyISO() {
  return fechaISO(hoy());
}

function nombreCompetencia(competenciaId) {
  return FICHA.competencias.find(item => item.id === competenciaId)?.nombre ??
    "Competencia por confirmar";
}

function estadoActividad(actividad, personal) {
  const registro = registroActividad(personal, actividad.id);
  if ([ESTADO.APROBADA, ESTADO.POR_CORREGIR].includes(registro.estado)) return registro.estado;
  const clasificacion = clasificar(actividad, personal, hoy());
  return clasificacion === "atrasada"
    ? ESTADO.ATRASADA
    : (registro.estado ?? ESTADO.PENDIENTE);
}

function textoFechaLimite(actividad) {
  if (!actividad.limite) return "Sin fecha límite";
  return textoRelativo(actividad.limite, hoy()) + " · " +
    formatearFecha(parsearFechaLocal(actividad.limite));
}

function actividadesFiltradas(personal) {
  const consulta = busqueda.trim().toLocaleLowerCase("es");

  return FICHA.actividades
    .filter(actividad => {
      const texto = [
        actividad.titulo,
        actividad.descripcion,
        nombreCompetencia(actividad.competenciaId)
      ].join(" ").toLocaleLowerCase("es");

      if (!texto.includes(consulta)) return false;
      if (filtroCompetencia !== "todas" && actividad.competenciaId !== filtroCompetencia) {
        return false;
      }
      const culminada = [ESTADO.APROBADA, ESTADO.POR_CORREGIR].includes(estadoActividad(actividad, personal)) ||
        ["aprobada", "por_corregir", "no_aprobada"].includes(actividad.resultado);
      return vistaLista === "culminadas" ? culminada : !culminada;
    })
    .sort((a, b) =>
      (vistaLista === "culminadas" && (estadoActividad(a, personal) === ESTADO.POR_CORREGIR || a.resultado === "por_corregir") ? -1 : 0) -
      (vistaLista === "culminadas" && (estadoActividad(b, personal) === ESTADO.POR_CORREGIR || b.resultado === "por_corregir") ? -1 : 0) ||
      (a.limite || "9999-99-99").localeCompare(b.limite || "9999-99-99") ||
      a.id.localeCompare(b.id)
    );
}

function renderFiltros() {
  const chips = [...FICHA.competencias].sort((a,b)=>(a.tipo==="principal"?0:1)-(b.tipo==="principal"?0:1)||a.orden-b.orden).map(competencia => `<button type="button" class="ficha-competence-filter${filtroCompetencia === competencia.id ? " is-active" : ""}" data-activity-competence="${escaparHTML(competencia.id)}" aria-pressed="${filtroCompetencia === competencia.id}">${competenceMarker(competencia.id)}${escaparHTML(competencia.nombre)}${competencia.tipo==="transversal"?'<small>Transversal</small>':""}</button>`).join("");
  return `
    <div class="ficha-activities-filters">
      <label>
        Buscar actividad
        <input type="search" id="activity-search" value="${escaparHTML(busqueda)}"
          placeholder="Nombre o descripción" autocomplete="off">
      </label>
      <div class="ficha-competence-filters" role="group" aria-label="Filtrar por competencia"><button type="button" class="ficha-competence-filter${filtroCompetencia === "todas" ? " is-active" : ""}" data-activity-competence="todas" aria-pressed="${filtroCompetencia === "todas"}">Todas</button>${chips}</div>
      <button type="button" class="ficha-filter-clear" data-activity-clear>Limpiar filtros</button>
    </div>`;
}

function renderLista(personal) {
  const root = document.querySelector("#ficha-activity-list");
  const count = document.querySelector("#ficha-activity-count");
  if (!root || !count) return;

  const actividades = actividadesFiltradas(personal);
  if (!actividades.some(item => item.id === seleccionada)) {
    seleccionada = actividades[0]?.id ?? null;
  }

  count.textContent = actividades.length + (actividades.length === 1 ? " actividad" : " actividades");

  const hasFilters = Boolean(busqueda.trim()) || filtroCompetencia !== "todas";
  const emptyTitle = hasFilters ? "Ninguna actividad coincide" : vistaLista === "pendientes" ? "Sin actividades pendientes" : "Aún no hay actividades culminadas";
  root.innerHTML = actividades.length
    ? actividades.map(actividad => {
      const estado = estadoActividad(actividad, personal);
      const resultado = RESULTADOS[actividad.resultado] || (estado === ESTADO.POR_CORREGIR ? RESULTADOS.por_corregir : estado === ESTADO.APROBADA ? RESULTADOS.aprobada : null);
      const activa = actividad.id === seleccionada;
      return `
        <button type="button" class="ficha-activity-option${activa ? " is-active" : ""}"
          data-activity-select="${escaparHTML(actividad.id)}" aria-pressed="${activa}">
          <span class="ficha-activity-option-main">
            <strong>${escaparHTML(actividad.titulo)}</strong>
            <small>${escaparHTML(nombreCompetencia(actividad.competenciaId))}</small>
            <small>${actividad.limite ? "Límite · " : "Entrega · "}${escaparHTML(textoFechaLimite(actividad))}</small>
          </span>
          <span class="ficha-activity-option-status"${resultado ? ` data-result="${actividad.resultado || estado}"` : ""}>
            ${resultado ? `${resultado.icono} ${resultado.etiqueta}` : escaparHTML(ESTADOS[estado]?.etiqueta ?? "Pendiente")}
          </span>
        </button>`;
    }).join("")
    : `
      <div class="ficha-empty-inline">
        <strong>${emptyTitle}</strong>
        ${hasFilters ? '<span>Prueba otra búsqueda o limpia los filtros.</span><button type="button" class="ficha-filter-clear" data-activity-clear>Limpiar filtros</button>' : ""}
      </div>`;

  renderDetalle(personal);
}

function renderRelacionados(actividad) {
  const lecciones = (actividad.leccionIds ?? [])
    .map(id => lessons.find(leccion => leccion.id === id))
    .filter(Boolean);
  const retos = (actividad.ejercicioIds ?? [])
    .map(id => exercises.find(ejercicio => ejercicio.id === id))
    .filter(Boolean);

  if (!lecciones.length && !retos.length) return "";

  const listaLecciones = lecciones.length
    ? `
      <h4>Lecciones</h4>
      <ul>${lecciones.map(item => "<li>" + escaparHTML(item.title) + "</li>").join("")}</ul>
      <button type="button" class="ficha-filter-clear" data-go="learn">Abrir Aprende</button>`
    : "";

  const listaRetos = retos.length
    ? `
      <h4>Ejercicios</h4>
      <ul>${retos.map(item => "<li>" + escaparHTML(item.title) + "</li>").join("")}</ul>
      <button type="button" class="ficha-filter-clear" data-go="exercises">Abrir Ejercicios</button>`
    : "";

  return `
    <section class="ficha-activity-section">
      <h3>Contenidos relacionados</h3>
      ${listaLecciones}
      ${listaRetos}
    </section>`;
}

function renderDocumentos(actividad) {
  const documentos = documentosPublicados("actividades", {
    actividadId: actividad.id
  });

  if (!documentos.length) {
    return `
      <div class="ficha-empty-inline">
        <strong>Sin documentos publicados</strong>
        <span>Los materiales oficiales aparecerán aquí cuando el moderador los publique.</span>
      </div>`;
  }

  return `
    <ul class="ficha-activity-documents">
      ${documentos.map(documento => `
        <li>
          <a href="${escaparHTML(documento.url)}" target="_blank" rel="noopener noreferrer">
            <span>
              <strong>${escaparHTML(documento.titulo)}</strong>
              <small>${escaparHTML(documento.nombreArchivo)}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        </li>`).join("")}
    </ul>`;
}

function renderIntentos(registro) {
  const intentos = registro.intentos ?? [];
  if (!intentos.length) {
    return `
      <div class="ficha-empty-inline">
        <strong>Sin devoluciones registradas</strong>
        <span>Podrás transcribir una respuesta cuando la recibas.</span>
      </div>`;
  }

  return `
    <ol class="ficha-attempt-list">
      ${intentos.map(intento => `
        <li class="ficha-attempt-item">
          <div>
            <strong>Intento ${intento.n} · ${escaparHTML(ETIQUETAS_JUICIO[intento.juicio] ?? intento.juicio)}</strong>
            <time>${escaparHTML(formatearFecha(intento.fecha))}</time>
          </div>
          ${intento.correccion ? "<p>" + escaparHTML(intento.correccion) + "</p>" : ""}
          ${intento.enlace
            ? '<a href="' + escaparHTML(intento.enlace) + '" target="_blank" rel="noopener noreferrer">Ver evidencia ↗</a>'
            : ""}
          <small>Resultado transcrito por el estudiante; no verificado por Senapsis.</small>
        </li>`).join("")}
    </ol>`;
}

function renderErrorAlmacenamiento(razon) {
  return `
    <div class="ficha-storage-error" role="alert">
      <strong>No se pueden modificar tus datos.</strong>
      <p>El almacenamiento está dañado, no disponible o usa una versión desconocida.
        No se sobrescribió información.</p>
      <small>Motivo: ${escaparHTML(razon)}</small>
    </div>`;
}

function renderDetalle(personal) {
  const root = document.querySelector("#ficha-activity-detail");
  if (!root) return;

  const actividad = FICHA.actividades.find(item => item.id === seleccionada);
  if (!actividad) {
    root.innerHTML = `
      <div class="ficha-empty-state">
        <h3>Selecciona una actividad</h3>
        <p>Elige una actividad para consultar sus requisitos.</p>
      </div>`;
    return;
  }

  const lectura = leerFichaEstricto();
  if (!lectura.ok) {
    root.innerHTML = renderErrorAlmacenamiento(lectura.razon);
    return;
  }

  const registro = registroActividad(personal, actividad.id);
  const estado = estadoActividad(actividad, personal);
  const resultado = RESULTADOS[actividad.resultado];
  const bloqueada = registro.estado === ESTADO.APROBADA;
  const instrucciones = (actividad.instrucciones ?? [])
    .map(texto => "<li>" + escaparHTML(texto) + "</li>").join("");
  const entregables = (actividad.entregables ?? [])
    .map(texto => "<li>" + escaparHTML(texto) + "</li>").join("");

  root.innerHTML = `
    <button type="button" class="activity-mobile-back" data-activity-back>‹ Volver</button>
    <article class="ficha-activity-detail">
      <header class="ficha-activity-detail-heading">
        <div>
          <p class="eyebrow">MI FICHA · DETALLE</p>
          <h2>${escaparHTML(actividad.titulo)}</h2>
          <p>${escaparHTML(nombreCompetencia(actividad.competenciaId))}</p>
        </div>
        ${resultado ? `<span class="activity-result" data-result="${actividad.resultado}">${resultado.icono} ${resultado.etiqueta}</span>` : renderEstado(estado)}
      </header>

      <div class="ficha-activity-summary">
        <div>
          <span>Apertura</span>
          <strong>${escaparHTML(actividad.apertura ? formatearFecha(actividad.apertura) : "Por confirmar")}</strong>
        </div>
        <div>
          <span>Fecha límite</span>
          <strong>${escaparHTML(textoFechaLimite(actividad))}</strong>
        </div>
        <div>
          <span>Fuente</span>
          <strong>${escaparHTML(actividad.fuente || "Por confirmar")}</strong>
        </div>
      </div>

      <section class="ficha-activity-section">
        <h3>¿Qué debes hacer?</h3>
        <p>${escaparHTML(actividad.descripcion)}</p>
        ${actividad.paraQueSirve
          ? '<p class="ficha-activity-purpose">' + escaparHTML(actividad.paraQueSirve) + "</p>"
          : ""}
        ${instrucciones ? "<h4>Instrucciones</h4><ol>" + instrucciones + "</ol>" : ""}
        ${entregables ? "<h4>Entregables</h4><ul>" + entregables + "</ul>" : ""}
      </section>

      ${renderRelacionados(actividad)}

      <section class="ficha-activity-section">
        <h3>Documentos y materiales</h3>
        ${renderDocumentos(actividad)}
      </section>

      <section class="ficha-activity-section">
        <h3>Tu seguimiento</h3>
        <p class="ficha-activity-help">
          Marca los pasos a medida que avanzas. Confirmar la entrega cambia el estado a Entregada.
        </p>
        <div class="ficha-activity-checks">
          ${[
            ["subida", "Actividad subida"],
            ["enviada", "Actividad enviada"],
            ["confirmada", "Entrega confirmada"]
          ].map(([campo, etiqueta]) => `
            <label>
              <input type="checkbox" data-checklist-field="${campo}"
                ${registro.checklist?.[campo] ? "checked" : ""}
                ${bloqueada ? "disabled" : ""}>
              <span>${etiqueta}</span>
            </label>`).join("")}
        </div>

        <form id="activity-notes-form" class="ficha-activity-notes">
          <label for="activity-notes">Notas personales</label>
          <textarea id="activity-notes" name="notes" maxlength="4000" rows="3"
            ${bloqueada ? "disabled" : ""}>${escaparHTML(registro.notas || "")}</textarea>
          <button type="submit" class="ficha-filter-clear" ${bloqueada ? "disabled" : ""}>
            Guardar notas
          </button>
        </form>
      </section>

      <section class="ficha-activity-section">
        <h3>Devoluciones y resultados</h3>
        <p class="ficha-activity-help">
          Transcribe el resultado que recibiste. Senapsis no autentica al instructor ni verifica la calificación.
        </p>
        ${renderIntentos(registro)}
        <form id="activity-result-form" class="ficha-activity-result-form">
          <label>
            Resultado recibido
            <select name="juicio" required>
              <option value="">Selecciona</option>
              <option value="aprobado">Aprobada</option>
              <option value="no_aprobado">Por corregir</option>
            </select>
          </label>
          <label>
            Fecha
            <input name="fecha" type="date" value="${escaparHTML(hoyISO())}" required>
          </label>
          <label>
            Corrección u observación
            <textarea name="correccion" maxlength="2000" rows="3"
              placeholder="Obligatoria si te solicitaron correcciones"></textarea>
          </label>
          <label>
            Enlace de evidencia (opcional)
            <input name="enlace" type="url" placeholder="https://...">
          </label>
          <button type="submit" class="ficha-filter-clear"
            ${bloqueada || !registro.checklist?.confirmada ? "disabled" : ""}>
            Guardar resultado transcrito
          </button>
          <p class="ficha-activity-help">
            Confirma primero la entrega en el checklist. La transcripción no equivale a una validación institucional.
          </p>
        </form>
      </section>

      <p class="ficha-activity-help ficha-activity-save-status" role="status" aria-live="polite">
        ${escaparHTML(mensajeGuardado)}
      </p>
    </article>`;
}

function guardarCambios(datos) {
  const resultado = guardarFicha(datos);
  if (!resultado.ok) {
    mensajeGuardado = resultado.errores?.join(" ") ??
      resultado.razon ??
      "No fue posible guardar los cambios.";
    renderActividades();
    return false;
  }

  mensajeGuardado = "Cambios guardados en este navegador.";
  document.dispatchEvent(new CustomEvent("senapsis:ficha-actualizada"));
  return true;
}

function mensajeError(razon) {
  const mensajes = {
    actividad_inexistente: "La actividad seleccionada ya no existe en el catálogo.",
    actividad_bloqueada: "La actividad aprobada está bloqueada.",
    entrega_no_confirmada: "Confirma primero la entrega en el checklist.",
    juicio_invalido: "Selecciona un resultado válido.",
    correccion_requerida: "Escribe la corrección solicitada.",
    correccion_invalida: "La corrección supera el límite permitido.",
    enlace_invalido: "El enlace debe ser HTTPS y no incluir credenciales.",
    fecha_invalida: "La fecha no es válida.",
    notas_invalidas: "Las notas superan el límite permitido.",
    datos_invalidos: "Los datos no superaron la validación."
  };
  return mensajes[razon] ?? "No se pudo registrar el cambio.";
}

export function renderActividades() {
  const root = document.querySelector("#view-actividades");
  if (!root) return;

  const lectura = leerFichaEstricto();
  const personal = lectura.ok ? lectura.datos : leerFicha();
  const actividades = actividadesFiltradas(personal);
  const culminadas = FICHA.actividades.filter(item => [ESTADO.APROBADA, ESTADO.POR_CORREGIR].includes(estadoActividad(item, personal)) || ["aprobada", "por_corregir", "no_aprobada"].includes(item.resultado)).length;

  if (!actividades.some(item => item.id === seleccionada)) {
    seleccionada = actividades[0]?.id ?? null;
  }

  root.innerHTML = `
    <div class="ficha-view-content ficha-activities-view-content">
      <header class="ficha-view-heading">
        <div>
          <p class="eyebrow">MI FICHA · SEGUIMIENTO</p>
          <h2 id="actividades-title">Actividades</h2>
          <p>Consulta qué falta y revisa las actividades culminadas.</p>
        </div>
        <div class="ficha-activity-counts"><button type="button" data-activity-view="pendientes" aria-pressed="${vistaLista === "pendientes"}">Pendientes (${FICHA.actividades.length - culminadas})</button><button type="button" data-activity-view="culminadas" aria-pressed="${vistaLista === "culminadas"}">Culminadas (${culminadas})</button><span id="ficha-activity-count" aria-live="polite"></span></div>
      </header>

      ${FICHA.meta.esDemostracion
        ? `
          <aside class="ficha-demo-notice" role="note">
            <strong>Contenido de demostración.</strong>
            Las consignas y fechas son ejemplos editables, no asignaciones oficiales.
          </aside>`
        : ""}

      ${renderFiltros()}

      <div class="ficha-activities-layout${detalleMovil ? " is-detail-open" : ""}">
        <aside class="ficha-activity-list-panel" aria-label="Catálogo de actividades">
          <div id="ficha-activity-list"></div>
        </aside>
        <div id="ficha-activity-detail" aria-live="polite"></div>
      </div>

      <footer class="ficha-personal-note">
        Tu seguimiento, notas y resultados transcritos se guardan solo en este navegador.
      </footer>
    </div>`;
  root.classList.toggle("is-detail-open", detalleMovil);

  renderLista(personal);
}

export function initActividades() {
  const root = document.querySelector("#view-actividades");
  if (!root || root.dataset.fichaReady === "true") return;
  root.dataset.fichaReady = "true";

  root.addEventListener("input", event => {
    if (event.target.id !== "activity-search") return;

    busqueda = event.target.value;
    const posicion = event.target.selectionStart;
    renderLista(leerFicha());

    const input = document.querySelector("#activity-search");
    input?.focus();
    input?.setSelectionRange(posicion, posicion);
  });

  root.addEventListener("change", event => {
    if (!event.target.matches("[data-checklist-field]")) return;

    const lectura = leerFichaEstricto();
    if (!lectura.ok) {
      renderActividades();
      return;
    }

    const cambio = actualizarChecklistActividad(
      lectura.datos,
      seleccionada,
      event.target.dataset.checklistField,
      event.target.checked
    );
    if (!cambio.ok) {
      mensajeGuardado = mensajeError(cambio.razon);
      renderActividades();
      return;
    }
    guardarCambios(cambio.datos);
  });

  root.addEventListener("click", event => {
    if (event.target.closest("[data-activity-clear]")) {
      busqueda = "";
      filtroCompetencia = "todas";
      renderActividades();
      return;
    }

    const view = event.target.closest("[data-activity-view]");
    if (view) { vistaLista = view.dataset.activityView; detalleMovil = false; renderActividades(); return; }
    const competence = event.target.closest("[data-activity-competence]");
    if (competence) { filtroCompetencia = competence.dataset.activityCompetence; detalleMovil = false; renderActividades(); return; }
    if (event.target.closest("[data-activity-back]")) { detalleMovil = false; renderActividades(); return; }

    const button = event.target.closest("[data-activity-select]");
    if (button) {
      seleccionada = button.dataset.activitySelect;
      detalleMovil = true;
      mensajeGuardado = "";
      renderActividades();
    }
  });

  root.addEventListener("submit", event => {
    if (!["activity-notes-form", "activity-result-form"].includes(event.target.id)) return;
    event.preventDefault();

    const lectura = leerFichaEstricto();
    if (!lectura.ok) {
      renderActividades();
      return;
    }

    let resultado;
    if (event.target.id === "activity-notes-form") {
      resultado = actualizarNotasActividad(
        lectura.datos,
        seleccionada,
        event.target.elements.notes.value
      );
    } else {
      resultado = registrarResultadoTranscrito(lectura.datos, seleccionada, {
        juicio: event.target.elements.juicio.value,
        fecha: event.target.elements.fecha.value,
        correccion: event.target.elements.correccion.value,
        enlace: event.target.elements.enlace.value
      });
    }

    if (!resultado.ok) {
      mensajeGuardado = mensajeError(resultado.razon);
      renderActividades();
      return;
    }
    guardarCambios(resultado.datos);
  });

  document.addEventListener("senapsis:filtros-ficha-cambiados", renderActividades);
  document.addEventListener("senapsis:space-change", event => {
    if (event.detail?.space !== "actividades") return;
    busqueda = "";
    filtroCompetencia = "todas";
    vistaLista = "pendientes";
    detalleMovil = false;
    renderActividades();
  });
  renderActividades();
}
