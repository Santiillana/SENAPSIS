import test from "node:test";
import assert from "node:assert/strict";
import { readIntroPreference, rememberIntro, saveIntroPreference, shouldShowIntro } from "../src/ui/simulator-intro.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test("la pantalla previa se omite solo para ejercicios vistos o por preferencia", () => {
  const initial = { skip: false, seen: [] };
  assert.equal(shouldShowIntro(1, initial), true);
  const afterView = rememberIntro(1, initial);
  assert.equal(shouldShowIntro(1, afterView), false);
  assert.equal(shouldShowIntro(2, afterView), true);
  assert.equal(shouldShowIntro(2, rememberIntro(1, initial, true)), false);
});

test("la preferencia se persiste y normaliza datos dañados", () => {
  const storage = memoryStorage();
  saveIntroPreference({ skip: false, seen: [2, "2", 1] }, storage);
  assert.deepEqual(readIntroPreference(storage), { skip: false, seen: [2, 1] });
  storage.setItem("senapsis:v1:simulator-intro", "{bad json");
  assert.deepEqual(readIntroPreference(storage), { skip: false, seen: [] });
});
