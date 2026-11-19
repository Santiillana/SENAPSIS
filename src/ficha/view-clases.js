import { FICHA } from "../content/ficha.js";
import { hoy, inicioSemana, fechaISO, diaSemana } from "./fechas.js";
import { clasesDelDia } from "./selectores.js";
import { escaparHTML, formatearFecha } from "./view-utils.js";
import { documentosPublicados } from "./documentos.js";

let fechaSeleccionada = hoy();
let vista = "diaria";
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const sumar = (fecha, n) => { const d = new Date(fecha); d.setDate(d.getDate() + n); return d; };
const esHoy = fecha => fechaISO(fecha) === fechaISO(hoy());
const claseRegistrada = fecha => FICHA.clases.find(item => item.fecha === fechaISO(fecha));

function cambiarFecha(fecha, direccion = 1, recuperarFoco = false) {
  fechaSeleccionada = fecha;
  if (diaSemana(fechaSeleccionada) === 7) fechaSeleccionada = sumar(fechaSeleccionada, direccion < 0 ? -1 : 1);
  renderClases();
  if (recuperarFoco) document.querySelector("#class-day-" + fechaISO(fechaSeleccionada))?.focus();
}

function estado(fecha) {
  const registro = claseRegistrada(fecha);
  if(registro?.estado==="no_hubo")return {icono:"×",texto:"No hubo clase"};
  return registro ? { icono: "✓", texto: "Se dictó" } : { icono: "○", texto: "Por venir" };
}

function renderRail() {
  const lunes = inicioSemana(fechaSeleccionada);
  return DIAS.map((dia, index) => {
    const fecha = sumar(lunes, index);
    const registro = claseRegistrada(fecha);
    const active = fechaISO(fecha) === fechaISO(fechaSeleccionada);
    const count = registro?.temas?.reduce((total, tema) => total + (tema.ejercicioIds?.length || 0), 0) || 0;
    return `<button class="class-day-card${active ? " is-selected" : ""}${esHoy(fecha) ? " is-today" : ""}" role="option" aria-selected="${active}" id="class-day-${fechaISO(fecha)}" data-class-date="${fechaISO(fecha)}">
      <span>${dia}</span><strong>${fecha.getDate()}</strong><span class="class-day-state">${estado(fecha).icono} ${estado(fecha).texto}</span>${count ? `<span class="class-day-count" aria-label="${count} actividades">${count}</span>` : ""}
    </button>`;
  }).join("");
}

