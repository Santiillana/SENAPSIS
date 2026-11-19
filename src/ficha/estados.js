export const ESTADO = Object.freeze({
  PENDIENTE: "pendiente",
  EN_CURSO: "en_curso",
  ENTREGADA: "entregada",
  POR_CORREGIR: "por_corregir",
  APROBADA: "aprobada",
  ATRASADA: "atrasada"
});

export const ESTADOS = Object.freeze({
  [ESTADO.PENDIENTE]: Object.freeze({
    etiqueta: "Pendiente", icono: "○",
    colores: Object.freeze({ oscuro: "#9FB3C4", claro: "#5A6472" }),
    derivado: false
  }),
  [ESTADO.EN_CURSO]: Object.freeze({
    etiqueta: "En curso", icono: "◐",
    colores: Object.freeze({ oscuro: "#4FC3F7", claro: "#0B6FA4" }),
    derivado: false
  }),
  [ESTADO.ENTREGADA]: Object.freeze({
    etiqueta: "Entregada", icono: "✓",
    colores: Object.freeze({ oscuro: "#B39DFF", claro: "#5B3FD0" }),
    derivado: false
  }),
  [ESTADO.POR_CORREGIR]: Object.freeze({
    etiqueta: "Por corregir", icono: "⚠",
    colores: Object.freeze({ oscuro: "#FF9F4A", claro: "#B45309" }),
    derivado: false
  }),
  [ESTADO.APROBADA]: Object.freeze({
    etiqueta: "Aprobada", icono: "●",
    colores: Object.freeze({ oscuro: "#3CCF8E", claro: "#0F7B4F" }),
    derivado: false, bloqueada: true
  }),
  [ESTADO.ATRASADA]: Object.freeze({
    etiqueta: "Atrasada", icono: "!",
    colores: Object.freeze({ oscuro: "#FF6B85", claro: "#C62A47" }),
    derivado: true
  })
});

export const ESTADOS_MANUALES = Object.freeze([
  ESTADO.PENDIENTE, ESTADO.EN_CURSO, ESTADO.ENTREGADA
]);

// Atrasada es derivada. Por corregir y Aprobada requieren resultado del instructor.
export const ESTADOS_PERSISTIBLES = Object.freeze([
  ESTADO.PENDIENTE, ESTADO.EN_CURSO, ESTADO.ENTREGADA,
  ESTADO.POR_CORREGIR, ESTADO.APROBADA
]);

export function checklistVacio() {
  return { subida: false, enviada: false, confirmada: false };
}

export function checklistCompleto() {
  return { subida: true, enviada: true, confirmada: true };
}

/** El aprendiz solo puede elegir Pendiente, En curso o Entregada. */
export function cambiarEstadoManual(estadoActual, estadoNuevo) {
  if (estadoActual === ESTADO.APROBADA) {
    return { permitido: false, estado: ESTADO.APROBADA, razon: "aprobada_bloqueada" };
  }
  if (!ESTADOS_MANUALES.includes(estadoNuevo)) {
    return { permitido: false, estado: estadoActual, razon: "estado_no_manual" };
  }
  return { permitido: true, estado: estadoNuevo, razon: null };
}

/** Registra el resultado del instructor y aplica las transiciones definidas. */
export function registrarResultadoInstructor(juicio) {
  if (juicio === "aprobado") {
    return {
      permitido: true, estado: ESTADO.APROBADA,
      checklist: checklistCompleto(), bloqueada: true
    };
  }
  if (juicio === "no_aprobado") {
    return {
      permitido: true, estado: ESTADO.POR_CORREGIR,
      checklist: checklistVacio(), bloqueada: false
    };
  }
  throw new RangeError("El juicio debe ser aprobado o no_aprobado.");
}

/** Confirmar la entrega cambia a Entregada; Aprobada permanece bloqueada. */
export function actualizarChecklist(estadoActual, checklist, campo, valor) {
  if (estadoActual === ESTADO.APROBADA) {
    return { permitido: false, estado: estadoActual, checklist: checklistCompleto() };
  }
  if (!["subida", "enviada", "confirmada"].includes(campo)) {
    throw new RangeError("El punto de checklist no es válido.");
  }
  if (typeof valor !== "boolean") {
    throw new TypeError("El valor del checklist debe ser booleano.");
  }

  const siguiente = { ...checklistVacio(), ...(checklist || {}), [campo]: valor };
  let estado = estadoActual;
  if (campo === "confirmada" && valor) estado = ESTADO.ENTREGADA;
  if (campo === "confirmada" && !valor && estadoActual === ESTADO.ENTREGADA) {
    estado = ESTADO.EN_CURSO;
  }
  return { permitido: true, estado, checklist: siguiente };
}
