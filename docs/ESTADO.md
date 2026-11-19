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
| 5 | en curso, step 7 | en curso |
| 6 | pendiente; multi-ficha excluida | |
| 7 | pendiente; configurar Cloudflare requiere al usuario | |
| 8 | en curso, step 1 | auditoría |

## Rutas y decisiones verificadas

- `src/content/ficha.js` y `src/content/temas.js` son fuentes de verdad de competencias y temas; `src/content/exercises.js`, `source-exercises.js` y `src/math/exercises.js` contienen los 108 ejercicios actuales.
- `src/content/exercise-adapter.js` adapta los tres bancos al esquema común y valida estructura; no modifica datos fuente.
- `scripts/auditar-ejercicios.mjs` genera `docs/auditoria-ejercicios.csv`; el análisis y la recomendación están en `docs/auditoria-ejercicios.md`.
- `src/content/exercise-solution.js` normaliza la presentación de los apartados disponibles y omite los vacíos.
- Ejercicios inicia en competencias y temas; el banco y sus controles técnicos solo aparecen al abrir un tema. Las tarjetas ya muestran cantidad y avance local.
- En un tema, Ejercicios usa lista lateral ordenada por dificultad, estado pendiente/visto/resuelto, filtros textuales y búsqueda solo en catálogos grandes; en móvil la lista se colapsa sobre la hoja.
- La hoja de ejercicios de flujo usa cuadrícula compartida claro/oscuro, presenta únicamente apartados disponibles, enlaza conceptos, conserva el pseudocódigo de referencia y permite abrir el Simulador o marcar/desmarcar como resuelto. El scroll se conserva por ejercicio durante la navegación de la sesión; el progreso resuelto y la preferencia de tema se guardan localmente.
- El Laboratorio muestra competencias y temas antes de sus mecánicas. `temas.js` asigna 10 mecánicas a Diagramas de flujo, 6 a Fuentes y las referencias de `MATH_LAB` asignan 6 a cada uno de Enteros, Racionales y Regla de tres (34 mecánicas tema–catálogo). Sin catálogo disponible, el tema queda atenuado como «Próximamente».
- Las mecánicas compartidas por identificador son `match`, `order`, `fill-gap`, `error` y `whatif`; cada tema las usa mediante su generador ya existente. Matemáticas y Fuentes agrupan explícitamente en Observa, Construye e Investiga; Flujo conserva las familias de lectura, construcción y depuración. Los filtros de concepto muestran únicamente opciones del tema y se ocultan cuando hay menos de cuatro; dificultad usa Básico, Intermedio, Avanzado y Reto.
- Estrellas y medallas mantienen `traza:v2:progress`: las estrellas por reto conservan su máximo histórico; la medalla se calcula al alcanzar tres mecánicas con tres estrellas para un concepto del tema. La portada del Laboratorio suma los mejores resultados de cada mecánica, de `0` a `3 × mecánicas`.
- Según `docs/auditoria-ejercicios.csv`, faltan apartados en 108 ejercicios: flujo (45) carece de «Cuándo se usa»; Matemáticas (39) carece de «Para qué sirve», «Solución paso a paso» normalizada y «Cuándo se usa»; Fuentes (23) carece de «Por qué se resuelve así», «Para qué sirve» y «Cuándo se usa»; un ejercicio de Fuentes carece de los cinco apartados. Se omiten al renderizar. Completar contenido sigue sujeto a aprobación expresa de la fase 3b.
- El selector actual del Simulador carga 45 ejercicios de flujo; la referencia HTML contiene 30. El valor 44 del plan está desactualizado.
- La entrada del Simulador organiza los 108 ejercicios por competencia, tema y ejercicio, y deriva cada selección al reproductor dedicado de Flujo, Fuentes o Matemáticas. Abrirlo desde Aprende conserva el acceso directo al ejercicio seleccionado.
- Fase 8, step 1: Fuentes usa `source-simulator.js` con fuente activa, pasos de escenario y cobertura de requisitos/áreas; sus carriles P/S/T, ruta y hoja ya expresan la plantilla `clasificacion`. Matemáticas usa `math-player.js`: pasos `table`, `area`, `cross`, `result`, `check`, `fraction` y `tree`, con operación exacta y resultado parcial. Ambos poseen controles y animación propios; no consumen aún `createSimulatorShell`.
- Brecha fase 8: el contrato compartido exige `id`, `foco`, `globo`, `escena.tipo/datos`, `estado`, `salida` y `frase`. Las plantillas nuevas deben adaptar cada paso existente a esos campos y usar `createSimulatorShell`; `renderScene` solo contiene escenas de Flujo, por lo que clasificación y cálculo necesitan renderers de dominio con secuencia estática/reducida y sin alterar los bancos fuente.
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
- Fase 5 step 6: catálogo por competencia y tema, familias compactas, filtros con etiquetas textuales y resumen de estrellas implementados. Pruebas de lógica del Laboratorio: 4/4; E2E de Flujo, Matemáticas y Fuentes: 17/17; `node --check src/ui/lab.js` y `git diff --check`: limpios.
- Fase 5 step 7: selector de competencia → tema → ejercicio para los tres reproductores; acceso directo desde Aprende preservado. `e2e/simulator-entry.spec.js`: 2/2; `e2e/module-4-exercises.spec.js`: 11/11, incluido el acceso directo a Flujo y Matemáticas.
- Auditoría de fase 8: Fuentes produce secuencia de fuentes con aportes, requisitos y cobertura; Matemáticas produce secuencia exacta a partir de solución/reglas. El foco actual es exclusivamente vista; los reproductores conservan estado y controles dentro de sus módulos dedicados.
