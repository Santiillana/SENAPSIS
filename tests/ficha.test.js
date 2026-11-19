import test from "node:test";
import assert from "node:assert/strict";
import { FICHA } from "../src/content/ficha.js";
import { lessons } from "../src/content/lessons.js";
import { exercises } from "../src/content/exercises.js";
import {
  parsearFechaLocal, hoy, fechaISO, diferenciaDias, inicioSemana, finSemana, diaSemana, textoRelativo
} from "../src/ficha/fechas.js";
import {
  ESTADO, ESTADOS, ESTADOS_MANUALES, ESTADOS_PERSISTIBLES,
  checklistVacio, checklistCompleto, cambiarEstadoManual,
  registrarResultadoInstructor, actualizarChecklist
} from "../src/ficha/estados.js";
import {
  CLAVE_FICHA, crearFichaInicial, validarFichaPersonal, leerFicha, guardarFicha, borrarFicha,
  leerFichaEstricto, crearRespaldoFicha, validarRespaldoFicha, importarRespaldoFicha,
  FORMATO_RESPALDO_FICHA
} from "../src/ficha/store.js";
import { clasificar, panel, clasesDelDia, resumenPorCompetencia } from "../src/ficha/selectores.js";
import { validarDocumentoOficial, documentosPublicados } from "../src/ficha/documentos.js";

function crearAlmacenamiento() {
  const valores = new Map();
  return {
    getItem: clave => valores.has(clave) ? valores.get(clave) : null,
    setItem: (clave, valor) => valores.set(clave, String(valor)),
    removeItem: clave => valores.delete(clave),
    valores
  };
}

function registro(estado = ESTADO.PENDIENTE) {
  return { estado, notas: "", checklist: checklistVacio(), intentos: [] };
}

function personalConEstados() {
  return {
    v: 1, ultimoExport: null,
    actividades: {
      "actividad-diagrama": registro(ESTADO.PENDIENTE),
      "actividad-comparaciones": registro(ESTADO.POR_CORREGIR),
      "actividad-ciclos": { ...registro(ESTADO.ENTREGADA), checklist: checklistCompleto() },
      "actividad-validacion": { ...registro(ESTADO.APROBADA), checklist: checklistCompleto() }
    },
    favoritos: [], guardados: []
  };
}

test("la ficha de ejemplo tiene estructura, ids únicos y referencias existentes", () => {
  assert.ok(FICHA.meta.programa && FICHA.meta.codigo && FICHA.meta.actualizado && FICHA.meta.fuente);
  assert.equal(FICHA.meta.esDemostracion, true);
  assert.equal(FICHA.competencias.length, 8);
  assert.equal(FICHA.instructores.length, 6);
  assert.equal(FICHA.actividades.length, 4);
  assert.equal(FICHA.clases.length, 2);
  assert.equal(FICHA.recursos.length, 3);
  assert.equal(FICHA.accesos.length, 4);

  const comprobarIds = lista => {
    const ids = lista.map(item => item.id);
    assert.ok(ids.every(id => typeof id === "string" && id.length > 0));
    assert.equal(new Set(ids).size, ids.length, "Hay ids duplicados.");
  };
  for (const lista of [FICHA.competencias, FICHA.instructores, FICHA.actividades, FICHA.clases, FICHA.recursos, FICHA.accesos]) {
    comprobarIds(lista);
  }

  const competencias = new Set(FICHA.competencias.map(item => item.id));
  const instructores = new Set(FICHA.instructores.map(item => item.id));
  const lecciones = new Set(lessons.map(item => item.id));
  const ejercicios = new Set(exercises.map(item => item.id));

  for (const actividad of FICHA.actividades) {
    assert.ok(competencias.has(actividad.competenciaId), actividad.id + ": competencia inexistente.");
    for (const id of actividad.leccionIds) assert.ok(lecciones.has(id), actividad.id + ": lección inexistente " + id);
    for (const id of actividad.ejercicioIds) assert.ok(ejercicios.has(id), actividad.id + ": ejercicio inexistente " + id);
  }
  for (const horario of FICHA.horario) {
    assert.ok(competencias.has(horario.competenciaId));
    assert.ok(instructores.has(horario.instructorId));
    assert.ok(horario.dia >= 1 && horario.dia <= 6);
    assert.match(horario.inicio, /^([01]\d|2[0-3]):[0-5]\d$/);
    assert.match(horario.fin, /^([01]\d|2[0-3]):[0-5]\d$/);
  }
  for (const clase of FICHA.clases) {
    assert.ok(competencias.has(clase.competenciaId));
    assert.ok(parsearFechaLocal(clase.fecha));
    for (const tema of clase.temas) {
      if (tema.leccionId) assert.ok(lecciones.has(tema.leccionId), tema.id + ": lección inexistente.");
      for (const id of tema.ejercicioIds) assert.ok(ejercicios.has(id), tema.id + ": ejercicio inexistente " + id);
    }
  }
  for (const recurso of FICHA.recursos) {
    assert.ok(["sena", "extra"].includes(recurso.espacio));
    assert.ok(competencias.has(recurso.competenciaId));
  }
  for (const acceso of FICHA.accesos) assert.match(acceso.url, /^https:\/\/.+/);
  assert.deepEqual(FICHA.documentos, []);
});

