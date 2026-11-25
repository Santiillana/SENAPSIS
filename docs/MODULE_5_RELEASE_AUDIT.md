# Módulo 5 · Informe de integración, auditoría y publicación

**Especificación:** Documento maestro V5, Módulo 5.
**Repositorio:** `Santiillana/Senapsis`.
**Commit base:** `e80d5773eed6ab0c193ad351e618ce744b0c8441`.
**PR:** [#20](https://github.com/Santiillana/Senapsis/pull/20).
**SHA validado:** `ee804803354a8ea5cf60d17c37405ac90792faa0`.

## Resultado ejecutivo

<badge>CI aprobada</badge>

- **Node:** 267/267 pruebas, cero fallos.
- **Playwright/Chromium:** 99/99 pruebas, cero fallos.
- **Run:** [GitHub Actions 43954434334](https://github.com/Santiillana/Senapsis/actions/runs/43954434334).
- **Capturas:** 18 archivos PNG; artefacto `ui-audit-29b2188dc0b27d9a41da525ea8b589d40b83d1df`, ID `14271616094`, 2,345,099 bytes.
- **Estado:** auditoría técnica aceptada para el SHA indicado; publicación real y smoke test externo pendientes.

## Auditoría de contenido y ejecución

- Catálogo actual: 45 retos (20 básicos, 10 intermedios, 10 avanzados y 5 expertos), IDs 1–45.
- `tests/exercise-execution.test.js` ejecuta cada método y cada escenario disponible con el intérprete real.
- `tests/reference-results.test.js` aplica un oráculo matemático independiente a los resultados esperados.
- Pruebas específicas cubren Euclides, primalidad, Cramer 3×3, Newton–Raphson y Simpson 1/3.
- Parser, expresiones, decisiones, Para/Mientras/Hacer–Mientras, entradas inválidas, mensajes y límites de iteración están cubiertos.
- No se ejecuta pseudocódigo como JavaScript; las pruebas comprueban ausencia de `eval` y `new Function`.

## Rendimiento funcional y sincronización

- Un ciclo de 200 vueltas conserva la salida correcta y mantiene la traza bajo el límite de eventos fijado.
- Los ciclos anidados preservan el contexto y la pila de iteraciones.
- La línea de tiempo salta entre snapshots y los restaura sin mutar datos.
- Las suites del Simulador revalidan pseudocódigo, nodo activo, ruta elegida, token, variables, historial, escena, salida y controles.
- Son pruebas de límites funcionales; no se presentan como benchmark de hardware ni test de carga multiusuario.

## Accesibilidad y auditoría visual

- Contraste WCAG AA mínimo 4.5:1 en las cuatro combinaciones de sección y tema.
- Estados de competencia y estado semántico diferenciados.
- Movimiento reducido y controles ARIA cubiertos por tests.
- El E2E de M5 visita los diez espacios: Inicio, Hoy, Semana, Calendario, Actividades, Biblioteca, Aprende, Ejercicios, Simulador y Laboratorio.
- Se recorre cada vista a 390, 768, 1024 y 1440 px, comprobando que no aparezca desbordamiento horizontal.
- Se comprueba la navegación con teclado y que la app siga funcionando con localStorage bloqueado.
- La navegación por todas las vistas no genera errores de consola, excepciones JS ni fallos de carga de scripts/estilos.

## Corrección encontrada y aplicada

La primera ejecución M5 detectó que, en un viewport móvil, el `backdrop-filter` de `.topbar` generaba un contexto de contención para un descendiente `position: fixed`. La barra de navegación inferior quedaba sobre el selector de sección y bloqueaba el toque.

Se retiró el filtro del contenedor superior a anchuras móviles y se aplicó un fondo sólido. La navegación fija volvió a quedar posicionada respecto del viewport. La segunda CI recorrió las 40 combinaciones vista/tamaño y pasó. El ajuste está aislado en `src/styles/shell.css`.

## Artefacto visual

[Descargar/ver artefacto de auditoría en GitHub Actions](https://github.com/Santiillana/Senapsis/actions/runs/43954434334/artifacts/14271616094)

El artefacto se genera desde Chromium e incluye capturas de la suite de aceptación configurada en CI. No equivale a una revisión táctil en dispositivos físicos.

## Publicación

- `.github/workflows/pages.yml` habilita una publicación manual de respaldo en GitHub Pages.
- El comentario del workflow identifica Cloudflare Workers como hosting primario, pero el repositorio no contiene una URL pública ni evidencia automatizada de su estado.
- `.github/workflows/post-deploy.yml` solicita el origen HTTPS real, espera la marca exacta `senapsis-release` y ejecuta `e2e/production-smoke.spec.js`.
- No se ejecutó ese workflow porque no se ha podido verificar el origen de producción.

La publicación no se marca como terminada hasta que el smoke test corra sobre el sitio real.

## Límites declarados

1. Constructor estructurado por secuencia, ramas V/F y ciclos anidados; no implementa conexiones manuales arbitrarias entre puertos SVG.
2. Chromium emulado, no prueba física en móvil/tableta.
3. Pruebas de rendimiento de iteraciones/traza, no benchmark físico ni carga multiusuario.
4. Despliegue y URL pública no comprobados; smoke test pendiente.

## Conclusión

**Módulo 5 aprobado a nivel de implementación de auditoría, documentación y CI automatizada.** El release público conserva un bloqueo externo: identificar/verificar el hosting real y ejecutar su workflow posterior al despliegue. La PR #20 permanece abierta contra `main`.
