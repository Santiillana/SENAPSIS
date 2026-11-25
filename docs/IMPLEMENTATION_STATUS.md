# Estado de implementación · Traza

**Actualizado:** 20 de noviembre de 2026
**Repositorio:** `Santiillana/Traza`  
**Rama principal:** `main`  
**SHA de main después de M6 Mi ficha:** `1d6628f081ea413dd84eecdb6574072c9d0720f4`  
**PR M6 Inicio/Constructor:** [#21](https://github.com/Santiillana/Traza/pull/21), fusionada el 16 de noviembre de 2026.  
**PR M6 Mi ficha:** [#24](https://github.com/Santiillana/Traza/pull/24), fusionada el 17 de noviembre de 2026.

## Estado ejecutivo

**Cambio posterior:** por decisión del producto del 20 de noviembre de 2026 se retiraron Laboratorio y el Constructor gráfico que formaba parte de esa sección. Las tablas y los informes históricos de abajo describen el estado anterior a este retiro; el estado actual de temas y navegación está en `docs/MAPA_DEL_REPO.md`.

Los módulos V5 y la ampliación v4 del catálogo están integrados en `main`. La auditoría M5 se fusionó mediante la PR #20 el 16 de noviembre; la CI posterior sobre `main` fue correcta. El Módulo 6, derivado de la Fase 6 del informe de mejoras v2, amplía la portada v4 y verifica el historial del Constructor. La PR #21 se fusionó en `main` el 16 de noviembre de 2026.

| Área | Estado | Evidencia |
|---|---|---|
| Base visual y navegación | Integrada y auditada | 10 vistas, teclado y responsive |
| Aprende | Integrado | 17 lecciones, cuatro bloques, escenas y progreso local |
| Ejercicios | Integrado | 45 retos, distribución 20/10/10/5, búsqueda y filtros |
| Simulador y motor | Integrados y revalidados | Parser/intérprete determinista, traza común y regresiones |
| Laboratorio y constructor | Integrados y revalidados | Ocho actividades; Constructor estructurado sobre el motor común |
| M5 · auditoría y release | **Integrado en main** | PR #20 fusionada; 267 Node y 99 Chromium aprobadas en el SHA de auditoría |
| M5 v4 · Mi ficha (núcleo personal) | **Reforzado en esta entrega** | Lectura estricta, escritura protegida, respaldo versionado y recuperación validada; ver `docs/MODULE_5_FICHA_CORE.md` |
| M5 · publicación pública | Pendiente externo | Falta origen HTTPS real y smoke test posterior al despliegue |
| M6 · Inicio y Constructor | **Integrado en main** | PR #21 fusionada; 267/267 Node y 103/103 Playwright aprobadas |

## Secuencia y alcance

### Módulos del documento maestro V5
- **M1:** arquitectura visual, sistema de estilos, navegación y responsive.
- **M2:** lecciones y catálogo didáctico.
- **M3:** parser, intérprete determinista, SVG y sincronización del Simulador.
- **M4:** Laboratorio y constructor estructurado, con traza y motor común.
- **M5:** integración, auditoría, rendimiento y preparación de publicación.

El Documento maestro V5 define cinco módulos. El Módulo 6 que se ejecuta ahora procede de la secuencia complementaria del documento `docs/INFORME_MEJORAS.md` (Fase 6), no es un sexto módulo retroactivo de V5.

### Continuidad v4
La iteración v4 reorganiza la plataforma en Inicio, Mi ficha y Aprende. El rediseño del catálogo de Ejercicios fue integrado mediante PR #19; su merge commit fue `e80d5773eed6ab0c193ad351e618ce744b0c8441`.

### M5 · Integración, auditoría, rendimiento y publicación
- PR #20: [fusionada](https://github.com/Santiillana/Traza/pull/20), merge commit `ea25db33153afbb6ee506647496a74e6dc0f9fde`.
- CI de auditoría: [run 43955709695](https://github.com/Santiillana/Traza/actions/runs/43955709695).
- Resultado: **267/267 Node**, **99/99 Playwright/Chromium**, 18 capturas.
- M5 queda aceptado a nivel de código, documentación y CI.
- El deployment público sigue pendiente porque no se ha verificado un origen HTTPS real ni se ha ejecutado el smoke test de producción.

### M6 · Inicio y pulido del Constructor
El alcance procede de la Fase 6 del informe de mejoras v2. La PR #7 fue fusionada el 15 de noviembre de 2026 (merge commit `893dd1cf4192be1a627d8e21eea49d012506e3fb`) e integró la base del panel de Inicio y el historial de 60 estados del Constructor. El rediseño v4 posterior sustituyó esa portada por una portada de secciones, y el M6 actual completa su continuidad:

- Inicio muestra lecciones completadas de 17, porcentaje, barra de progreso accesible y mensaje contextual.
- El dato se lee de la clave persistente existente `traza:v2:learn`; no se duplica ni cambia su esquema.
- Inicio ofrece atajos directos a Ejercicios, Simulador y Laboratorio.
- Los botones Deshacer/Rehacer anuncian nombres accesibles y atajos de teclado.
- El historial existente de 60 snapshots no se reimplementa; se añaden pruebas del límite real, undo/redo, atajos y descarte de rama futura.

#### Resultado CI de M6
- PR: [#21](https://github.com/Santiillana/Traza/pull/21), fusionada en `main` mediante `cd9c7598969d9487c779234451a32d9e5f3d67c6`.
- Workflow: [GitHub Actions 43961209113](https://github.com/Santiillana/Traza/actions/runs/43961209113).
- SHA probado: `a3c38a7ba3c72f6aabe1a1686dbe3166f5911cd4`.
- Node: **267/267**, cero fallos.
- Playwright/Chromium: **103/103**, cero fallos.
- Artefacto visual: `ui-audit-7ff31ec21cce8e9256bd5be23ce0f204181c52ca`, ID `14274866581`, 18 capturas.

## Arquitectura y comandos

- Runtime: HTML/CSS/JavaScript ES nativo; sin bundler ni dependencias de runtime.
- Instalar: `npm install`
- Desarrollo local: `python3 -m http.server 8000`
- Node: `npm test`
- Chromium: `npx playwright install chromium` y `npm run test:browser`

## Publicación y limitaciones

- `.github/workflows/pages.yml` permite una ejecución manual de respaldo en GitHub Pages. El comentario del workflow identifica Cloudflare Workers como hosting primario, pero no hay evidencia automatizada del estado actual de ese hosting.
- `.github/workflows/post-deploy.yml` requiere el origen HTTPS real, espera la marca exacta `traza-release` y ejecuta `e2e/production-smoke.spec.js`. No se ha ejecutado porque no se ha verificado el origen de producción.
- No afirmar que la aplicación está publicada hasta completar ese smoke test.
- Responsive se prueba en Chromium emulado, no en un teléfono o tableta física.
- El constructor es estructurado (secuencia, ramas V/F y ciclos anidados); no es un editor libre de conexiones manuales arbitrarias entre puertos SVG.
- Las pruebas de rendimiento cubren límites funcionales de iteración/traza; no equivalen a benchmarks en hardware físico ni a pruebas de carga multiusuario.

## Referencias

- Especificación: `docs/MASTER_SPEC.md`.
- Informe M5: `docs/MODULE_5_RELEASE_AUDIT.md`.
- Informe M6: `docs/MODULE_6_HOME_BUILDER.md`.
- Informe acumulado v2: `docs/INFORME_MEJORAS.md`.
- Aceptación: `docs/FINAL_ACCEPTANCE.md`.


## Continuidad v4 · Mi ficha, pasos 5–7

- Paso 5: lectura estricta, escritura protegida, respaldo versionado y validación reforzada de documentos en `src/ficha/store.js` y `src/ficha/documentos.js`.
- Paso 6: Hoy, Semana y Calendario ya están integrados en `main` mediante PR #24. Esta PR corrige la vigencia del lunes según el horario compartido: Evaluar requisitos hasta 1-11-2026 y Matemáticas desde 2-11-2026, ambos de 18:00 a 22:00.
- Paso 7: Actividades y detalle integrados en esta PR, con checklist, notas, resultados transcritos, lecciones/ejercicios relacionados, documentos asociados y pruebas. CI final aprobada en SHA `03fc1e96782c15b61da68ab19c0780f981b82e5c`: 300/300 pruebas Node y 111/111 pruebas Playwright.
- La rama antigua PR #22 se cerró por duplicar arquitectura. Se mantiene una sola fuente de persistencia en `src/ficha/store.js`.
- No hay panel seguro de carga de archivos; los documentos oficiales se publican mediante contenido versionado y URL compartida HTTPS. El procedimiento para el moderador está en `docs/MODERATION_WORKFLOW.md`; una carga autenticada requiere backend.
