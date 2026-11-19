import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FICHA } from "../src/content/ficha.js";
import {
  obtenerFiltros, actualizarFiltro, limpiarFiltros,
  actividadPasaFiltros, competenciaPasaFiltro, renderFiltros
} from "../src/ficha/filtros.js";
import { initClases } from "../src/ficha/view-clases.js";
import { filtrarDocumentosBiblioteca, renderBiblioteca } from "../src/ficha/view-biblioteca.js";
import { competenceKey, competenceLogo, competenceMarker } from "../src/ficha/competencias-ui.js";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("los filtros iniciales muestran todas las competencias, sin ocultar actividades", () => {
  limpiarFiltros(false);
  assert.deepEqual(obtenerFiltros(), { competenciaId: "todas", estado: "todos" });
  const actividad = { id: "x", competenciaId: "logica-programacion", limite: "2026-11-19" };
  assert.equal(actividadPasaFiltros(actividad, {}, "2026-11-17"), true);
  assert.equal(competenciaPasaFiltro("logica-programacion"), true);
});

test("el filtro de competencia acepta ids existentes y comparte su valor", () => {
  limpiarFiltros(false);
  const actualizado = actualizarFiltro("competenciaId", "matematicas", false);
  assert.equal(actualizado.competenciaId, "matematicas");
  assert.equal(competenciaPasaFiltro("matematicas"), true);
  assert.equal(competenciaPasaFiltro("comunicacion"), false);
  assert.equal(actualizarFiltro("competenciaId", "no-existe", false).competenciaId, "matematicas");
  assert.match(renderFiltros("test"), /value="matematicas" selected/);
  limpiarFiltros(false);
});

test("el filtro de estado separa una actividad atrasada de su estado manual pendiente", () => {
  limpiarFiltros(false);
  const vencida = { id: "v", competenciaId: "logica-programacion", limite: "2026-11-16" };
  const personal = { actividades: { v: { estado: "pendiente" } } };
  actualizarFiltro("estado", "atrasada", false);
  assert.equal(actividadPasaFiltros(vencida, personal, "2026-11-17"), true);
  actualizarFiltro("estado", "pendiente", false);
  assert.equal(actividadPasaFiltros(vencida, personal, "2026-11-17"), false);
  limpiarFiltros(false);
});

test("el horario coincide con los días, horas, temas e instructores de la imagen compartida", () => {
  assert.equal(FICHA.horario.length, 8);
  const porDia = dia => FICHA.horario.filter(item => item.dia === dia);
  assert.deepEqual(porDia(1).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId, item.vigenteDesde, item.vigenteHasta]), [
    ["evaluar-requisitos", "18:00", "22:00", "jair-castaneda", null, "2026-11-01"],
    ["matematicas", "18:00", "22:00", "yilliam-romero", "2026-11-02", null]
  ]);
  assert.deepEqual(porDia(2).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["comunicacion", "18:00", "22:00", "sandra-lizcano"]
  ]);
  assert.deepEqual(porDia(3).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["evaluar-requisitos", "18:00", "22:00", "jair-castaneda"]
  ]);
  assert.deepEqual(porDia(4).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["tics", "18:00", "22:00", "yonel-torres"]
  ]);
  assert.deepEqual(porDia(5).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["establecer-requisitos", "18:00", "22:00", "gloria-romero"]
  ]);
  assert.deepEqual(porDia(6).map(item => [item.inicio, item.fin, item.instructorId]), [
    ["12:00", "16:00", "gloria-romero"], ["16:00", "22:00", "jair-castaneda"]
  ]);
  assert.equal(porDia(7).length, 0);
  assert.equal(FICHA.horarioNotas.length, 0);
});

test("cada competencia usa el marcador compartido con identidad estable y forma", () => {
  const ids = ["establecer-requisitos", "evaluar-requisitos", "tics", "comunicacion", "matematicas"];
  const keys = ids.map(competenceKey);
  assert.equal(new Set(keys).size, ids.length);
  for (const id of ids) {
    const marker = competenceMarker(id);
    assert.match(marker, new RegExp(`competence-marker--${id}`));
    assert.match(marker, /data-forma="(circulo|rombo|cuadrado|triangulo|hexagono)"/);
    assert.match(competenceLogo(id), new RegExp("competence-emblem--" + id));
  }
});

