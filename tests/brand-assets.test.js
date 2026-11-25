import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url));

test("la marca SENAPSIS declara título, metadatos y favicon en la app y administración", async () => {
  const [app, admin, navigation] = await Promise.all([read("../index.html"), read("../administrar.html"), read("../src/ui/navigation.js")]);
  const appHtml = app.toString("utf8"), adminHtml = admin.toString("utf8");
  assert.match(appHtml, /<title>SENAPSIS — plataforma colaborativa para fichas de formación<\/title>/);
  assert.match(appHtml, /name="description" content="SENAPSIS reúne la información de tu ficha de formación/);
  assert.match(appHtml, /FICHA DE FORMACIÓN · ADSO/);
  assert.match(appHtml, /<h1 id="home-title">La información de tu ficha, en un solo lugar\.<\/h1>/);
  assert.match(appHtml, /Repasa las competencias de tu ficha con lecciones y ejercicios\./);
  assert.match(appHtml, /name="application-name" content="SENAPSIS"/);
  assert.match(appHtml, /property="og:site_name" content="SENAPSIS"/);
  assert.match(adminHtml, /<title>Administrar · SENAPSIS<\/title>/);
  assert.match(navigation.toString("utf8"), /document\.title = meta\.title \+ " · SENAPSIS"/);
  for (const html of [appHtml, adminHtml]) {
    assert.match(html, /href="\.\/src\/assets\/senapsis-favicon\.png"/);
  }
  await access(new URL("../src/assets/senapsis-favicon.png", import.meta.url));
});

test("el splash cambia a la variante marfil del wordmark y el fondo oscuro", async () => {
  const [app, css, light, dark, taglineDark] = await Promise.all([
    read("../index.html"), read("../src/styles/brand.css"),
    read("../src/assets/senapsis-wordmark.png"), read("../src/assets/senapsis-wordmark-dark.png"),
    read("../src/assets/senapsis-tagline-dark.png")
  ]);
  const html = app.toString("utf8"), styles = css.toString("utf8");
  assert.match(html, /data-dark-src="\.\/src\/assets\/senapsis-wordmark-dark\.png"/);
  assert.match(html, /class="brand-splash-tagline"[^>]*data-dark-src="\.\/src\/assets\/senapsis-tagline-dark\.png"/);
  assert.match(html, /dataset\.theme==="dark"[\s\S]*?image\.src=image\.dataset\.darkSrc/);
  assert.match(styles, /:root\[data-theme="dark"\] \.brand-splash[\s\S]*?background-color: #0D1524/);
  assert.equal(light.readUInt32BE(16), dark.readUInt32BE(16));
  assert.equal(light.readUInt32BE(20), dark.readUInt32BE(20));
  assert.equal(taglineDark.readUInt32BE(16), 773);
  assert.equal(taglineDark.readUInt32BE(20), 44);
});
