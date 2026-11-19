import test from "node:test";
import assert from "node:assert/strict";
import { FICHA } from "../src/content/ficha.js";
import { competenciasAprende, temas } from "../src/content/temas.js";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const ids = ["establecer-requisitos", "evaluar-requisitos", "tics", "comunicacion", "matematicas"];

function valuesFor(section, theme) {
  const selector = `:root[data-section="${section}"][data-theme="${theme}"]`;
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `Falta el tema ${section}/${theme}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return Object.fromEntries([...css.slice(open + 1, close).matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map(([, key, value]) => [key, value]));
}

function luminance(hex) {
  const values = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255);
  const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test("el catálogo estable de competencias alimenta Aprende por tipo y orden", () => {
  assert.equal(new Set(FICHA.competencias.map(item => item.id)).size, FICHA.competencias.length);
  assert.ok(FICHA.competencias.every(item => item.id && item.nombre && item.tipo && Number.isInteger(item.orden) && typeof item.activa === "boolean" && item.forma && item.token));
  assert.deepEqual(competenciasAprende.map(item => item.id), ids);
  assert.deepEqual(competenciasAprende.map(item => item.tipo), ["principal", "principal", "transversal", "transversal", "transversal"]);
  assert.ok(competenciasAprende.every(item => item.forma && item.token));
  for (const topic of temas) assert.ok(ids.includes(topic.competenciaId), `${topic.id} usa un id de competencia desconocido`);
});

test("renombrar una competencia conserva las relaciones que usan su id", () => {
  const renamed = FICHA.competencias.map(item => item.id === "evaluar-requisitos" ? { ...item, nombre: "Nombre actualizado" } : item);
  const topic = temas.find(item => item.id === "diagramas-flujo");
  assert.equal(renamed.find(item => item.id === topic.competenciaId).nombre, "Nombre actualizado");
  assert.equal(topic.competenciaId, "evaluar-requisitos");
});

test("los cinco marcadores mantienen contraste AA sobre fondo y tarjeta en ambos temas", () => {
  for (const theme of ["light", "dark"]) {
    const colors = valuesFor("aprende", theme);
    for (let index = 1; index <= ids.length; index += 1) {
      const marker = colors[`--comp-${index}`];
      assert.ok(marker, `Falta marcador ${index} en ${theme}`);
      for (const background of ["--canvas", "--surface"]) {
        assert.ok(contrast(marker, colors[background]) >= 4.5, `${theme}: --comp-${index} no alcanza AA sobre ${background}`);
      }
    }
  }
});

test("los tokens por id derivan color, tinte, borde y texto del marcador base", () => {
  for (const id of new Set(FICHA.competencias.map(item => item.token))) {
    for (const part of ["solid", "tint", "border", "text"]) {
      assert.match(css, new RegExp(`--competence-${id}-${part}:`), `Falta token ${id}/${part}`);
    }
  }
});
