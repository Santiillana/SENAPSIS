import { validateSteps } from "./flow-step-contract.js";

/** Navigation state shared by simulator templates. It has no topic or DOM knowledge. */
export function createSimulatorShell(template, exercise, trace) {
  if (!template || typeof template.construirPasos !== "function") {
    throw new TypeError("La plantilla del simulador debe construir sus pasos.");
  }
  const steps = template.construirPasos(exercise, trace);
  if (!Array.isArray(steps) || !steps.length) throw new TypeError("La plantilla debe producir al menos un paso.");
  const contract = validateSteps(steps);
  if (!contract.valid) throw new TypeError("La plantilla produjo pasos inválidos: " + contract.reason);

  let cursor = 0;
  const current = () => steps[cursor];
  return {
    steps,
    get index() { return cursor; },
    get length() { return steps.length; },
    get current() { return current(); },
    get progress() { return steps.length <= 1 ? 1 : cursor / (steps.length - 1); },
    next() { cursor = Math.min(steps.length - 1, cursor + 1); return current(); },
    previous() { cursor = Math.max(0, cursor - 1); return current(); },
    first() { cursor = 0; return current(); },
    last() { cursor = steps.length - 1; return current(); },
    seek(index) {
      if (!Number.isFinite(index)) throw new TypeError("El paso debe ser un número.");
      cursor = Math.max(0, Math.min(steps.length - 1, Math.trunc(index)));
      return current();
    }
  };
}
