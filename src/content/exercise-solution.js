const sectionLabels = Object.freeze({
  queSePide: "Qué se pide",
  porQue: "Por qué se resuelve así",
  paraQue: "Para qué sirve",
  pasos: "Solución paso a paso",
  cuandoSeUsa: "Cuándo se usa"
});

export function availableExerciseSolutionSections(solution = {}) {
  return Object.entries(sectionLabels).flatMap(([key, title]) => {
    const content = solution[key];
    const available = Array.isArray(content) ? content.length > 0 : typeof content === "string" && content.trim().length > 0;
    return available ? [{ key, title, content }] : [];
  });
}
