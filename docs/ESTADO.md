# ESTADO · Traza

Actualizado: 19 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0 | completa | feat(step-7): añadir helper checkView |
| 1 | completa | docs(step-18): cerrar tanda de mejoras del simulador |
| 2 | completa | `2b98fc8`–`c9b6cf6` |
| 3 | omitida por instrucción del usuario | — |
| 4 | pendiente | |
| 5 | pendiente | |
| 6 | pendiente, excluida la multi-ficha | |
| 7 | pendiente, depende de infraestructura y ficha_id | |
| 8 | pendiente | |

## Rutas y decisiones verificadas

- `src/content/ficha.js` es el catálogo único de competencias: id, nombre, tipo, orden, estado, forma y token; `src/content/temas.js` deriva de él las competencias de Aprende.
- `src/styles/tokens.css` conserva los tonos existentes de Aprende y define solid, tint, border y text por id; Mi ficha, actividades y Biblioteca reutilizan esas variables.
- `src/ficha/competencias-ui.js` genera el marcador común con forma y nombre asociado; Aprende, Actividades, Biblioteca, horario y evidencias derivan su identidad del id.
- `src/ficha/competencias-ui.js` conserva los emblemas existentes; el horario colorea por competencia. No hay campo ni regla de color por género del instructor.
- `logica-programacion` y `competencia-por-configurar` son entradas históricas sin equivalencia confirmada en Aprende; conservan su color anterior.
- El informe de la Fase 3 no se crea. Las fases posteriores usarán los catálogos actuales sin cambiar ejercicios.
- La multi-ficha queda fuera; la Fase 7 no debe asumir ni introducir `ficha_id` hasta que se defina ese modelo.

## Validación de Fase 2

- Contraste de los cinco marcadores sobre página y tarjeta en tema claro y oscuro: AA.
- Pruebas Node completas: 356/356 correctas.
- Playwright `e2e/module-4-learn.spec.js`: 8/8 correctas; Mi ficha conserva sus pruebas de horario y evidencias.
