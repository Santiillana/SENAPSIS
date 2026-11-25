import test from "node:test";
import assert from "node:assert/strict";
import { lessonRecipe, recipeFrame, recipeMoment, recipeSceneMarkup } from "../src/ui/kit/recipes.js";

test("las lecciones 01 a 17 tienen recetas visuales propias y completas",()=>{
  const ids=["algorithm","reading","terminals","input","process","output","variables","arithmetic","comparisons","decisions","nested-decisions","counters-accumulators","for","while","do-while","nested-loops","validation-sentinel"];
  const recipes=ids.map(id=>lessonRecipe(id));
  assert.equal(new Set(recipes.map(item=>item.id)).size,ids.length);
  for(const recipe of recipes){
    assert.ok(recipe.idea&&recipe.term&&recipe.cierre);
    assert.ok(recipe.moments.length>=3&&recipe.moments.length<=5);
    assert.ok(recipe.figures.length>=3);
    const svg=recipeSceneMarkup(recipe,0);
    assert.match(svg,/<svg/);
    assert.match(svg,/recipe-guide/);
    assert.match(svg,/recipe-order/);
    assert.doesNotMatch(svg,/<script|foreignObject/i);
    if(recipe.choices){assert.match(svg,/Sí ✓/);assert.match(svg,/No ✗/);}
    if(recipe.loopPartByMoment)assert.match(recipeSceneMarkup(recipe,0,2),/class="is-active"/);
    if(recipe.returnLink)assert.match(svg,/recipe-return/);
  }
});

test("el reproductor mapea los eventos del motor a momentos de receta en orden",()=>{
  const recipe=lessonRecipe("algorithm");
  assert.equal(recipeFrame(recipe,0,5),0);
  assert.equal(recipeFrame(recipe,4,5),recipe.figures.length-1);
  assert.equal(recipeMoment(recipe,0,5),recipe.moments[0]);
  assert.equal(recipeMoment(recipe,4,5),recipe.moments.at(-1));
});

test("los diagramas aplican marcadores semánticos, texto legible y leyenda contextual",()=>{
  const svg=recipeSceneMarkup(lessonRecipe("algorithm"),0);
  for(const role of ["structure","data","calculation","result","focus"]){
    assert.match(svg,new RegExp("recipe-role-"+role));
  }
  assert.match(svg,/Colores: Ahora: mira aquí; Trazo: estructura y camino; Dato: entra; Cálculo: se transforma; Resultado: sale/);
  assert.match(svg,/doble = n × 2/);
  assert.match(svg,/Mostrar<\/tspan><tspan[^>]*>doble/);
  assert.doesNotMatch(svg,/#(?:[\da-f]{3,8})\b|rgba?\(/i);
  const decision=recipeSceneMarkup(lessonRecipe("nested-decisions"),0);
  assert.match(decision,/¿Mayor de/);
  assert.match(decision,/edad\?/);
  assert.match(decision,/Sí ✓/);
  assert.match(decision,/No ✗/);
});
