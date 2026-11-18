# ESTADO · Traza

Actualizado: 18 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0 | completa | feat(step-7): añadir helper checkView |
| 1 | pendiente | |
| 2 | pendiente | |
| 3 | pendiente | |
| 4 | pendiente | |
| 5 | pendiente | |
| 6 | pendiente | |
| 7 | pendiente | |
| 8 | pendiente | |

## Rutas reales verificadas

- `index.html`, `src/styles/shell.css`, `src/styles/layout.css`: cabecera compartida sticky de 101 px, selector, subsecciones y acciones de tema/movimiento.
- `src/ui/simulator.js`, `src/ui/preferences.js`: Concentración oculta la cabecera; controles de tema y movimiento guardan preferencias.
- `e2e/shared-navigation-header.spec.js`, `e2e/simulator-focus.spec.js`, `e2e/ui-layout.js`: geometría, modo Concentración y chequeos de vistas responsive.
- `docs/informes/fase-0/INFORME.md`, `docs/PROGRESO.md`: evidencias anteriores de la Fase 0; reutilizadas, sin duplicar informes ni capturas.

## Supuestos tomados

- Ninguno de §2.2; no aplica a esta fase.

## Pendientes y riesgos

- Fase 0 verificada: helper `checkView(page, ruta, opciones)` cubre nueve rutas, sin scroll horizontal, con chequeos opcionales de solapamiento y recorte.
- Validación: 30/30 archivos Node y 145/145 pruebas E2E Chromium aprobadas; matriz visual 390, 768, 1366 y 1920 px en ambos temas.
- El árbol tenía cambios locales previos en `index.html`, `src/ui/simulator.js`, `docs/PROGRESO.md` y otros archivos; se conservaron fuera de este commit.

## Acciones que solo puede hacer el usuario

- Revisar visualmente la fase en el navegador.
