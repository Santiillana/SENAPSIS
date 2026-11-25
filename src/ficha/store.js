import { parsearFechaLocal } from "./fechas.js";
import { ESTADOS_PERSISTIBLES } from "./estados.js";

export const CLAVE_FICHA = "senapsis:v4:ficha";
export const VERSION_FICHA = 1;
export const FORMATO_RESPALDO_FICHA = "senapsis-ficha-personal-backup";
export const VERSION_RESPALDO_FICHA = 1;
const CAMPOS_CHECKLIST = ["subida", "enviada", "confirmada"];
const esObjeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);

function almacenamientoPorDefecto() {
  try { return globalThis.localStorage ?? null; }
  catch { return null; }
}

function fechaISOValida(valor) {
  return typeof valor === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    parsearFechaLocal(valor) !== null;
}

export function crearFichaInicial() {
  return {
    v: VERSION_FICHA,
    ultimoExport: null,
    actividades: {},
    favoritos: [],
    guardados: []
  };
}

/** Valida los datos antes de guardarlos o aceptarlos desde un respaldo. */
export function validarFichaPersonal(datos) {
  const errores = [];
  if (!esObjeto(datos)) {
    return { ok: false, errores: ["La ficha personal debe ser un objeto."] };
  }
  if (datos.v !== VERSION_FICHA) errores.push("La versión de la ficha no es compatible.");
  if (datos.ultimoExport !== null && !fechaISOValida(datos.ultimoExport)) {
    errores.push("ultimoExport debe ser null o una fecha YYYY-MM-DD válida.");
  }

  if (!esObjeto(datos.actividades)) {
    errores.push("actividades debe ser un objeto indexado por identificador.");
  } else {
    for (const [id, registro] of Object.entries(datos.actividades)) {
      const prefijo = "Actividad " + id + ": ";
      if (!id.trim()) errores.push("Hay una actividad sin identificador.");
      if (!esObjeto(registro)) {
        errores.push(prefijo + "el registro debe ser un objeto.");
        continue;
      }
      if (!ESTADOS_PERSISTIBLES.includes(registro.estado)) {
        errores.push(prefijo + "el estado no es persistible.");
      }
      if (typeof registro.notas !== "string") errores.push(prefijo + "notas debe ser texto.");

      if (!esObjeto(registro.checklist)) {
        errores.push(prefijo + "checklist debe ser un objeto.");
      } else {
        for (const campo of CAMPOS_CHECKLIST) {
          if (typeof registro.checklist[campo] !== "boolean") {
            errores.push(prefijo + "checklist." + campo + " debe ser booleano.");
          }
        }
      }

      if (!Array.isArray(registro.intentos)) {
        errores.push(prefijo + "intentos debe ser una lista.");
      } else {
        const numeros = new Set();
        for (const intento of registro.intentos) {
          if (!esObjeto(intento)) {
            errores.push(prefijo + "cada intento debe ser un objeto.");
            continue;
          }
          if (!Number.isInteger(intento.n) || intento.n < 1 || numeros.has(intento.n)) {
            errores.push(prefijo + "cada intento necesita un número positivo y único.");
          } else {
            numeros.add(intento.n);
          }
          if (!fechaISOValida(intento.fecha)) {
            errores.push(prefijo + "la fecha del intento debe ser YYYY-MM-DD válida.");
          }
          if (!["aprobado", "no_aprobado"].includes(intento.juicio)) {
            errores.push(prefijo + "el juicio debe ser aprobado o no_aprobado.");
          }
          if (typeof intento.correccion !== "string") {
            errores.push(prefijo + "correccion debe ser texto.");
          } else if (intento.juicio === "no_aprobado" && !intento.correccion.trim()) {
            errores.push(prefijo + "la corrección es obligatoria cuando no está aprobado.");
          }
          if (intento.enlace !== null && typeof intento.enlace !== "string") {
            errores.push(prefijo + "enlace debe ser texto o null.");
          }
        }
      }
    }
  }

  for (const campo of ["favoritos", "guardados"]) {
    const lista = datos[campo];
    if (!Array.isArray(lista) || lista.some(item => typeof item !== "string" || !item.trim())) {
      errores.push(campo + " debe ser una lista de identificadores de texto no vacíos.");
    } else if (new Set(lista).size !== lista.length) {
      errores.push(campo + " no puede contener identificadores duplicados.");
    }
  }

  return { ok: errores.length === 0, errores };
}

