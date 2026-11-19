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
| 5 | en curso, step 5 | en curso |
| 6 | pendiente; multi-ficha excluida | |
| 7 | pendiente; configurar Cloudflare requiere al usuario | |
| 8 | pendiente | |

## Rutas y decisiones verificadas

- `src/content/ficha.js` y `src/content/temas.js` son fuentes de verdad de competencias y temas; `src/content/exercises.js`, `source-exercises.js` y `src/math/exercises.js` contienen los 108 ejercicios actuales.
- `src/content/exercise-adapter.js` adapta los tres bancos al esquema común y valida estructura; no modifica datos fuente.
- `scripts/auditar-ejercicios.mjs` genera `docs/auditoria-ejercicios.csv`; el análisis y la recomendación están en `docs/auditoria-ejercicios.md`.
- `src/content/exercise-solution.js` normaliza la presentación de los apartados disponibles y omite los vacíos.
- Ejercicios inicia en competencias y temas; el banco y sus controles técnicos solo aparecen al abrir un tema. Las tarjetas ya muestran cantidad y avance local.
- En un tema, Ejercicios usa lista lateral ordenada por dificultad, estado pendiente/visto/resuelto, filtros textuales y búsqueda solo en catálogos grandes; en móvil la lista se colapsa sobre la hoja.
- La hoja de ejercicios de flujo usa cuadrícula compartida claro/oscuro, presenta únicamente apartados disponibles, enlaza conceptos, conserva el pseudocódigo de referencia y permite abrir el Simulador o marcar/desmarcar como resuelto. El scroll se conserva por ejercicio durante la navegación de la sesión; el progreso resuelto y la preferencia de tema se guardan localmente.
- Según `docs/auditoria-ejercicios.csv`, faltan apartados en 108 ejercicios: flujo (45) carece de «Cuándo se usa»; Matemáticas (39) carece de «Para qué sirve», «Solución paso a paso» normalizada y «Cuándo se usa»; Fuentes (23) carece de «Por qué se resuelve así», «Para qué sirve» y «Cuándo se usa»; un ejercicio de Fuentes carece de los cinco apartados. Se omiten al renderizar. Completar contenido sigue sujeto a aprobación expresa de la fase 3b.
- El selector actual del Simulador carga 45 ejercicios de flujo; la referencia HTML contiene 30. El valor 44 del plan está desactualizado.
- La multi-ficha queda fuera. No se deben añadir `ficha_id` ni selección de varias fichas.
- La Fase 3b requiere aprobación del informe y solicitud expresa; no redactar ejercicios nuevos ni reescritos antes de eso.
- `reference/` permanece protegida. Los archivos del usuario no relacionados se mantienen sin cambios ni se incluyen en commits.

## Validación registrada

- Fase 2: contraste AA en ambos temas; suite Node 356/356; Aprende E2E 8/8.
- Fase 4: panel Mi progreso accesible; pruebas de esquema/contenido 3/3; Mi progreso E2E 2/2; retención de estrellas del Laboratorio 1/1.
- Fase 3: los bancos validan el esquema; no se detectan duplicados exactos ni descensos de nivel por orden; `MAT-ENT-15` está pendiente de confirmar transcripción.
- Fase 5 step 3: flujo de lista lateral y hoja verificado en móvil, portátil y monitor; suite E2E de módulos 2 y 4, Fuentes y Constructor: 26/26 pruebas aprobadas en la última corrida completa previa al ajuste de scroll; prueba responsive focalizada: 1/1.
- Fase 5 step 4: hoja de flujo implementada; la cobertura verifica apartados opcionales, tema compartido al navegar y tras recarga, scroll por ejercicio, persistencia de resuelto y foco al marcar. `node --test tests/exercise-solution.test.js`: 1/1; `npx playwright test e2e/module-4-exercises.spec.js --workers=1`: 11/11; `git diff --check`: limpio.
- Fase 5 step 5: figuras y listas de solución se activan al entrar en la zona visible; movimiento reducido deja la secuencia completa estática y, sin `IntersectionObserver`, la escena se muestra completa desde el inicio. `npx playwright test e2e/module-4-exercises.spec.js --workers=1`: 11/11; `git diff --check`: limpio.
