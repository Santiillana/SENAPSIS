/**
 * Adapt interpreter events to the stable view contract consumed by simulator
 * shells. The interpreter remains the source of truth for execution state.
 */
export function buildFlowSteps(events) {
  if (!Array.isArray(events)) throw new TypeError("La traza debe ser una lista de eventos.");
  return events.map((event, index) => ({
    ...event,
    id: `flujo:${event.step ?? index}`,
    foco: event.nodeId == null ? null : String(event.nodeId),
    globo: String(event.scene?.body ?? event.message ?? ""),
    escena: { tipo: event.type, datos: event },
    estado: { variables: event.variables ?? {}, cambios: event.change ?? null },
    salida: (event.outputs ?? []).map(String),
    frase: String(event.scene?.body ?? event.message ?? ""),
    lineaCodigo: event.sourceLine ?? null,
    pregunta: null
  }));
}

export function validateSteps(steps) {
  if (!Array.isArray(steps)) return { valid: false, reason: "steps-not-array" };
  const ids = new Set();
  for (const step of steps) {
    if (!step || typeof step !== "object") return { valid: false, reason: "step-not-object" };
    if (typeof step.id !== "string" || !step.id || ids.has(step.id)) return { valid: false, reason: "invalid-or-duplicate-id" };
    ids.add(step.id);
    if (!(step.foco === null || typeof step.foco === "string")) return { valid: false, reason: "invalid-focus" };
    if (typeof step.globo !== "string" || typeof step.frase !== "string") return { valid: false, reason: "invalid-copy" };
    if (!step.escena || typeof step.escena.tipo !== "string" || !step.escena.datos) return { valid: false, reason: "invalid-scene" };
    if (!step.estado || typeof step.estado !== "object" || !Array.isArray(step.salida)) return { valid: false, reason: "invalid-state" };
  }
  return { valid: true, reason: null };
}
