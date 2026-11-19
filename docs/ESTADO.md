# ESTADO · Traza

Actualizado: 19 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0 | completa | feat(step-7): añadir helper checkView |
| 1 | completa | docs(step-18): cerrar tanda de mejoras del simulador |
| 2 | completa | `ba0ac0f` |
| 3 | auditoría completa; 3b espera aprobación explícita | `c7cf5f0` |
| 4 | completa | `14e86de` |
| 5 | en curso, step 2 | en curso |
| 6 | pendiente; multi-ficha excluida | |
| 7 | pendiente; configurar Cloudflare requiere al usuario | |
| 8 | pendiente | |

## Rutas y decisiones verificadas

- `src/content/ficha.js` y `src/content/temas.js` son fuentes de verdad de competencias y temas; `src/content/exercises.js`, `source-exercises.js` y `src/math/exercises.js` contienen los 108 ejercicios actuales.
- `src/content/exercise-adapter.js` adapta los tres bancos al esquema común y valida estructura; no modifica datos fuente.
- `scripts/auditar-ejercicios.mjs` genera `docs/auditoria-ejercicios.csv`; el análisis y la recomendación están en `docs/auditoria-ejercicios.md`.
- `src/content/exercise-solution.js` normaliza la presentación de los apartados disponibles y omite los vacíos.
- Ejercicios inicia en competencias y temas; el banco y sus controles técnicos solo aparecen al abrir un tema. Las tarjetas ya muestran cantidad y avance local.
- El selector actual del Simulador carga 45 ejercicios de flujo; la referencia HTML contiene 30. El valor 44 del plan está desactualizado.
- La multi-ficha queda fuera. No se deben añadir `ficha_id` ni selección de varias fichas.
- La Fase 3b requiere aprobación del informe y solicitud expresa; no redactar ejercicios nuevos ni reescritos antes de eso.
- `reference/` permanece protegida. Los archivos del usuario no relacionados se mantienen sin cambios ni se incluyen en commits.

## Validación registrada

- Fase 2: contraste AA en ambos temas; suite Node 356/356; Aprende E2E 8/8.
- Fase 4: panel Mi progreso accesible; pruebas de esquema/contenido 3/3; Mi progreso E2E 2/2; retención de estrellas del Laboratorio 1/1.
- Fase 3: los bancos validan el esquema; no se detectan duplicados exactos ni descensos de nivel por orden; `MAT-ENT-15` está pendiente de confirmar transcripción.
