import { conceptoPorEtiqueta } from "./conceptos.js";

const levelOrder = Object.freeze({ basic: 1, intermediate: 2, advanced: 3, expert: 4 });

export function adaptLegacyExercise(exercise, labels, isClassExercise = false) {
  const conceptIds = [...new Set(labels.map(label => conceptoPorEtiqueta(label)?.id).filter(Boolean))];
  const steps = exercise.methods?.flatMap(method => method.pseudocode.split("|").filter(Boolean)) ?? [];
  return {
    id: exercise.id,
    temaId: "diagramas-flujo",
    competenciaId: "evaluar-requisitos",
    titulo: exercise.title,
    dificultad: levelOrder[exercise.level] ?? 0,
    nivel: levelOrder[exercise.level] ?? 0,
    tipo: "algoritmo",
    conceptos: conceptIds,
    enunciado: exercise.statement,
    datos: exercise.inputs,
    solucion: {
      queSePide: exercise.outputs?.join(" ") ?? "",
      porQue: exercise.analysis ?? "",
      paraQue: exercise.purpose ?? "",
      pasos: steps,
      cuandoSeUsa: ""
    },
    simulable: { plantilla: "flujo", ejercicioId: exercise.id },
    esDeClase: isClassExercise,
    preguntasGuia: ["¿Qué entra y qué se imprime?", "¿Qué se calcula y en qué orden?", "¿Algo se decide o se repite?"],
    oraculo: () => exercise.methods.flatMap(method => method.tests ?? [])
  };
}

export function adaptSourceExercise(item) {
  return {
    id: item.id, temaId: "fuentes-informacion", competenciaId: "establecer-requisitos",
    titulo: item.title, dificultad: item.level, nivel: item.level, tipo: "clasificacion",
    conceptos: [], enunciado: item.prompt, datos: item.options,
    solucion: { queSePide: item.options[item.answer] ?? "", porQue: item.why, paraQue: "", pasos: [], cuandoSeUsa: "" },
    simulable: { plantilla: "clasificacion", ejercicioId: item.scenario },
    esDeClase: false, preguntasGuia: [], oraculo: () => item.answer
  };
}

export function adaptMathExercise(item) {
  const isRule = item.topic === "regla-de-tres";
  const steps = item.solution?.map(step => step.explanation ?? step.expression ?? String(step)) ?? [];
  return {
    id: item.id, temaId: item.topic, competenciaId: "matematicas", titulo: item.title,
    dificultad: item.difficulty, nivel: item.difficulty, tipo: isRule ? "proporcionalidad" : "calculo",
    conceptos: [], enunciado: item.statement,
    datos: item.expression ? [item.expression] : isRule ? [item.rule.a, item.rule.b, item.rule.c] : [],
    solucion: {
      queSePide: item.expectedText ?? "",
      porQue: item.verification ?? "",
      paraQue: "",
      pasos: steps,
      cuandoSeUsa: ""
    },
    simulable: item.pending ? null : { plantilla: "calculo", ejercicioId: item.id },
    esDeClase: Boolean(item.classExercise), preguntasGuia: [],
    oraculo: () => item.expected
  };
}

export function validateExercise(exercise) {
  return Boolean(exercise && (Number.isInteger(exercise.id) || typeof exercise.id === "string" && exercise.id.length > 0) && exercise.temaId && exercise.titulo &&
    exercise.competenciaId && exercise.dificultad >= 1 && exercise.dificultad <= 4 &&
    exercise.nivel === exercise.dificultad && typeof exercise.tipo === "string" &&
    Array.isArray(exercise.conceptos) && exercise.conceptos.every(item => typeof item === "string") &&
    typeof exercise.enunciado === "string" && Array.isArray(exercise.datos) &&
    exercise.solucion && ["queSePide", "porQue", "paraQue", "pasos", "cuandoSeUsa"].every(key =>
      key === "pasos" ? Array.isArray(exercise.solucion[key]) : typeof exercise.solucion[key] === "string") &&
    (exercise.simulable === null || (exercise.simulable && typeof exercise.simulable.plantilla === "string")) &&
    typeof exercise.esDeClase === "boolean" && Array.isArray(exercise.preguntasGuia) &&
    typeof exercise.oraculo === "function");
}