test("las fechas se interpretan a medianoche local y rechazan valores imposibles", () => {
  const fecha = parsearFechaLocal("2026-11-17");
  assert.ok(fecha instanceof Date);
  assert.equal(fecha.getFullYear(), 2026);
  assert.equal(fecha.getMonth(), 10);
  assert.equal(fecha.getDate(), 17);
  assert.equal(fecha.getHours(), 0);
  assert.equal(parsearFechaLocal("2026-02-30"), null);
  assert.equal(parsearFechaLocal("17/11/2026"), null);
  assert.equal(parsearFechaLocal("2026-11-7"), null);
  assert.equal(parsearFechaLocal(null), null);
});

test("hoy acepta un reloj inyectado y elimina la parte horaria", () => {
  const valor = hoy(() => new Date(2026, 10, 17, 22, 45, 30));
  assert.equal(fechaISO(valor), "2026-11-17");
  assert.equal(valor.getHours(), 0);
  assert.equal(fechaISO(hoy(new Date(2026, 10, 18, 8))), "2026-11-18");
  assert.throws(() => hoy(new Date("fecha inválida")), TypeError);
});

test("inicio y fin de semana usan lunes y sábado, incluso cuando la referencia es domingo", () => {
  assert.equal(fechaISO(inicioSemana(new Date(2026, 10, 17))), "2026-11-16");
  assert.equal(fechaISO(finSemana(new Date(2026, 10, 17))), "2026-11-21");
  assert.equal(fechaISO(inicioSemana(new Date(2026, 10, 22))), "2026-11-16");
  assert.equal(fechaISO(finSemana(new Date(2026, 10, 22))), "2026-11-21");
  assert.equal(diaSemana(new Date(2026, 10, 16)), 1);
  assert.equal(diaSemana(new Date(2026, 10, 21)), 6);
  assert.equal(diaSemana(new Date(2026, 10, 22)), 7);
});

test("la diferencia de días y el texto relativo no dependen de UTC", () => {
  assert.equal(diferenciaDias("2026-12-01", "2026-11-30"), 1);
  assert.equal(diferenciaDias("2026-11-14", "2026-11-17"), -3);
  assert.equal(diferenciaDias("2026-11-17", "2026-11-17"), 0);
  assert.equal(textoRelativo("2026-11-17", "2026-11-17"), "vence hoy");
  assert.equal(textoRelativo("2026-11-18", "2026-11-17"), "vence mañana");
  assert.equal(textoRelativo("2026-11-14", "2026-11-17"), "venció hace 3 días");
  assert.equal(textoRelativo(null, "2026-11-17"), "");
});

test("la clasificación prioriza la revisión del instructor y no marca como atrasada una entrega", () => {
  const hoyRef = "2026-11-17";
  const actividad = { id: "x", limite: "2026-11-16" };
  assert.equal(clasificar(actividad, { estado: ESTADO.APROBADA }, hoyRef), "aprobada");
  assert.equal(clasificar(actividad, { estado: ESTADO.POR_CORREGIR }, hoyRef), "porCorregir");
  assert.equal(clasificar(actividad, { estado: ESTADO.ENTREGADA }, hoyRef), "entregada");
  assert.equal(clasificar(actividad, { estado: ESTADO.PENDIENTE }, hoyRef), "atrasada");
});