export function leerFichaEstricto(almacenamiento = almacenamientoPorDefecto()) {
  if (!almacenamiento || typeof almacenamiento.getItem !== "function") {
    return { ok: false, razon: "almacenamiento_no_disponible", datos: null };
  }
  let serializado;
  try { serializado = almacenamiento.getItem(CLAVE_FICHA); }
  catch { return { ok: false, razon: "almacenamiento_no_disponible", datos: null }; }
  if (serializado === null || serializado === "") {
    return { ok: true, vacia: true, datos: crearFichaInicial() };
  }
  let datos;
  try { datos = JSON.parse(serializado); }
  catch { return { ok: false, razon: "json_corrupto", datos: null }; }
  if (!esObjeto(datos) || datos.v !== VERSION_FICHA) {
    return { ok: false, razon: "version_desconocida", version: datos?.v ?? null, datos: null };
  }
  const validacion = validarFichaPersonal(datos);
  if (!validacion.ok) return { ok: false, razon: "estructura_invalida", errores: validacion.errores, datos: null };
  return { ok: true, vacia: false, datos };
}

/** El fallback vacío es solo visual y nunca autoriza a sobrescribir. */
export function leerFicha(almacenamiento = almacenamientoPorDefecto()) {
  const lectura = leerFichaEstricto(almacenamiento);
  return lectura.ok ? lectura.datos : crearFichaInicial();
}

function guardarFichaInterno(datos, almacenamiento, permitirReemplazoInvalido = false) {
  const validacion = validarFichaPersonal(datos);
  if (!validacion.ok) return { ok: false, razon: "datos_invalidos", errores: validacion.errores };
  if (!almacenamiento || typeof almacenamiento.setItem !== "function") {
    return { ok: false, razon: "almacenamiento_no_disponible", errores: ["El almacenamiento local no está disponible."] };
  }
  const existente = leerFichaEstricto(almacenamiento);
  if (!existente.ok && !permitirReemplazoInvalido) {
    return { ok: false, razon: "datos_existentes_no_validos", detalle: existente.razon,
      errores: ["Los datos existentes están dañados o usan una versión desconocida. Importa un respaldo validado antes de continuar."] };
  }
  try {
    almacenamiento.setItem(CLAVE_FICHA, JSON.stringify(datos));
    return { ok: true, razon: null, errores: [] };
  } catch {
    return { ok: false, razon: "fallo_escritura", errores: ["No fue posible guardar la ficha en este navegador."] };
  }
}

export function guardarFicha(datos, almacenamiento = almacenamientoPorDefecto()) {
  return guardarFichaInterno(datos, almacenamiento);
}

export function crearRespaldoFicha(almacenamiento = almacenamientoPorDefecto(), reloj = () => new Date()) {
  const lectura = leerFichaEstricto(almacenamiento);
  if (!lectura.ok) return { ok: false, razon: lectura.razon };
  const instante = reloj();
  if (!(instante instanceof Date) || !Number.isFinite(instante.getTime())) return { ok: false, razon: "reloj_invalido" };
  return { ok: true, respaldo: {
    formato: FORMATO_RESPALDO_FICHA, version: VERSION_RESPALDO_FICHA,
    exportadoEn: instante.toISOString(), datos: lectura.datos
  }};
}

export function validarRespaldoFicha(respaldo) {
  if (!esObjeto(respaldo) || respaldo.formato !== FORMATO_RESPALDO_FICHA ||
      respaldo.version !== VERSION_RESPALDO_FICHA || typeof respaldo.exportadoEn !== "string" ||
      !Number.isFinite(Date.parse(respaldo.exportadoEn))) return { ok: false, razon: "respaldo_invalido" };
  const validacion = validarFichaPersonal(respaldo.datos);
  return validacion.ok ? { ok: true, datos: respaldo.datos } :
    { ok: false, razon: "datos_invalidos", errores: validacion.errores };
}

export function importarRespaldoFicha(respaldo, almacenamiento = almacenamientoPorDefecto()) {
  const validacion = validarRespaldoFicha(respaldo);
  if (!validacion.ok) return validacion;
  const guardado = guardarFichaInterno(validacion.datos, almacenamiento, true);
  return guardado.ok ? { ok: true, datos: validacion.datos } : guardado;
}

export function borrarFicha(almacenamiento = almacenamientoPorDefecto()) {
  if (!almacenamiento || typeof almacenamiento.removeItem !== "function") return false;
  try {
    almacenamiento.removeItem(CLAVE_FICHA);
    return true;
  } catch {
    return false;
  }
}
