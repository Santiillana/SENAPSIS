import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";
import { adaptLegacyExercise, adaptMathExercise, adaptSourceExercise, validateExercise } from "../src/content/exercise-adapter.js";
import { exerciseConceptLabels } from "../src/ui/content-view.js";
import { sourceExercises } from "../src/content/source-exercises.js";
import { mathExercises } from "../src/math/exercises.js";

test("la capa adapta y valida los 45 ejercicios sin alterar sus oráculos",()=>{
  assert.equal(exercises.length,45);
  const adapted=exercises.map(item=>adaptLegacyExercise(item,exerciseConceptLabels(item),[22,23,24,28].includes(item.id)));
  assert.equal(adapted.length,45);
  assert.ok(adapted.every(validateExercise));
  assert.deepEqual(adapted.map(item=>item.id),exercises.map(item=>item.id));
  for(let index=0;index<exercises.length;index++){
    const cases=exercises[index].methods.flatMap(method=>method.tests??[]);
    assert.deepEqual(adapted[index].oraculo(),cases);
    assert.ok(adapted[index].preguntasGuia.length===3);
  }
  assert.deepEqual(adapted.filter(item=>item.esDeClase).map(item=>item.id),[22,23,24,28]);
});

test("el esquema común valida los bancos de fuentes y matemáticas sin tocar sus datos",()=>{
  const adapted=[...sourceExercises.map(adaptSourceExercise),...mathExercises.map(adaptMathExercise)];
  assert.equal(adapted.length,sourceExercises.length+mathExercises.length);
  assert.ok(adapted.every(validateExercise));
  assert.ok(adapted.some(item=>item.simulable===null));
  const broken={...adapted[0],solucion:{...adapted[0].solucion,pasos:"no es una lista"}};
  assert.equal(validateExercise(broken),false);
});
