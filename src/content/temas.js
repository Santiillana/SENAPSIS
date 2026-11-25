import { FICHA } from "./ficha.js";
import { lessons } from "./lessons.js";
import { exercises } from "./exercises.js";
import { mathLessonsByTopic } from "./math-lessons.js";
import { mathExercisesByTopic } from "../math/exercises.js";
import { sourceLessonsByTopic } from "./sources-lessons.js";
import { sourceExercises } from "./source-exercises.js";

export const competenciasAprende = FICHA.competencias
  .filter(item => item.enAprende && item.activa)
  .sort((a, b) => a.orden - b.orden)
  .map(item => ({ ...item, titulo: item.nombre, fuente: item }));

const leccionesDiagramas = lessons.map(item => item.id);
export const temas = [
  { id: "diagramas-flujo", competenciaId: "evaluar-requisitos", titulo: "Diagramas de flujo", icono: "↘", dificultad: 1, estado: "disponible", conceptos: ["figuras", "flujo", "entrada", "salida", "variables", "asignacion", "operaciones", "decisiones", "ciclos"], lecciones: leccionesDiagramas, ejercicios: exercises.map(item => item.id), simulador: { tipo: "flujo" } },
  { id: "fuentes-informacion", competenciaId: "establecer-requisitos", titulo: "Formas de recolectar información", icono: "⌕", dificultad: 1, estado: "disponible", nota: "Según el autor, las fronteras entre fuentes primarias, secundarias y terciarias pueden cambiar.", conceptos: [], lecciones: sourceLessonsByTopic, ejercicios: sourceExercises.map(item=>item.id), simulador: {tipo:"recoleccion-fuentes",escenarios:3} },
  ...["enteros", "racionales", "regla-de-tres"].map((id, index) => ({ id, competenciaId: "matematicas", titulo: ["Números enteros", "Números racionales", "Regla de tres"][index], icono: ["±", "½", "%"][index], dificultad: index + 1, estado: "disponible", conceptos: [], lecciones: mathLessonsByTopic[id], ejercicios: mathExercisesByTopic[id].map(item=>item.id), simulador: null }))
];

export function temaPorId(id) { return temas.find(item => item.id === id) ?? null; }
