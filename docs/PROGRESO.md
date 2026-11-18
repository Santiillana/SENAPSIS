# Progreso del plan maestro

Actualizado: 17 de noviembre de 2026

## Auditoría inicial

El plan de `docs/PLAN_MAESTRO.md` coincide byte por byte con `/home/santiago/Descargas/Traza plan maestro de mejoras para Codex.md`. Se auditaron los commits posteriores a `feat(step-20): add source lab and project contract` y el estado actual del código.

| Área | Estado | Evidencia inicial y trabajo restante |
| --- | --- | --- |
| Steps 1–20 | Implementados en commits separados | `git log` contiene `feat(step-1)` a `feat(step-20)`. Verificar criterios a lo largo de las fases que los usan; no recrear capacidades existentes. |
| Fase 0, pasos 1–6 | Parcial | Cambios locales recién guardados en `a282d0d` unifican CSS de cabecera, preservan selector en Simulador, modo enfoque y etiqueta de diagnóstico. La cabecera aún mide 101 px; hay estilos duplicados y falta probar consistencia completa. |
| Fase 0, paso 7 | Pendiente | La suite no incluye todavía un helper reutilizable de detección de desbordamiento y solapamiento aplicado a todas las rutas/tamaños. |
| Fases 1–8 | Pendientes de auditoría detallada | Se evaluarán en orden después de cerrar Fase 0, sin rehacer código existente. La referencia se copió a `docs/referencia-simulador/`. |

## Paso 0

- Commit de cambios locales: `a282d0d fix: concentración oculta cabecera y diagnóstico actualizado`.
- El plan está confirmado contra el original de Descargas.
- Referencia protegida copiada sin modificar `reference/`.
- Auditoría de commits: hay commits `feat(step-1)` a `feat(step-20)`, seguidos por mejoras de simulador, ejercicios y `fix(dev)`; el estado real de cada capacidad se validará según los criterios de cada fase.

## Paso 1: suite E2E

En curso. Comando: `npm run test:browser -- --workers=2`. Registrar clasificación, arreglos y commits aquí al completar.

## Fase 0

En curso. Se cerrará con helper UI, pruebas verdes, capturas y un informe en `docs/informes/`.
