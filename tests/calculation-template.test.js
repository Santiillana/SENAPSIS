import test from "node:test";
import assert from "node:assert/strict";
import { mathExercisesByTopic } from "../src/math/exercises.js";
import { createSimulatorShell } from "../src/ui/simulator-shell.js";
import { buildCalculationSteps, calculationTemplate } from "../src/ui/templates/calculation.js";
import { renderCalculationScene } from "../src/ui/scenes/calculation.js";

test("los ejercicios matemáticos no pendientes producen pasos válidos en la carcasa común",()=>{
  const kinds=new Set();
  for(const exercise of Object.values(mathExercisesByTopic).flat()){
    const domainSteps=buildCalculationSteps(exercise);
    if(exercise.pending){assert.deepEqual(domainSteps,[]);continue;}
    const shell=createSimulatorShell(calculationTemplate,exercise,domainSteps);
    assert.equal(shell.length,domainSteps.length);
    for(const step of shell.steps){
      assert.equal(step.escena.tipo,"calculo");
      assert.ok(step.frase.length>0);
      const markup=renderCalculationScene(step.escena);
      assert.match(markup,/math-player-(?:area|table|fraction|expression)/);
      kinds.add(step.escena.datos.step.kind);
    }
    assert.equal(shell.last().estado.paso,shell.length);
  }
  for(const kind of ["area","table","cross","fraction","tree","result","check"])assert.ok(kinds.has(kind),`falta cubrir ${kind}`);
});

test("la escena de cálculo escapa el contenido textual",()=>{
  const scene={tipo:"calculo",datos:{exercise:{topic:"enteros",expression:"<img src=x>",expectedText:"0"},step:{detail:"<script>",result:0,kind:"tree"}}};
  const markup=renderCalculationScene(scene);
  assert.ok(!markup.includes("<script>"));
  assert.ok(markup.includes("&lt;img"));
});