test("las vistas de Mi ficha están conectadas a la aplicación y tienen estilos", async () => {
  const html = await read("../index.html");
  const app = await read("../src/app.js");
  const init = await read("../src/ficha/init.js");
  const css = await read("../src/styles/ficha.css");
  for (const id of ["view-hoy", "view-clases"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.doesNotMatch(html, new RegExp('id="' + id + '"[^>]*ficha-placeholder'));
  }
  assert.match(html, /styles\/ficha\.css/);
  assert.match(app, /import \{ initFicha \}/);
  assert.match(app, /initFicha\(\)/);
  for (const marker of ["initControl", "renderControl", "initClases", "renderClases", "traza:ficha-actualizada"]) {
    assert.ok(init.includes(marker), "Falta conectar " + marker);
  }
  for (const selector of [".class-week-grid", ".class-month-grid", ".ficha-activity-card", ".class-rail"]) {
    assert.ok(css.includes(selector), "Falta estilo " + selector);
  }
});

test("Centro de control usa paneles de horario, evidencias, comunicados e instructores", async () => {
  const view = await read("../src/ficha/view-control.js");
  assert.match(view, /function renderHorario/);
  assert.match(view, /function renderEvidencias/);
  assert.match(view, /function renderComunicados/);
  assert.match(view, /function renderInstructores/);
  assert.match(view, /KEY_HECHAS = "traza:v4:evidencias-hechas"/);
  assert.match(view, /data-evidence-undo/);
  assert.match(view, /data-evidence-open/);
  assert.match(view, /control-evidence-dialog/);
  assert.deepEqual(FICHA.comunicados, []);
});

test("Clases conserva la fecha al cambiar entre las tres vistas y omite el domingo", () => {
  const listeners = {};
  const root = {
    dataset: {}, innerHTML: "",
    addEventListener(name, callback) { listeners[name] = callback; },
    querySelector() { return null; }
  };
  const previousDocument = globalThis.document;
  globalThis.document = { querySelector(selector) { return selector === "#view-clases" ? root : null; }, documentElement: { dataset: { motion: "reduced" } }, addEventListener() {} };
  try {
    initClases();
    const initial = root.innerHTML;
    assert.equal([...initial.matchAll(/role="option"/g)].length, 6);
    assert.match(initial, /aria-activedescendant="class-day-/);
    const date = initial.match(/aria-activedescendant="class-day-(\d{4}-\d{2}-\d{2})"/)[1];
    const click = match => listeners.click({ target: { closest(selector) { return selector === match.selector ? match.value : null; } } });
    click({ selector: "[data-class-view]", value: { dataset: { classView: "semana" } } });
    assert.match(root.innerHTML, new RegExp(`data-class-date="${date}"`));
    click({ selector: "[data-class-view]", value: { dataset: { classView: "mes" } } });
    assert.match(root.innerHTML, new RegExp(`data-class-date="${date}"`));
    click({ selector: "[data-class-view]", value: { dataset: { classView: "diaria" } } });
    assert.match(root.innerHTML, new RegExp(`aria-activedescendant="class-day-${date}"`));
  } finally {
    globalThis.document = previousDocument;
  }
});

test("los filtros de Biblioteca se combinan, buscan y ordenan por fecha", () => {
  const documentos = [
    { id: "a", titulo: "Guía de ciclos", nombreArchivo: "ciclos.pdf", mimeType: "application/pdf", publicadoEn: "2026-11-10", competenciaId: "matematicas", tema: "Ciclos", instructorId: "jair-castaneda" },
    { id: "b", titulo: "Guía de diagramas", nombreArchivo: "diagramas.pdf", mimeType: "application/pdf", publicadoEn: "2026-11-12", competenciaId: "logica-programacion", tema: "Diagramas", instructorId: "jair-castaneda" },
    { id: "c", titulo: "Video de ciclos", nombreArchivo: "ciclos.mp4", mimeType: "video/mp4", publicadoEn: "2026-11-15", competenciaId: "matematicas", tema: "Ciclos", instructorId: "sandra-lizcano" }
  ];
  const all = { competencia: "todas", tema: "todos", instructor: "todos", tipo: "todos", desde: "", hasta: "" };
  assert.deepEqual(filtrarDocumentosBiblioteca(documentos, "ciclos", all).map(item => item.id), ["c", "a"]);
  assert.deepEqual(filtrarDocumentosBiblioteca(documentos, "", { ...all, competencia: "matematicas", tipo: "pdf" }).map(item => item.id), ["a"]);
  assert.deepEqual(filtrarDocumentosBiblioteca(documentos, "", { ...all, desde: "2026-11-12", hasta: "2026-11-15" }).map(item => item.id), ["c", "b"]);
});

test("Biblioteca usa el vacío de manifiesto sin inventar materiales", () => {
  const root = { dataset: {}, innerHTML: "" };
  const previousDocument = globalThis.document;
  globalThis.document = { querySelector(selector) { return selector === "#view-biblioteca" ? root : null; } };
  try {
    renderBiblioteca();
    assert.match(root.innerHTML, /Sin documentos por ahora/);
    assert.match(root.innerHTML, /Filtros \(0\)/);
    assert.doesNotMatch(root.innerHTML, /href="javascript:/);
  } finally { globalThis.document = previousDocument; }
});