function renderDetalle() {
  const registro = claseRegistrada(fechaSeleccionada);
  const clases = clasesDelDia(fechaSeleccionada);
  const titulo = formatearFecha(fechaSeleccionada, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (!registro) return `<section class="class-detail class-no-record" aria-live="polite"><h3>${escaparHTML(titulo)}</h3><p>Sin registro de este día</p>${clases.length ? `<p>${clases.map(c => `${escaparHTML(c.inicio)} – ${escaparHTML(c.fin)} · ${escaparHTML(c.competencia?.nombre ?? c.titulo ?? "Por confirmar")}`).join("<br>")}</p>` : ""}</section>`;
  const comp = FICHA.competencias.find(item => item.id === registro.competenciaId);
  const docs = documentosPublicados("clases", { claseId: registro.id });
  const documentos = docs.length ? `<section><h4>Documentos</h4><ul>${docs.map(doc => `<li><button type="button" class="class-document-link" data-library-highlight="${escaparHTML(doc.id)}" data-go="biblioteca">▤ ${escaparHTML(doc.titulo)} · Abrir en Biblioteca</button></li>`).join("")}</ul></section>` : "";
  return `<section class="class-detail" aria-live="polite"><header><div><h3>${escaparHTML(titulo)}</h3><span class="class-status">✓ ${estado(fechaSeleccionada).texto}</span></div><strong>${escaparHTML(registro.titulo || comp?.nombre || "Materia por confirmar")}</strong></header>
    <div class="class-detail-columns"><section><h4>Lo que se vio</h4>${registro.temas?.length ? `<ul>${registro.temas.map(tema => `<li>${escaparHTML(tema.texto)}</li>`).join("")}</ul>` : "<p>Temas por confirmar</p>"}</section>
    <section><h4>Actividades</h4>${registro.temas?.some(tema => tema.ejercicioIds?.length) ? `<p>${registro.temas.reduce((n, tema) => n + (tema.ejercicioIds?.length || 0), 0)} ejercicios relacionados</p>` : "<p>Sin actividades registradas</p>"}</section>${documentos}</div>
  </section>`;
}

function renderSemana() {
  const lunes = inicioSemana(fechaSeleccionada);
  return `<div class="class-week-grid">${DIAS.map((dia, index) => {
    const fecha = sumar(lunes, index); const registro = claseRegistrada(fecha);
    const horarios = clasesDelDia(fecha);
    const selected = fechaISO(fecha) === fechaISO(fechaSeleccionada);
    return `<button type="button" class="class-week-card${esHoy(fecha) ? " is-today" : ""}${selected ? " is-selected" : ""}" aria-pressed="${selected}" data-class-date="${fechaISO(fecha)}"><strong>${dia} ${fecha.getDate()}</strong><span>${horarios[0] ? `${escaparHTML(horarios[0].inicio)} – ${escaparHTML(horarios[0].fin)}` : "Horario por confirmar"}</span><span>${escaparHTML(registro?.titulo || horarios[0]?.competencia?.nombre || "Sin registro")}</span><small>${escaparHTML(registro ? estado(fecha).texto : "○ Por venir")}</small></button>`;
  }).join("")}</div>`;
}

function renderMes() {
  const year = fechaSeleccionada.getFullYear(); const month = fechaSeleccionada.getMonth();
  const primero = new Date(year, month, 1); const diasMes = new Date(year, month + 1, 0).getDate();
  const offset = (primero.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('<span class="class-month-blank" aria-hidden="true"></span>');
  for (let n = 1; n <= diasMes; n++) {
    const fecha = new Date(year, month, n);
    if (diaSemana(fecha) === 7) continue;
    const registro = claseRegistrada(fecha); const selected = fechaISO(fecha) === fechaISO(fechaSeleccionada);
    cells.push(`<button type="button" class="class-month-day${esHoy(fecha) ? " is-today" : ""}${selected ? " is-selected" : ""}" data-class-date="${fechaISO(fecha)}"><span>${n}</span>${registro ? `<i aria-label="${escaparHTML(estado(fecha).texto)}">●</i>` : ""}${registro?.temas?.length ? `<small>${registro.temas.length}</small>` : ""}</button>`);
  }
  return `<div class="class-month-grid">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => `<strong>${d}</strong>`).join("")}${cells.join("")}</div>`;
}

export function renderClases() {
  const root = document.querySelector("#view-clases"); if (!root) return;
  const month = formatearFecha(fechaSeleccionada, { month: "long", year: "numeric" });
  root.innerHTML = `<div class="ficha-view-content"><header class="ficha-view-heading"><div><p class="eyebrow">MI FICHA · CLASES</p><h2>Clases</h2><p class="class-period">Semana del ${escaparHTML(formatearFecha(inicioSemana(fechaSeleccionada), { day: "numeric", month: "short" }))} al ${escaparHTML(formatearFecha(sumar(inicioSemana(fechaSeleccionada), 5), { day: "numeric", month: "long" }))}</p></div><div class="class-view-controls"><div class="seg" role="group" aria-label="Vista de clases">${["diaria", "semana", "mes"].map(item => `<button type="button" data-class-view="${item}" aria-pressed="${vista === item}">${item[0].toUpperCase() + item.slice(1)}</button>`).join("")}</div>${esHoy(fechaSeleccionada) ? "" : '<button type="button" class="button button-secondary" data-class-today>Hoy</button>'}</div></header>
    ${vista === "mes" ? `<header class="class-month-heading"><button type="button" data-class-month="-1" aria-label="Mes anterior">‹</button><h3>${escaparHTML(month)}</h3><button type="button" data-class-month="1" aria-label="Mes siguiente">›</button></header>${renderMes()}` : vista === "semana" ? `<header class="class-month-heading"><button type="button" data-class-week="-1" aria-label="Semana anterior">‹</button><h3>Semana del ${escaparHTML(formatearFecha(inicioSemana(fechaSeleccionada), { day: "numeric", month: "short" }))}</h3><button type="button" data-class-week="1" aria-label="Semana siguiente">›</button></header>${renderSemana()}` : `<div class="class-rail" role="listbox" aria-label="Días de clase" aria-activedescendant="class-day-${fechaISO(fechaSeleccionada)}">${renderRail()}</div>`}
    ${renderDetalle()}</div>`;
  root.querySelector("#class-day-" + fechaISO(fechaSeleccionada))?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: document.documentElement.dataset.motion === "reduced" ? "auto" : "smooth" });
}

