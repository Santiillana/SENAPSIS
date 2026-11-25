import test from "node:test";
import assert from "node:assert/strict";
import { readLearnRoute, writeLearnRoute } from "../src/ui/learn-route.js";

test("lee solo rutas reconocidas y conserva competencia, tema, pestaña e ítem", () => {
  assert.equal(readLearnRoute("?tema=diagramas-flujo"), null);
  assert.equal(readLearnRoute("?pestana=otra"), null);
  assert.deepEqual(readLearnRoute("?pestana=lecciones&competencia=evaluar-requisitos&tema=diagramas-flujo&leccion=algorithm"), {
    view: "lecciones", competenceId: "evaluar-requisitos", topicId: "diagramas-flujo", lessonId: "algorithm", exerciseId: null, difficulties: [], concepts: []
  });
  assert.equal(readLearnRoute("?pestana=ejercicios&ejercicio=flujo%3A12").exerciseId, "flujo:12");
  assert.deepEqual(readLearnRoute("?pestana=ejercicios&dificultad=1%2C3&concepto=entrada%2Cciclo-para").difficulties, ["1", "3"]);
  assert.deepEqual(readLearnRoute("?pestana=ejercicios&dificultad=1%2C3&concepto=entrada%2Cciclo-para").concepts, ["entrada", "ciclo-para"]);
});

test("escribe rutas compartibles sin borrar otros parámetros ni el fragmento", () => {
  const location = { href: "https://senapsis.test/app?curso=adso#contenido", pathname: "/app", search: "?curso=adso", hash: "#contenido" };
  const calls = [];
  const record = (kind, args) => {
    calls.push([kind, ...args]);
    const next = new URL(args[2], location.href);
    Object.assign(location, { href: next.href, pathname: next.pathname, search: next.search, hash: next.hash });
  };
  const history = { pushState: (...args) => record("push", args), replaceState: (...args) => record("replace", args) };
  assert.equal(writeLearnRoute(history, location, { view: "lecciones", competenceId: "evaluar-requisitos", topicId: "diagramas-flujo", lessonId: "algorithm" }), true);
  assert.equal(calls[0][3], "/app?curso=adso&pestana=lecciones&competencia=evaluar-requisitos&tema=diagramas-flujo&leccion=algorithm#contenido");
  assert.equal(writeLearnRoute(history, location, { view: "inicio" }, { replace: true }), true);
  assert.equal(calls[1][0], "replace");
  assert.equal(calls[1][3], "/app?curso=adso#contenido");
  assert.equal(writeLearnRoute(history, location, { view: "ejercicios", competenceId: "evaluar-requisitos", topicId: "diagramas-flujo", exerciseId: "flujo:2", difficulties: ["1", "3"], concepts: ["entrada"] }), true);
  assert.match(calls[2][3], /dificultad=1%2C3&concepto=entrada/);
});