test("la clasificación distingue hoy, esta semana, próxima, sin fecha y domingo", () => {
  const base = { id: "x" };
  assert.equal(clasificar({ ...base, limite: "2026-11-17" }, {}, "2026-11-17"), "hoy");
  assert.equal(clasificar({ ...base, limite: "2026-11-20" }, {}, "2026-11-17"), "semana");
  assert.equal(clasificar({ ...base, limite: "2026-11-22" }, {}, "2026-11-17"), "proxima");
  assert.equal(clasificar({ ...base, limite: null }, {}, "2026-11-17"), "sinFecha");
  assert.equal(clasificar({ ...base, limite: "2026-11-23" }, {}, "2026-11-22"), "proxima");
});

test("el panel agrupa por prioridad y el filtro solo lo que falta oculta entregadas y aprobadas", () => {
  const personal = personalConEstados();
  const resultado = panel(personal, "2026-11-17");
  assert.equal(resultado.total, 4);
  assert.equal(resultado.totalPendiente, 2);
  assert.equal(resultado.porCorregir.length, 1);
  assert.equal(resultado.entregadas.length, 1);
  assert.equal(resultado.aprobadas.length, 1);
  assert.equal(resultado.porCorregir[0].clasificacion, "porCorregir");

  const pendientes = panel(personal, "2026-11-17", { soloLoQueFalta: true });
  assert.equal(pendientes.total, 2);
  assert.equal(pendientes.entregadas.length, 0);
  assert.equal(pendientes.aprobadas.length, 0);
});

test("el horario resuelve instructor y competencia y excluye domingos", () => {
  const horario = [
    { dia: 2, inicio: "08:00", fin: "10:00", competenciaId: "logica-programacion", instructorId: "instructor-por-configurar", ambiente: "Aula 3" },
    { dia: 2, inicio: "10:00", fin: "12:00", competenciaId: "competencia-por-configurar", instructorId: "instructor-por-configurar", ambiente: "Aula 4" }
  ];
  const martes = clasesDelDia("2026-11-17", horario);
  assert.equal(martes.length, 2);
  assert.equal(martes[0].competencia.codigo, "LP-01");
  assert.equal(martes[0].instructor.nombre, "Instructor por configurar");
  assert.equal(clasesDelDia("2026-11-22", horario).length, 0);
  assert.equal(clasesDelDia("2026-11-17").length, 1);
  assert.equal(clasesDelDia("2026-11-17")[0].competencia.id, "comunicacion");
  assert.equal(clasesDelDia("2026-10-26")[0].competencia.id, "evaluar-requisitos");
  assert.equal(clasesDelDia("2026-11-02")[0].competencia.id, "matematicas");
  assert.equal(clasesDelDia("2026-11-09")[0].instructor.id, "yilliam-romero");
});

test("el resumen por competencia cuenta aprobación del instructor, no entrega", () => {
  const resumen = resumenPorCompetencia(personalConEstados(), "2026-11-17");
  assert.equal(resumen[0].total, 4);
  assert.equal(resumen[0].aprobadas, 1);
  assert.equal(resumen[0].entregadas, 1);
  assert.equal(resumen[0].porcentajeAprobado, 25);
});

test("la ficha personal valida versión, estructura, checklist, intentos y favoritos", () => {
  const inicial = crearFichaInicial();
  assert.deepEqual(validarFichaPersonal(inicial), { ok: true, errores: [] });

  const invalida = {
    ...inicial, actividades: {
      x: {
        estado: "atrasada", notas: 4, checklist: { subida: true, enviada: "sí", confirmada: false },
        intentos: [{ n: 1, fecha: "2026-02-30", juicio: "no_aprobado", correccion: " ", enlace: null }]
      }
    },
    favoritos: ["x", "x"]
  };
  const resultado = validarFichaPersonal(invalida);
  assert.equal(resultado.ok, false);
  assert.ok(resultado.errores.length >= 5);
});

test("localStorage tolera ausencia, JSON corrupto, versión desconocida y errores de acceso", () => {
  assert.deepEqual(leerFicha(null), crearFichaInicial());

  const almacenamiento = crearAlmacenamiento();
  almacenamiento.setItem(CLAVE_FICHA, "{mal json");
  assert.deepEqual(leerFicha(almacenamiento), crearFichaInicial());
  almacenamiento.setItem(CLAVE_FICHA, JSON.stringify({ ...crearFichaInicial(), v: 99 }));
  assert.deepEqual(leerFicha(almacenamiento), crearFichaInicial());

  const defectuoso = {
    getItem() { throw new Error("bloqueado"); },
    setItem() { throw new Error("bloqueado"); },
    removeItem() { throw new Error("bloqueado"); }
  };
  assert.deepEqual(leerFicha(defectuoso), crearFichaInicial());
  assert.equal(guardarFicha(crearFichaInicial(), defectuoso).ok, false);
  assert.equal(borrarFicha(defectuoso), false);
});

