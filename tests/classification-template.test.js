import test from "node:test";
import assert from "node:assert/strict";
import { createSimulatorShell } from "../src/ui/simulator-shell.js";
import { sourceScenarios } from "../src/content/source-scenarios.js";
import { classificationTemplate } from "../src/ui/templates/classification.js";
import { renderClassificationScene } from "../src/ui/scenes/classification.js";

test("cada escenario de fuentes produce pasos válidos en la carcasa común",()=>{
  for(const scenario of sourceScenarios){
    const shell=createSimulatorShell(classificationTemplate,scenario,scenario);
    assert.equal(shell.length,scenario.sources.length);
    assert.equal(shell.current.escena.tipo,"clasificacion");
    assert.equal(shell.current.escena.datos.source.id,scenario.sources[0].id);
    assert.ok(shell.current.frase.length>0);
    assert.ok(shell.last().estado.coveredAreas>=shell.first().estado.coveredAreas);
    assert.match(renderClassificationScene(shell.current.escena),/source-classification-scene/);
  }
});

test("la escena de clasificación escapa texto del catálogo",()=>{
  const scene={tipo:"clasificacion",datos:{source:{type:"P",title:"<script>alert(1)</script>",hops:1,contribution:"dato",limitation:"límite"},emitted:[]}};
  const markup=renderClassificationScene(scene);
  assert.ok(!markup.includes("<script>"));
  assert.ok(markup.includes("&lt;script&gt;"));
});
