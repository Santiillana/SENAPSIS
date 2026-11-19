import { readFile, writeFile } from "node:fs/promises";
import { exercises } from "../src/content/exercises.js";
import { sourceExercises } from "../src/content/source-exercises.js";
import { mathExercises } from "../src/math/exercises.js";
import { adaptLegacyExercise, adaptMathExercise, adaptSourceExercise } from "../src/content/exercise-adapter.js";
import { exerciseConceptLabels } from "../src/ui/content-view.js";

const quote = value => '"' + String(value ?? "").replaceAll('"', '""') + '"';
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
const solutionGaps = solution => Object.entries(solution).filter(([, value]) =>
  Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim()).map(([key]) => key);
const flow = exercises.map(item => {
  const adapted = adaptLegacyExercise(item, exerciseConceptLabels(item), [22, 23, 24, 28].includes(item.id));
  return { bank: "flujo", id: item.id, tema: adapted.temaId, competencia: adapted.competenciaId,
    level: item.level, type: "algoritmo", statement: item.statement, concepts: adapted.conceptos,
    hasSolution: item.methods.length > 0, steps: item.methods.reduce((n, method) => n + method.pseudocode.split("|").filter(Boolean).length, 0),
    missingSections: solutionGaps(adapted.solucion), classExercise: adapted.esDeClase };
});
const sources = sourceExercises.map(item => {
  const adapted = adaptSourceExercise(item);
  return { bank: "fuentes", id: item.id, tema: adapted.temaId, competencia: adapted.competenciaId,
    level: item.level, type: "clasificacion", statement: item.prompt, concepts: adapted.conceptos,
    hasSolution: Number.isInteger(item.answer) && Boolean(item.why), steps: 1,
    missingSections: solutionGaps(adapted.solucion), classExercise: false };
});
const math = mathExercises.map(item => {
  const adapted = adaptMathExercise(item);
  return { bank: "matematicas", id: item.id, tema: adapted.temaId, competencia: adapted.competenciaId,
    level: item.difficulty, type: adapted.tipo, statement: item.statement, concepts: adapted.conceptos,
    hasSolution: !item.pending && item.expected !== null && item.expected !== undefined,
    steps: adapted.solucion.pasos.length, missingSections: solutionGaps(adapted.solucion), classExercise: Boolean(item.classExercise) };
});
const records = [...flow, ...sources, ...math];
const seen = new Set();
for (const item of records) {
  const key = item.bank + ":" + normalize(item.statement);
  item.duplicate = seen.has(key);
  seen.add(key);
  const flags = [];
  if (!item.hasSolution) flags.push("sin-solucion");
  if (!item.concepts.length) flags.push("sin-conceptos");
  item.flags = flags;
}
for (const bank of ["flujo", "fuentes", "matematicas"]) {
  const topics = new Map();
  for (const item of records.filter(row => row.bank === bank)) {
    if (!topics.has(item.tema)) topics.set(item.tema, []);
    topics.get(item.tema).push(item);
  }
  for (const ordered of topics.values()) {
    for (let index = 1; index < ordered.length; index++) {
      const levels = { basic: 1, intermediate: 2, advanced: 3, expert: 4 };
      const previous = levels[ordered[index - 1].level] ?? Number(ordered[index - 1].level) ?? 0;
      const current = levels[ordered[index].level] ?? Number(ordered[index].level) ?? 0;
      if (current < previous) ordered[index].flags.push("nivel-desciende-frente-al-anterior");
    }
  }
}

const columns = ["banco", "id", "tema", "competencia", "nivel", "tipo", "enunciado", "tiene_solucion", "pasos", "conceptos", "duplicado", "banderas", "apartados_fase_5_pendientes"];
const rows = records.map(item => [item.bank, item.id, item.tema, item.competencia, item.level, item.type,
  item.statement, item.hasSolution ? "sí" : "no", item.steps, item.concepts.join("; "), item.duplicate ? "sí" : "no", item.flags.join("; "), item.missingSections.join("; ")]);
await writeFile(new URL("../docs/auditoria-ejercicios.csv", import.meta.url),
  [columns.map(quote).join(","), ...rows.map(row => row.map(quote).join(","))].join("\n") + "\n");

const referenceHtml = await readFile(new URL("../docs/referencia-simulador/diagramas_de_flujo_original.html", import.meta.url), "utf8");
const referenceItems = referenceHtml.match(/const R=\[([^\]]+)\]/)?.[1].split(",").length ?? 0;

console.log(JSON.stringify({ flow: flow.length, source: sources.length, math: math.length, total: records.length,
  flowSimulatorSelector: exercises.length, referenceSimulator: referenceItems, sourceScenarios: new Set(sourceExercises.map(item => item.scenario)).size,
  mathByTopic: Object.fromEntries(["enteros", "racionales", "regla-de-tres"].map(topic => [topic, math.filter(item => item.tema === topic).length])),
  flagged: records.filter(item => item.flags.length).length,
  pendingSolutionSections: records.filter(item => item.missingSections.length).length,
  missingSolutionSectionCounts: Object.fromEntries(["queSePide", "porQue", "paraQue", "pasos", "cuandoSeUsa"].map(key => [key, records.filter(item => item.missingSections.includes(key)).length])) }, null, 2));
