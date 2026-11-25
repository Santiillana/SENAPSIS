import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/content/lessons.js";
import { rutas } from "../src/content/rutas.js";
import { exercises, validateCatalog } from "../src/content/exercises.js";
import { temas, competenciasAprende } from "../src/content/temas.js";
import { conceptos, conceptoPorEtiqueta, etiquetasConcepto } from "../src/content/conceptos.js";
import { normalizeLearnProgress, currentStreak, calculateLessonProgress, setLessonCompleted } from "../src/content/learn-progress.js";
import { exerciseConceptLabels } from "../src/ui/content-view.js";
import { FICHA } from "../src/content/ficha.js";

test("existen las 17 lecciones progresivas del temario oficial",()=>{
  assert.equal(lessons.length,17);
  for(const lesson of lessons){
    assert.ok(lesson.id && lesson.title && lesson.objective);
    assert.ok(lesson.intuitive && lesson.technical);
    assert.ok(lesson.visual?.steps?.length>=3);
    assert.ok(lesson.example?.code && lesson.example?.explanation);
    assert.ok(lesson.manipulation?.steps?.length>=2);
    assert.equal(lesson.check?.options?.length,3);
    assert.ok(Number.isInteger(lesson.check.answer));
  }
});

test("las 17 lecciones indican cuándo se usan y contienen un ejemplo resuelto en pasos",()=>{
  assert.equal(lessons.length,17);
  const ids=new Set();
  for(const lesson of lessons){
    assert.equal(ids.has(lesson.id),false,"ID repetido: "+lesson.id);
    ids.add(lesson.id);
    assert.ok(lesson.whenToUse?.length>20,lesson.id+" debe indicar cuándo se utiliza");
    assert.ok(Array.isArray(lesson.example?.steps)&&lesson.example.steps.length>=3,lesson.id+" debe tener al menos tres pasos resueltos");
    assert.ok(lesson.visual?.steps?.length>=3,lesson.id+" debe conservar secuencia visual");
    assert.ok(lesson.commonError?.length>10,lesson.id+" debe explicar un error común");
    assert.ok(lesson.check?.question&&lesson.check.options.length===3,lesson.id+" debe incluir una comprobación breve");
  }
});

test("las 17 lecciones aparecen exactamente una vez en los cuatro bloques de la ruta",()=>{
  const routedIds=rutas.flatMap(route=>route.ids);
  const lessonIds=lessons.map(lesson=>lesson.id);
  assert.equal(rutas.length,4);
  assert.deepEqual(rutas.map(route=>route.title),[
    "01 · Fundamentos","02 · Datos y operaciones","03 · Decisiones","04 · Ciclos"
  ]);
  assert.equal(routedIds.length,17);
  assert.equal(new Set(routedIds).size,17);
  assert.deepEqual([...routedIds].sort(),[...lessonIds].sort());
  for(const route of rutas)assert.ok(route.id&&route.description&&route.ids.length>0);
});

test("el catálogo tiene 45 ejercicios y distribución 20/10/10/5",()=>{
  assert.equal(exercises.length,45);
  assert.equal(exercises.filter(x=>x.level==="basic").length,20);
  assert.equal(exercises.filter(x=>x.level==="intermediate").length,10);
  assert.equal(exercises.filter(x=>x.level==="advanced").length,10);
  assert.equal(exercises.filter(x=>x.level==="expert").length,5);
  assert.deepEqual(validateCatalog(),[]);
});


test("el catálogo conserva los 45 identificadores sin saltos ni duplicados",()=>{
  assert.deepEqual(exercises.map(item=>item.id),Array.from({length:45},(_,index)=>index+1));
});

test("las fichas de los ejercicios separan entradas, salidas, restricciones y proceso",()=>{
  for(const item of exercises){
    assert.ok(item.statement.length>20);
    assert.ok(item.purpose.length>10);
    assert.ok(item.concepts.length>0);
    assert.ok(item.inputs.length>=0);
    assert.ok(item.outputs.length>0);
    assert.ok(item.constraints.length>0);
    assert.ok(item.analysis.length>0);
    assert.ok(item.errors.length>=1);
  }
});

test("cada método incluye pseudocódigo y casos normales o límite",()=>{
  for(const item of exercises){
    for(const method of item.methods){
      assert.ok(typeof method.pseudocode==="string" && (method.pseudocode.includes("|") || method.pseudocode===""));
      assert.ok(method.tests.length>=1);
      for(const scenario of method.tests){
        assert.ok(Array.isArray(scenario.input));
        assert.ok(Array.isArray(scenario.expected));
        assert.ok(scenario.name.length>0);
      }
    }
  }
});