test("guardar, leer y borrar ficha conserva los datos sin alterar otras claves", () => {
  const almacenamiento = crearAlmacenamiento();
  almacenamiento.setItem("traza:v2:learn", JSON.stringify({ completed: ["algorithm"] }));
  const datos = crearFichaInicial();
  datos.favoritos.push("recurso-uno");
  datos.actividades["actividad-diagrama"] = registro(ESTADO.EN_CURSO);

  assert.equal(guardarFicha(datos, almacenamiento).ok, true);
  assert.deepEqual(leerFicha(almacenamiento), datos);
  assert.equal(borrarFicha(almacenamiento), true);
  assert.deepEqual(leerFicha(almacenamiento), crearFichaInicial());
  assert.ok(almacenamiento.getItem("traza:v2:learn"));
});

test("las transiciones protegen Aprobada y reservan los juicios al instructor", () => {
  assert.deepEqual(ESTADOS_MANUALES, [ESTADO.PENDIENTE, ESTADO.EN_CURSO, ESTADO.ENTREGADA]);
  assert.ok(ESTADOS_PERSISTIBLES.includes(ESTADO.POR_CORREGIR));
  assert.ok(!ESTADOS_PERSISTIBLES.includes(ESTADO.ATRASADA));
  assert.equal(cambiarEstadoManual(ESTADO.PENDIENTE, ESTADO.APROBADA).permitido, false);
  assert.equal(cambiarEstadoManual(ESTADO.APROBADA, ESTADO.EN_CURSO).permitido, false);
  assert.equal(cambiarEstadoManual(ESTADO.PENDIENTE, ESTADO.EN_CURSO).estado, ESTADO.EN_CURSO);

  const noAprobado = registrarResultadoInstructor("no_aprobado");
  assert.equal(noAprobado.estado, ESTADO.POR_CORREGIR);
  assert.deepEqual(noAprobado.checklist, checklistVacio());
  const aprobado = registrarResultadoInstructor("aprobado");
  assert.equal(aprobado.estado, ESTADO.APROBADA);
  assert.deepEqual(aprobado.checklist, checklistCompleto());
  assert.throws(() => registrarResultadoInstructor("pendiente"), RangeError);
});

test("confirmar entrega mueve a Entregada y la actividad aprobada no se puede reabrir", () => {
  const resultado = actualizarChecklist(ESTADO.EN_CURSO, checklistVacio(), "confirmada", true);
  assert.equal(resultado.estado, ESTADO.ENTREGADA);
  assert.equal(resultado.checklist.confirmada, true);
  const bloqueada = actualizarChecklist(ESTADO.APROBADA, checklistCompleto(), "confirmada", false);
  assert.equal(bloqueada.permitido, false);
  assert.equal(bloqueada.estado, ESTADO.APROBADA);
  assert.throws(() => actualizarChecklist(ESTADO.EN_CURSO, checklistVacio(), "desconocido", true), RangeError);
});

test("los estados siguen etiquetados independientemente del color de competencia", () => {
  assert.equal(ESTADOS[ESTADO.PENDIENTE].etiqueta, "Pendiente");
  assert.equal(ESTADOS[ESTADO.ATRASADA].derivado, true);
});

