# Módulo 6 · Inicio y pulido del Constructor

**Origen de alcance:** Fase 6 de `docs/INFORME_MEJORAS.md` (Senapsis v2).
**Repositorio:** `Santiillana/Senapsis`.
**Rama:** `v4/module-6-home-builder`.
**PR:** [#21](https://github.com/Santiillana/Senapsis/pull/21), abierta y no fusionada.

## Contexto y continuidad

El Documento maestro V5 contiene cinco módulos. El número 6 de esta entrega corresponde a la Fase 6 de la hoja complementaria de mejoras v2: **Inicio y pulido del Constructor**.

La PR #7, fusionada el 15 de noviembre de 2026, ya había integrado la primera versión de esta fase: panel de inicio con atajos y progreso, además del historial del Constructor con 60 estados, deshacer/rehacer y atajos. El rediseño v4 posterior sustituyó el panel integrado al espacio Ejercicios por una portada separada con Mi ficha y Aprende. Por eso el M6 actual no duplica la función antigua: adapta Inicio a la estructura v4 y prueba de forma explícita los límites del Constructor.

## Implementación

### Inicio
- Añadido progreso real de Aprende: lecciones completadas de 17, porcentaje y barra accesible con `role=progressbar`, `aria-valuenow` y `aria-valuetext`.
- Añadido mensaje contextual: empezar, continuar o ruta completada.
- El progreso se lee del estado existente `senapsis:v2:learn`; no se introduce una segunda clave ni se modifica la estructura persistida.
- Añadidos accesos rápidos directos a Ejercicios, Simulador y Laboratorio.
- La continuidad del último espacio visitado se conserva.

### Constructor
- Se conserva el historial existente de un máximo de 60 snapshots del modelo.
- Los botones Deshacer/Rehacer incorporan `aria-label`, `aria-keyshortcuts` y texto de ayuda con atajos.
- Se mantienen Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z y Ctrl/Cmd+Y.
- No se modifican el parser, intérprete, compilador ni renderer.
- Se conserva el comportamiento de descartar los estados futuros al registrar una edición nueva después de deshacer.

## Pruebas M6

Archivo: `e2e/module-6-home-builder.spec.js`.

1. El progreso de Inicio coincide con el registro guardado, se actualiza al completar una lección y permanece después de recargar.
2. Los accesos de Inicio abren Ejercicios, Simulador y Laboratorio.
3. Deshacer/Rehacer funciona con atajos, los atributos de accesibilidad están presentes y una nueva edición invalida la rama futura.
4. El historial conserva exactamente los últimos 60 estados: la prueba hace 65 modificaciones, deshace 59 veces hasta el límite más antiguo y rehace hasta el último estado.

## Resultado de CI

<badge>CI aprobada</badge>

- SHA probado: `a3c38a7ba3c72f6aabe1a1686dbe3166f5911cd4`.
- Run: [GitHub Actions 43961209113](https://github.com/Santiillana/Senapsis/actions/runs/43961209113).
- Node: **267/267**, cero fallos.
- Playwright/Chromium: **103/103**, cero fallos.
- Capturas: 18 PNG, artefacto `ui-audit-7ff31ec21cce8e9256bd5be23ce0f204181c52ca`, ID `14274866581`.

La suite de M6 se ejecutó junto al conjunto completo existente; no se sustituyeron ni omitieron pruebas previas.

## Cambios de código

- `index.html`: progreso visible en Inicio, atajos y nombres/teclas accesibles en Deshacer/Rehacer.
- `src/ui/content-view.js`: sincronización del avance guardado con la portada.
- `src/styles/shell.css`: estilos de progreso y accesos directos, con adaptación móvil.
- `e2e/module-6-home-builder.spec.js`: cuatro recorridos nuevos de aceptación.

No se modifican el motor, el modelo de ejercicios ni el contenido de las 17 lecciones.

## Estado y límites

**M6 está validado a nivel de implementación y CI; la PR #21 permanece abierta contra `main`.** No se fusionó durante esta ejecución.

La aceptación automatizada no sustituye una prueba física en un teléfono/tableta. La publicación pública sigue pendiente de un origen HTTPS real y del workflow `post-deploy.yml`; este requisito externo ya estaba pendiente desde M5 y no forma parte del alcance de M6.
