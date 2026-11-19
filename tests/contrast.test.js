import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

function blockFor(section, theme) {
  const selector = ":root[data-section=\"" + section + "\"][data-theme=\"" + theme + "\"]";
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, "Falta la paleta " + section + "/" + theme);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  assert.ok(open > start && close > open, "Bloque CSS incompleto: " + selector);
  return Object.fromEntries(
    [...css.slice(open + 1, close).matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)]
      .map(([, name, value]) => [name, value.toUpperCase()])
  );
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255);
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const combinations = [
  ["aprende", "dark"],
  ["aprende", "light"],
  ["ficha", "dark"],
  ["ficha", "light"]
];

test("las cuatro combinaciones de sección y tema mantienen contraste WCAG AA", () => {
  for (const [section, theme] of combinations) {
    const values = blockFor(section, theme);
    for (const token of ["--bg", "--surface", "--text", "--accent", "--on-accent", "--accent-text"]) {
      assert.ok(values[token], section + "/" + theme + " no define " + token);
    }
    for (const background of ["--bg", "--surface"]) {
      assert.ok(
        contrast(values["--text"], values[background]) >= 4.5,
        section + "/" + theme + ": --text no alcanza 4.5:1 sobre " + background
      );
      assert.ok(
        contrast(values["--accent-text"], values[background]) >= 4.5,
        section + "/" + theme + ": --accent-text no alcanza 4.5:1 sobre " + background
      );
    }
    assert.ok(
      contrast(values["--on-accent"], values["--accent"]) >= 4.5,
      section + "/" + theme + ": --on-accent no alcanza 4.5:1 sobre --accent"
    );
  }
});

test("los cinco colores de competencia son distintos entre sí y de los estados", () => {
  for (const [section, theme] of combinations) {
    const values = blockFor(section, theme);
    const competencies = Array.from({ length: 5 }, (_, index) => values["--comp-" + (index + 1)]);
    const statuses = [
      "--status-pending", "--status-progress", "--status-submitted",
      "--status-correction", "--status-approved", "--status-overdue"
    ].map(token => values[token]);
    assert.ok(competencies.every(Boolean), section + "/" + theme + " debe definir cinco competencias");
    assert.equal(new Set(competencies).size, 5, section + "/" + theme + " repite colores de competencia");
    for (const color of competencies) {
      assert.ok(!statuses.includes(color), section + "/" + theme + " reutiliza un color de estado");
    }
  }
});

test("todos los estados visibles mantienen contraste sobre fondo y superficie", () => {
  for (const [section, theme] of combinations) {
    const values = blockFor(section, theme);
    for (const token of [
      "--status-pending", "--status-progress", "--status-submitted",
      "--status-correction", "--status-approved", "--status-overdue"
    ]) {
      assert.ok(values[token], section + "/" + theme + " no define " + token);
      for (const background of ["--bg", "--surface"]) {
        assert.ok(
          contrast(values[token], values[background]) >= 4.5,
          section + "/" + theme + ": " + token + " no alcanza 4.5:1 sobre " + background
        );
      }
    }
  }
});