test("la metadata de documentos impide publicar archivos sin URL segura y filtra por destino", () => {
  const base = {
    id: "doc-1", titulo: "Guía de clase", descripcion: "Material de lectura",
    nombreArchivo: "guia.pdf", mimeType: "application/pdf", tamanoBytes: 2048,
    url: "https://archivos.example/guia.pdf", secciones: ["clases", "biblioteca"],
    estadoPublicacion: "publicado", publicadoEn: "2026-11-17",
    actualizado: "2026-11-17", fuente: "Instructor"
  };
  assert.equal(validarDocumentoOficial(base).ok, true);
  assert.equal(validarDocumentoOficial({ ...base, url: "javascript:alert(1)" }).ok, false);
  assert.equal(validarDocumentoOficial({ ...base, url: "https://usuario:clave@archivos.example/guia.pdf" }).ok, false);
  assert.equal(validarDocumentoOficial({ ...base, url: "/archivos/%2e%2e/privado.pdf" }).ok, false);
  assert.equal(validarDocumentoOficial({ ...base, url: null }).ok, false);
  assert.equal(validarDocumentoOficial({ ...base, estadoPublicacion: "borrador", url: null, publicadoEn: null }).ok, true);

  const ficha = {
    actividades: [{ id: "actividad-diagrama" }],
    documentos: [
      base,
      { ...base, id: "doc-2", estadoPublicacion: "borrador" },
      { ...base, id: "doc-3", secciones: ["actividades"], actividadId: "actividad-diagrama" }
    ]
  };
  assert.deepEqual(documentosPublicados("clases", {}, ficha).map(item => item.id), ["doc-1"]);
  assert.deepEqual(documentosPublicados("actividades", { actividadId: "actividad-diagrama" }, ficha).map(item => item.id), ["doc-3"]);
  ficha.documentos.push({ ...base, id: "doc-inseguro", secciones: ["actividades"], actividadId: "actividad-diagrama", url: "javascript:alert(1)" });
  ficha.documentos.push({ ...base, id: "doc-huerfano", secciones: ["actividades"], actividadId: "actividad-no-existente" });
  assert.deepEqual(documentosPublicados("actividades", { actividadId: "actividad-diagrama" }, ficha).map(item => item.id), ["doc-3"]);
});


test("la lectura estricta distingue vacío, corrupción, versión futura y almacenamiento inaccesible", () => {
  const storage = crearAlmacenamiento();
  assert.equal(leerFichaEstricto(storage).vacia, true);
  storage.setItem(CLAVE_FICHA, "{roto");
  assert.equal(leerFichaEstricto(storage).razon, "json_corrupto");
  storage.setItem(CLAVE_FICHA, JSON.stringify({ v: 99 }));
  assert.equal(leerFichaEstricto(storage).razon, "version_desconocida");
  storage.setItem(CLAVE_FICHA, JSON.stringify({ ...crearFichaInicial(), favoritos: "inválido" }));
  assert.equal(leerFichaEstricto(storage).razon, "estructura_invalida");
  assert.equal(leerFichaEstricto(null).razon, "almacenamiento_no_disponible");
});

test("el guardado normal no sobrescribe datos corruptos ni esquemas desconocidos", () => {
  const storage = crearAlmacenamiento();
  storage.setItem(CLAVE_FICHA, "{no reemplazar");
  const raw = storage.getItem(CLAVE_FICHA);
  assert.equal(guardarFicha(crearFichaInicial(), storage).ok, false);
  assert.equal(storage.getItem(CLAVE_FICHA), raw);
  storage.setItem(CLAVE_FICHA, JSON.stringify({ v: 88 }));
  const future = storage.getItem(CLAVE_FICHA);
  assert.equal(guardarFicha(crearFichaInicial(), storage).ok, false);
  assert.equal(storage.getItem(CLAVE_FICHA), future);
});

test("el respaldo versionado solo exporta una ficha íntegra", () => {
  const storage = crearAlmacenamiento();
  const data = crearFichaInicial();
  data.favoritos.push("recurso-uno");
  assert.equal(guardarFicha(data, storage).ok, true);
  const result = crearRespaldoFicha(storage, () => new Date("2026-11-17T12:00:00.000Z"));
  assert.equal(result.ok, true);
  assert.equal(result.respaldo.formato, FORMATO_RESPALDO_FICHA);
  assert.deepEqual(validarRespaldoFicha(result.respaldo), { ok: true, datos: data });
  storage.setItem(CLAVE_FICHA, "{corrupto");
  assert.equal(crearRespaldoFicha(storage).ok, false);
  assert.equal(validarRespaldoFicha({ ...result.respaldo, datos: { v: 99 } }).ok, false);
});

test("la importación validada recupera almacenamiento dañado sin aceptar respaldos inválidos", () => {
  const storage = crearAlmacenamiento();
  storage.setItem(CLAVE_FICHA, "{dañado");
  const data = crearFichaInicial();
  data.guardados.push("leccion-terminals");
  const backup = { formato: FORMATO_RESPALDO_FICHA, version: 1,
    exportadoEn: "2026-11-17T12:00:00.000Z", datos: data };
  assert.equal(importarRespaldoFicha({ ...backup, datos: { v: 99 } }, storage).ok, false);
  assert.equal(storage.getItem(CLAVE_FICHA), "{dañado");
  assert.equal(importarRespaldoFicha(backup, storage).ok, true);
  assert.deepEqual(leerFicha(storage), data);
});