export function initClases() {
  const root = document.querySelector("#view-clases"); if (!root || root.dataset.clasesReady) return;
  root.dataset.clasesReady = "true";
  let suprimirClic = false;
  root.addEventListener("click", event => {
    const doc = event.target.closest("[data-library-highlight]");
    if (doc) document.dispatchEvent(new CustomEvent("traza:documento-resaltar", { detail: { id: doc.dataset.libraryHighlight } }));
    if (suprimirClic) { suprimirClic = false; event.preventDefault(); return; }
    const view = event.target.closest("[data-class-view]"); if (view) { vista = view.dataset.classView; renderClases(); return; }
    if (event.target.closest("[data-class-today]")) { cambiarFecha(hoy()); return; }
    const week = event.target.closest("[data-class-week]"); if (week) { cambiarFecha(sumar(fechaSeleccionada, Number(week.dataset.classWeek) * 7)); return; }
    const month = event.target.closest("[data-class-month]"); if (month) { const d = new Date(fechaSeleccionada); d.setMonth(d.getMonth() + Number(month.dataset.classMonth)); cambiarFecha(d); return; }
    const day = event.target.closest("[data-class-date]"); if (day) cambiarFecha(new Date(day.dataset.classDate + "T12:00:00"), 1, vista === "diaria");
  });
  document.addEventListener("traza:clase-seleccionada", event => {
    if (!event.detail?.fecha) return;
    vista = "diaria";
    cambiarFecha(new Date(event.detail.fecha + "T12:00:00"));
  });
  let drag = null;
  root.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse") return;
    const rail = event.target.closest(".class-rail");
    if (rail) drag = { rail, x: event.clientX, scroll: rail.scrollLeft };
  });
  root.addEventListener("pointermove", event => {
    if (!drag) return;
    if (Math.abs(event.clientX - drag.x) > 5) { drag.moved = true; suprimirClic = true; }
    drag.rail.scrollLeft = drag.scroll - (event.clientX - drag.x);
  });
  for (const name of ["pointerup", "pointercancel", "pointerleave"]) root.addEventListener(name, () => { drag = null; });
  root.addEventListener("keydown", event => {
    if (!root.querySelector(".class-rail") || !["ArrowLeft", "ArrowRight", "Home", "PageUp", "PageDown"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") cambiarFecha(hoy(), 1, true);
    else if (event.key === "PageUp") cambiarFecha(sumar(fechaSeleccionada, -7), -1, true);
    else if (event.key === "PageDown") cambiarFecha(sumar(fechaSeleccionada, 7), 1, true);
    else cambiarFecha(sumar(fechaSeleccionada, event.key === "ArrowLeft" ? -1 : 1), event.key === "ArrowLeft" ? -1 : 1, true);
  });
  renderClases();
}
