# ESTADO · Traza

Actualizado: 18 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0 | completa | feat(step-7): añadir helper checkView |
| 1 | sesión A lista; sesión B pendiente | feat(step-8), fix(step-9) |
| 2 | pendiente | |
| 3 | pendiente | |
| 4 | pendiente | |
| 5 | pendiente | |
| 6 | pendiente | |
| 7 | pendiente | |
| 8 | pendiente | |

## Rutas reales verificadas

- `index.html`, `src/styles/shell.css`, `src/styles/layout.css`, `src/ui/preferences.js`: cabecera sticky de 101 px, navegación, tema y movimiento.
- `src/ui/simulator-shell.js`, `src/ui/flow-step-contract.js`, `src/ui/simulator.js`: navegación validada por contrato; render y cámara de flujo permanecen integrados en el simulador.
- `src/diagram/`, `src/core/`, `src/ui/scenes/`: layout/render SVG, parser/intérprete y escenas reutilizadas sin cambiar semántica.
- `e2e/shared-navigation-header.spec.js`, `e2e/simulator-focus.spec.js`, `e2e/simulator-keyboard-contract.spec.js`, `e2e/ui-layout.js`: aceptación de cabecera, foco, atajos y layout.
- `docs/informes/fase-0/INFORME.md`, `docs/PROGRESO.md`: evidencias anteriores; reutilizadas sin duplicar informes ni capturas.

## Supuestos tomados

- Ninguno de §2.2; no aplica a esta fase.

## Pendientes y riesgos

- Fase 0 completa; Fase 1 sesión A lista (contrato/carcasa de pasos, teclado, cámara, controles, globo y layout). El render de flujo sigue ligado a `simulator.js`.
- Validación Fase 1: 2/2 archivos Node y 21/21 E2E de área; prueba keyboard y checkView, 2/2 en Chromium. Suite completa queda para sesión B.
- Sesión B pendiente: panel Variables, escenas, pantalla previa, modos didácticos y pulido final.
- Se conservaron cambios locales preexistentes en `docs/PROGRESO.md`, `docs/informes/fase-1/INVENTARIO.md` y `mejoras imp/`.

## Acciones que solo puede hacer el usuario

- Revisar visualmente la fase en el navegador.
