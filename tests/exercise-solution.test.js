import test from "node:test";
import assert from "node:assert/strict";
import { availableExerciseSolutionSections } from "../src/content/exercise-solution.js";

test("la hoja de solución devuelve solo los apartados que tienen contenido", () => {
  const sections = availableExerciseSolutionSections({
    queSePide: "Calcular el total.", porQue: "Se suman los valores.", paraQue: "",
    pasos: ["Leer", "Sumar", "Mostrar"], cuandoSeUsa: "   "
  });
  assert.deepEqual(sections.map(item => item.key), ["queSePide", "porQue", "pasos"]);
  assert.deepEqual(sections[2].content, ["Leer", "Sumar", "Mostrar"]);
  assert.deepEqual(availableExerciseSolutionSections({}), []);
});
