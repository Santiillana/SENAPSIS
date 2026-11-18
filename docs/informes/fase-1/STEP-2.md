# Fase 1 · Step 2: contrato de pasos

**Estado:** completado · 18 de noviembre de 2026

## Cambios

- Se añadió `src/ui/flow-step-contract.js`, un adaptador puro entre eventos del intérprete y el contrato de vista del simulador.
- El paso expone id, foco, globo, escena, estado, salida, frase, línea de código y pregunta opcional, conservando los campos originales para los renderizadores existentes.
- `src/ui/simulator.js` adapta y valida la traza antes de crear la línea de tiempo. El parser, intérprete, compilador y semántica de ejecución no cambian.
- `docs/CONTRATO_SIMULADOR.md` documenta los campos y las comprobaciones.
- Se añadieron pruebas deterministas del contrato y de conservación de datos.

## Validación

- `npm test`: 30 archivos aprobados.
- `npm run test:browser -- --workers=2 --reporter=line`: 144/144 aprobadas.
- Una corrida previa tuvo un timeout aislado al esperar el SVG en la captura del ejercicio 24; la prueba pasó sola y la repetición completa pasó. No hubo cambio adicional de producto por ese timeout.
- `reference/` no se modificó. Este paso no cambia la presentación visual, así que no requiere capturas de UI.

## Límite de este paso

La extracción es incremental: la carcasa aún conserva composición y estado de transporte en `simulator.js`. El contrato permite separar esas responsabilidades después sin reescribir el motor.
