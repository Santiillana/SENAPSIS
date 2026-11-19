import test from "node:test";
import assert from "node:assert/strict";
import { FICHA } from "../src/content/ficha.js";
import { parseFichaPayload, validateFichaPayload } from "../worker/validation.js";

test("el manifiesto de Mi ficha satisface el esquema de publicación",()=>{
  assert.deepEqual(validateFichaPayload(FICHA),[]);
  assert.deepEqual(parseFichaPayload(JSON.stringify(FICHA)).errors,[]);
});
test("la API rechaza campos no permitidos, IDs duplicados y enlaces sin HTTPS",()=>{
  const extra=structuredClone(FICHA);extra.scope_id="otro";
  assert.ok(validateFichaPayload(extra).some(error=>error.includes("Campo no permitido")));
  const duplicate=structuredClone(FICHA);duplicate.competencias.push({...duplicate.competencias[0]});
  assert.ok(validateFichaPayload(duplicate).some(error=>error.includes("duplicado")));
  const insecure=structuredClone(FICHA);insecure.accesos[0].url="http://example.edu";
  assert.ok(validateFichaPayload(insecure).some(error=>error.includes("HTTPS")));
});
test("la API rechaza fechas incoherentes y JSON mayor a 500 KiB",()=>{
  const invalid=structuredClone(FICHA);invalid.clases[0].fecha="ayer";
  assert.ok(validateFichaPayload(invalid).some(error=>error.includes("fecha válida")));
  assert.ok(parseFichaPayload(" ".repeat(512_001)).errors.some(error=>error.includes("500 KiB")));
});

test("la API valida horario y vigencia del horario semanal",()=>{
  const invalid=structuredClone(FICHA);invalid.horario[0]={...invalid.horario[0],inicio:"20:00",fin:"09:00",vigenteDesde:"2026-12-01",vigenteHasta:"2026-11-30"};
  const errors=validateFichaPayload(invalid);
  assert.ok(errors.some(error=>error.includes("fin posterior al inicio")));
  assert.ok(errors.some(error=>error.includes("anterior a vigenteDesde")));
});