test("los contenidos no convierten conceptos externos en objetivos didácticos",()=>{
  const source=JSON.stringify({lessons,exercises}).toLowerCase();
  for(const forbidden of ["recursividad","búsqueda binaria","ordenamiento","programación orientada a objetos"]){
    assert.equal(source.includes(forbidden),false,forbidden+" no pertenece al alcance aprobado");
  }
});

test("la secuencia Fibonacci y las correcciones de máximos y factorial están documentadas",()=>{
  const fib=exercises.find(x=>x.id===23);
  assert.deepEqual(fib.methods[0].tests[0].expected,[0,1,1,2,3,5,8,13,21,34]);
  assert.ok(exercises.find(x=>x.id===24).constraints.some(x=>x.toLowerCase().includes("negativos")));
  assert.ok(exercises.find(x=>x.id===21).constraints.some(x=>x.includes("0!")));
});

test("el catálogo de temas comparte competencias y conserva el mapa de 17 lecciones",()=>{
  assert.deepEqual(competenciasAprende.map(item=>item.id),["establecer-requisitos","evaluar-requisitos","tics","comunicacion","matematicas"]);
  assert.ok(competenciasAprende.every(item=>FICHA.competencias.some(source=>source.id===item.id)));
  assert.equal(temas.find(item=>item.id==="diagramas-flujo").lecciones.length,17);
  const sources=temas.find(item=>item.id==="fuentes-informacion");
  assert.equal(sources.estado,"disponible");
  assert.equal(sources.lecciones.length,8);
  assert.equal(sources.ejercicios.length,24);
  assert.equal(sources.simulador.escenarios,3);
  assert.match(sources.nota,/fronteras.*pueden cambiar/i);
  assert.deepEqual(temas.filter(item=>item.estado==="proximamente").map(item=>item.id),[]);
  for(const id of ["enteros","racionales","regla-de-tres"]){
    const topic=temas.find(item=>item.id===id);
    assert.equal(topic.estado,"disponible");
    assert.equal(topic.lecciones.length,5);
    assert.ok(topic.ejercicios.length>=9);
  }
});

test("cada etiqueta de conceptos encontrada en los ejercicios tiene un identificador",()=>{
  for(const exercise of exercises){
    for(const label of exerciseConceptLabels(exercise)){
      assert.ok(etiquetasConcepto[label],"Falta el mapa para "+label);
      assert.ok(conceptoPorEtiqueta(label),"Falta el concepto para "+label);
    }
  }
  assert.ok(conceptos.length>0);
});

test("la migración aditiva de senapsis:v2:learn conserva el progreso previo",()=>{
  const old={version:2,completed:["algorithm","for","not-a-lesson"],current:"for",screen:3};
  const migrated=normalizeLearnProgress(old,lessons.map(item=>item.id),temas.map(item=>item.id));
  assert.deepEqual(migrated.completed,["algorithm","for"]);
  assert.equal(migrated.current,"for");
  assert.equal(migrated.screen,3);
  const next=normalizeLearnProgress({...migrated,theme:"diagramas-flujo",tab:"ejercicios",activityDays:["2026-11-16"]},lessons.map(item=>item.id),temas.map(item=>item.id));
  assert.equal(next.theme,"diagramas-flujo");
  assert.equal(next.tab,undefined);
  assert.deepEqual(next.activityDays,["2026-11-16"]);
});

test("la racha cuenta días consecutivos y mantiene el día anterior",()=>{
  assert.equal(currentStreak(["2026-11-15","2026-11-16"],"2026-11-17"),2);
  assert.equal(currentStreak(["2026-11-14","2026-11-15"],"2026-11-17"),0);
});

test("el progreso de Aprende se calcula con lecciones completas, sin duplicados",()=>{
  assert.deepEqual(calculateLessonProgress(["a","b"],["a"]),{completed:1,total:2,percentage:50});
  assert.deepEqual(calculateLessonProgress(["a","b"],["a","a","fuera"]),{completed:1,total:2,percentage:50});
  assert.deepEqual(calculateLessonProgress([],[]),{completed:0,total:0,percentage:0});
  assert.deepEqual(calculateLessonProgress(["a","b"],["a","b"]),{completed:2,total:2,percentage:100});
});

test("el marcado manual de lecciones agrega y quita IDs sin mutar el estado anterior",()=>{
  const before=["a"];
  const completed=setLessonCompleted(before,"b",true);
  assert.deepEqual(completed,["a","b"]);
  assert.deepEqual(setLessonCompleted(completed,"b",false),["a"]);
  assert.deepEqual(before,["a"]);
});
