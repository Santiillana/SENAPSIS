# Progreso del plan maestro

Actualizado: 17 de noviembre de 2026

## Auditoría inicial

El plan de `docs/PLAN_MAESTRO.md` coincide byte por byte con `/home/santiago/Descargas/Traza plan maestro de mejoras para Codex.md`. Se auditaron los commits posteriores a `feat(step-20): add source lab and project contract` y el estado actual del código.

| Área | Estado | Evidencia inicial y trabajo restante |
| --- | --- | --- |
| Steps 1–20 | Implementados en commits separados | `git log` contiene `feat(step-1)` a `feat(step-20)`. Verificar criterios a lo largo de las fases que los usan; no recrear capacidades existentes. |
| Fase 0, pasos 1–7 | Completa | Cabecera sticky consistente (101 px), nueve rutas, subsección «Lecciones», modo Concentración opcional y helper E2E en cuatro tamaños/dos temas. Informe y 72 capturas en `docs/informes/fase-0/`. La matriz y la suite completa pasaron. |
| Fases 1–8 | Pendientes de auditoría detallada | Se evaluarán en orden después de cerrar Fase 0, sin rehacer código existente. La referencia se copió a `docs/referencia-simulador/`. |

## Paso 0

- Commit de cambios locales: `a282d0d fix: concentración oculta cabecera y diagnóstico actualizado`.
- El plan está confirmado contra el original de Descargas.
- Referencia protegida copiada sin modificar `reference/`.
- Auditoría de commits: hay commits `feat(step-1)` a `feat(step-20)`, seguidos por mejoras de simulador, ejercicios y `fix(dev)`; el estado real de cada capacidad se validará según los criterios de cada fase.

## Paso 1: suite E2E

**Completo** (`b6bd177`). El baseline estable tuvo 26 fallos de 136; cada uno se clasificó y los de expectativa obsoleta se actualizaron con justificación. Se corrigieron el panel de mecánicas del Laboratorio y la reanudación de cámara al avanzar después de un paneo. Se añadieron comprobaciones responsive que encontraron y corrigieron desbordamientos en móvil/tableta. La clasificación detallada está en `docs/informes/fase-0/INFORME.md`.

- `npm test`: 345/345.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:browser -- --workers=2`: 144/144 en 4,3 min. Se usó servidor local persistente después de observar que el servidor integrado dejó de responder en corridas largas; no hubo `ERR_CONNECTION_REFUSED` en la corrida final.
- El humo de producción tiene límite específico de 35 s basado en medición: 10,9 s aislado, 20,7 s bajo contención; terminó en 13 s en la corrida final.

## Fase 0

**Completa.** La cabecera mide 101 px, conserva su geometría entre vistas, permanece sticky y el modo Concentración la oculta solo bajo solicitud. La subsección usa «Lecciones» y el documento no presenta scroll horizontal global. El helper `e2e/ui-layout.js` cubre nueve rutas y cada prueba matricial cubre los cuatro tamaños de la sección 4.5 bajo un tema; las ocho combinaciones pasaron.

- Informe: `docs/informes/fase-0/INFORME.md`.
- Capturas: `docs/informes/fase-0/capturas/README.md` (72 archivos: nueve rutas × cuatro tamaños × dos temas).
- Documentación de capacidades y navegación sincronizada en `README.md` y `docs/MAPA_DEL_REPO.md`.
- Cierre registrado en commits separados para reparación E2E y documentación/evidencia.
