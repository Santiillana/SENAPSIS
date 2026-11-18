import test from "node:test";
import assert from "node:assert/strict";
import { createSimulatorShell } from "../src/ui/simulator-shell.js";

const step = id => ({
  id,
  foco: null,
  globo: "",
  frase: "",
  escena: { tipo: "test", datos: {} },
  estado: {},
  salida: []
});

test("la carcasa navega una plantilla ficticia sin depender del tema", () => {
  const exercise = { title: "Prueba" };
  const trace = { markers: ["inicio", "fin"] };
  const template = { construirPasos: (receivedExercise, receivedTrace) => {
    assert.equal(receivedExercise, exercise);
    assert.equal(receivedTrace, trace);
    return [step("inicio"), step("fin")];
  } };
  const shell = createSimulatorShell(template, exercise, trace);

  assert.equal(shell.current.id, "inicio");
  assert.equal(shell.progress, 0);
  assert.equal(shell.next().id, "fin");
  assert.equal(shell.progress, 1);
  assert.equal(shell.previous().id, "inicio");
  assert.equal(shell.seek(8).id, "fin");
  assert.equal(shell.first().id, "inicio");
});

test("la carcasa rechaza plantillas sin pasos válidos", () => {
  assert.throws(() => createSimulatorShell({}, {}, {}), /construir sus pasos/);
  assert.throws(() => createSimulatorShell({ construirPasos: () => [] }, {}, {}), /al menos un paso/);
  assert.throws(() => createSimulatorShell({ construirPasos: () => [{ id: "incompleto" }] }, {}, {}), /pasos inválidos/);
});
