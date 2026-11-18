import test from "node:test";
import assert from "node:assert/strict";
import { executePseudocode } from "../src/core/interpreter.js";
import { buildFlowSteps, validateSteps } from "../src/ui/flow-step-contract.js";

test("la traza de flujo se adapta al contrato sin perder datos del intérprete", () => {
  const execution = executePseudocode("leer n|x=n*2|si x>5|imp x|fin", [4]);
  const steps = buildFlowSteps(execution.events);
  assert.deepEqual(validateSteps(steps), { valid: true, reason: null });
  assert.equal(steps.length, execution.events.length);
  assert.deepEqual(steps.map(step => step.type), execution.events.map(event => event.type));
  assert.equal(steps.find(step => step.type === "input").estado.variables.n, 4);
  assert.equal(steps.find(step => step.type === "assignment").foco,
    String(execution.events.find(event => event.type === "assignment").nodeId));
  assert.equal(steps.at(-1).salida[0], "8");
  assert.equal(steps.at(-1).id, `flujo:${steps.length - 1}`);
});

test("el validador rechaza ids repetidos y pasos incompletos", () => {
  const valid = { id: "x", foco: null, globo: "", frase: "", escena: { tipo: "x", datos: {} }, estado: {}, salida: [] };
  assert.equal(validateSteps([valid, { ...valid }]).reason, "invalid-or-duplicate-id");
  assert.equal(validateSteps([{ ...valid, escena: null }]).reason, "invalid-scene");
  assert.equal(validateSteps(null).reason, "steps-not-array");
});
