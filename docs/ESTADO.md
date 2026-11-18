# ESTADO · Traza

Actualizado: 18 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0 | completa | feat(step-7): añadir helper checkView |
| 1 | completa | docs(step-12): cerrar Fase 1 |
| 2 | pendiente | |
| 3 | pendiente | |
| 4 | pendiente | |
| 5 | pendiente | |
| 6 | pendiente | |
| 7 | pendiente | |
| 8 | pendiente | |

## Rutas verificadas

- `src/ui/simulator-shell.js`, `src/ui/flow-step-contract.js`: shell genérico, contrato, validador y navegación determinista.
- `src/ui/simulator.js`, `src/ui/scenes/`, `src/ui/simulator-intro.js`: render de flujo, escenas reversibles, seguimiento, paneles, modos y pantalla previa con preferencia persistente.
- `src/diagram/`, `src/core/`: layout SVG e intérprete sin cambios de semántica. Tipos de escena sin renderer propio usan `process.render` como respaldo genérico.
- `docs/contrato-paso.md`, `docs/como-agregar-tema.md`: contrato y guía de extensión.
- `e2e/simulator-keyboard-contract.spec.js`, `e2e/simulator-intro.spec.js`, `e2e/ui-layout.js`: teclado, pantalla previa y layout.

## Validación y riesgos

- `npm test`: 32/32 archivos; Chromium: 147/147 casos en cuatro fragmentos, incluido tema claro y tamaños 390, 1366 y 1920.
- `src/ui/simulator.js` conserva integrados el render SVG y la cámara de flujo; el shell ya acepta plantillas ficticias sin lógica de flujo.
- No se reescribieron parser, intérprete ni compilador. `reference/` quedó intacto.
- Se preservaron cambios locales previos en `docs/PROGRESO.md`, `docs/informes/fase-1/INVENTARIO.md` y `mejoras imp/`.

## Revisión manual

- El usuario puede revisar visualmente el simulador en navegador.
