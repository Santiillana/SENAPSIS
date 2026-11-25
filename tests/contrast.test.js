import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const aprendeStyles = ["components.css", "content.css", "learn-catalog.css", "lesson-reading.css", "sources.css", "kit.css"];

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

function aprendeBlock(theme) {
  const marker = theme === "dark" ? "--learn-page:#0D1524" : "--learn-page:#F7F1E3";
  const token = css.indexOf(marker);
  const start = token < 0 ? -1 : css.lastIndexOf("{", token);
  assert.notEqual(start, -1, "Falta la paleta Aprende/" + theme);
  const open = start;
  const close = css.indexOf("}", open);
  assert.ok(close > open, "Bloque CSS incompleto para Aprende/" + theme);
  return Object.fromEntries(
    [...css.slice(open + 1, close).matchAll(/(--(?:learn|explain)-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)]
      .map(([, name, value]) => [name, value.toUpperCase()])
  );
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

test("la paleta propia de Aprende cumple contraste AA y contraste gráfico", () => {
  for (const theme of ["light", "dark"]) {
    const values = aprendeBlock(theme);
    for (const token of ["--learn-page", "--learn-surface", "--learn-ink", "--learn-muted", "--learn-action", "--learn-action-text", "--learn-line-strong", "--learn-alert", "--learn-accent", "--learn-accent-text"]) {
      assert.ok(values[token], theme + " no define " + token);
    }
    for (const background of ["--learn-page", "--learn-surface"]) {
      assert.ok(contrast(values["--learn-ink"], values[background]) >= 4.5, theme + ": texto principal insuficiente sobre " + background);
      assert.ok(contrast(values["--learn-muted"], values[background]) >= 4.5, theme + ": texto secundario insuficiente sobre " + background);
      assert.ok(contrast(values["--learn-line-strong"], values[background]) >= 3, theme + ": borde interactivo insuficiente sobre " + background);
      assert.ok(contrast(values["--learn-alert"], values[background]) >= 4.5, theme + ": alerta insuficiente sobre " + background);
    }
    assert.ok(contrast(values["--learn-action-text"], values["--learn-action"]) >= 4.5, theme + ": botón principal insuficiente");
    assert.ok(contrast(values["--learn-accent-text"], values["--learn-accent"]) >= 4.5, theme + ": texto sobre mostaza insuficiente");
  }
  const dark = aprendeBlock("dark");
  for (const token of ["--learn-link", "--learn-tab", "--learn-tab-text", "--learn-tab-border"]) assert.ok(dark[token], "dark no define " + token);
  assert.ok(contrast(dark["--learn-link"], dark["--learn-surface"]) >= 4.5, "El enlace oscuro no alcanza 4.5:1");
  assert.ok(contrast(dark["--learn-tab-text"], dark["--learn-tab"]) >= 4.5, "La pestaña oscura no alcanza 4.5:1");
  assert.ok(contrast(dark["--learn-tab-border"], dark["--learn-tab"]) >= 3, "El borde de pestaña oscuro no alcanza 3:1");
  const light = aprendeBlock("light");
  assert.ok(contrast(light["--learn-action-text"], light["--learn-brand"]) >= 4.5, "La pestaña Aprende clara no alcanza 4.5:1");
});

test("los colores de los estilos de Aprende están centralizados en tokens", async () => {
  for (const file of aprendeStyles) {
    const source = await readFile(new URL("../src/styles/" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b|rgba?\(/i, file + " conserva colores fijos");
  }
});

test("los diez marcadores de explicación mantienen contraste en ambos modos", () => {
  const roles = ["focus", "correct", "error", "structure", "data", "calculation", "result", "repeat", "variable", "counter"];
  for (const theme of ["light", "dark"]) {
    const values = aprendeBlock(theme);
    for (const role of roles) {
      const fill = values["--explain-" + role + "-fill"];
      const text = values["--explain-" + role + "-on"];
      const ink = values["--explain-" + role + "-ink"];
      assert.ok(fill && text && ink, theme + " falta token de " + role);
      assert.ok(contrast(text, fill) >= 4.5, theme + ": texto insuficiente para " + role);
      const edgeContrast = role === "structure"
        ? contrast(fill, values["--learn-surface"])
        : contrast(values["--explain-outline"], fill);
      assert.ok(edgeContrast >= 3, theme + ": borde/gráfico insuficiente para " + role);
    }
  }
});
