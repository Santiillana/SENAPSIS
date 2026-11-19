# ESTADO · Traza

Actualizado: 18 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0 | completa | feat(step-7): añadir helper checkView |
| 1 | completa | docs(step-18): cerrar tanda de mejoras del simulador |
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
- `docs/referencia-simulador/diagramas_de_flujo_original.html`: referencia original preservada sin cambios.
- `docs/contrato-paso.md`, `docs/como-agregar-tema.md`: contrato y guía de extensión.
- `e2e/simulator-keyboard-contract.spec.js`, `e2e/simulator-intro.spec.js`, `e2e/simulator-choreography.spec.js`, `e2e/simulator-windows.spec.js`, `e2e/module-3-simulator-experience.spec.js`: teclado, centrado inicial, selector, escenas, variables, paneles y movimiento reducido.

## Cierre de la tanda de mejoras del simulador

- Pasos 1–2: inventario, separación de carcasa/contrato y navegación determinista ya estaban implementados.
- Pasos 3–5: se corrigió el encuadre inicial, se dejó visible el selector de ejercicios y se conservó el seguimiento de la figura activa con su ficha anclada.
- Pasos 6–8: se ajustó la geometría de las ventanas y el dock; las escenas resumen cada operación con ilustración, dato y cambio de variable sin duplicar texto innecesario.
- Paso 9: se revisaron teclado, movimiento reducido, tamaños 390/1366/1920, tema claro/oscuro y cambio de pestañas móviles.
- Paso 10: pruebas y documentación actualizadas. Los commits de implementación son `770379c`, `cc85f3a`, `010e76c`, `a7578f0` y `7c38a9a`.

## Validación y riesgos

- `npm test`: 351/351 pruebas.
- Pruebas Playwright enfocadas en teclado, pantalla previa, escenas, navegación, ventanas y responsive: 14/14 casos.
- Pruebas Playwright de escenas de ciclo, historial, movimiento reducido y pestañas móviles: 17/17 casos.
- La comprobación específica de geometría de ventanas pasa en 1366×768 y 1920×1080.
- `src/ui/simulator.js` conserva integrados el render SVG y la cámara de flujo; el shell ya acepta plantillas ficticias sin lógica de flujo.
- No se reescribieron parser, intérprete ni compilador. `reference/` quedó intacto.
- Se preservaron cambios locales previos en `docs/PROGRESO.md`, `docs/informes/fase-1/INVENTARIO.md` y `mejoras imp/`.

## Revisión manual

- El simulador queda listo para revisión visual local con `npm run dev` y `http://localhost:8000`.
- La preferencia estética final (ritmo de animación, densidad visual y microtextos) queda abierta a los comentarios del usuario durante esa revisión.
