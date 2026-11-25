import test from "node:test";
import assert from "node:assert/strict";
import { createLearningLinks } from "../src/content/learning-links.js";

test("relaciona lecciones y ejercicios por conceptos compartidos en ambos sentidos",()=>{
  const lessons=[{id:"entrada",concepts:["entrada"]},{id:"ciclos",concepts:["ciclo"]}];
  const exercises=[{id:"E-1",concepts:["entrada"]},{id:"E-2",concepts:["ciclo"]},{id:"E-3",concepts:["sin-leccion"]}];
  const links=createLearningLinks(lessons,exercises,item=>item.concepts,item=>item.concepts);
  assert.deepEqual(links.exercisesByLesson.get("entrada").map(item=>item.id),["E-1"]);
  assert.deepEqual(links.lessonsByExercise.get("E-2").map(item=>item.id),["ciclos"]);
  assert.deepEqual(links.uncovered.map(item=>item.id),["E-3"]);
  for(const [,related] of links.exercisesByLesson)for(const exercise of related)assert.ok(exercises.some(item=>item.id===exercise.id));
  for(const [,related] of links.lessonsByExercise)for(const lesson of related)assert.ok(lessons.some(item=>item.id===lesson.id));
});
