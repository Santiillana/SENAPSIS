# Informe acumulado — Senapsis v2

Registro histórico de la iteración de mejoras v2, integrada posteriormente en `main`.
Base: main / d63acf146860209b2866460fbe34294b7c2d28ae

## Fase 0 — Auditoría

Estado: COMPLETADA (auditoría de fuente; pruebas locales no ejecutadas).

Hecho:
- Revisado el árbol del repositorio (64 rutas), README, especificación maestra, estado de implementación, decisiones y auditoría funcional.
- Revisados el contrato del intérprete, simulador, laboratorio, constructor, contenido, pruebas y estilos.
- Documentadas rutas, líneas clave, inventario de pruebas, eventos, límites del motor, ejercicios candidatos, jerga y tipografía menor a 13 px.
- Creada la rama desde main. No se tocó main ni ningún archivo protegido.

Evidencia:
- Base main: d63acf146860209b2866460fbe34294b7c2d28ae.
- reference/diagramas_de_flujo_original.html: SHA 9f7f5a3d68d10b004e2ea306df1109906f13bc33.
- Histórico documentado: 222 Node + 38 Chromium; no repetido sobre el commit base en esta sesión.
- Faltan pruebas locales y capturas de Playwright. CI asociada a la rama ajena instruction-2/live-lab-phase: run 43669616951, Node OK, 18 fallos Chromium.

Omisiones / NO VERIFICADO:
- No se pudo ejecutar npm test ni npm run test:browser desde la conexión GitHub.
- No se generaron capturas ni se hizo inspección manual en navegador.
- No hay un segundo prototipo original subido en esta sesión para comparación byte a byte.
- La identidad exacta de la etiqueta «De clase» para el ejercicio de cinco materias queda pendiente entre los candidatos 28 y 39.

Desviaciones:
- Se corrigieron supuestos históricos: el intérprete sí tiene límites; la navegación y constructor ya existen; no se reemplazan desde cero.

Ideas fuera de alcance:
- Editor libre de conexiones por puertos, activación de GitHub Pages y pruebas en un dispositivo físico.

## Próximas fases

Fase 1: sistema visual, tipografía, cabecera y preferencias.
Fase 2: escenas compartidas y Simulador.
Fase 3: ocho modos del Laboratorio.
Fase 4: 17 lecciones y progreso.
Fase 5: fichas y etiquetas de Ejercicios sin modificar el catálogo.
Fase 6: Inicio y pulido del Constructor.
Fase 7: accesibilidad, seguridad, rendimiento, documentación y pull request.


## Avance de implementación — iteración de mejoras v2

### Fase 1 — Sistema visual
- Tokens de diseño y tema oscuro inicial; tipografía base de 17 px y texto de interfaz con mínimo 13 px.
- Navegación, preferencias y jerarquía visual simplificadas.
- Revisión automatizada de tamaños tipográficos en ocho hojas de estilo: cero valores numéricos por debajo de 13 px en el corte documentado.

### Fase 2 — Simulador y escenas
- Adaptador de eventos del intérprete a escenas visuales reutilizables.
- Escenas diferenciadas para entrada, proceso, salida, decisión, ciclos y errores.
- Narración de pasos, estado de vueltas y tamaño de pseudocódigo ajustable.
- No se modificó el intérprete protegido ni sus límites de seguridad.

### Fase 3 — Laboratorio
- Ocho actividades: seis originales y dos nuevas (Completa el pseudocódigo y Sigue la flecha).
- Progreso local por actividad, estrellas y práctica mixta.
- «Completa el hueco» vuelve a ejecutar la expresión propuesta y compara salidas y variables con la traza original.
- «Sigue la flecha» usa el siguiente nodo real registrado por el intérprete y permite saltar a ese paso.
- Progreso por ejercicio y actividad, estrellas y práctica mixta.
- Pruebas: registro de las ocho actividades, generadores deterministas y dos recorridos E2E específicos.

### Fase 4 — Aprende
- 17 lecciones en cinco bloques temáticos.
- Cinco pantallas por lección: idea, escena, ejemplo ejecutable, práctica y resumen.
- Los 17 mini-programas se ejecutan con el intérprete compartido y se verifican individualmente.
- Cinco pantallas por lección: idea, escena, ejemplo ejecutable, práctica y resumen.
- Entradas de ejemplo editables, comprobación de respuestas y progreso guardado localmente.
- Prueba E2E: las 17 lecciones aparecen, se completa una lección y su estado se conserva después de recargar.

### Fase 5 — Ejercicios
- Se preservaron los 40 ejercicios originales y se añadieron cinco retos expertos (IDs 41–45).
- Distribución actual: 20 básicos, 10 intermedios, 10 avanzados y 5 expertos.
- Retos expertos: MCD/MCM con Euclides; primalidad y divisores; sistema 3×3 por Cramer; Newton–Raphson; integración de Simpson 1/3.
- Catálogo con filtro por concepto derivado del pseudocódigo, filtro «De clase», nivel Experto y paginación.
- Pruebas nuevas para los cinco algoritmos y oráculo independiente; confirmadas en CI.

### Fases 6 y 7 — Implementadas y verificadas
- Inicio con accesos rápidos y progreso; Constructor con historial, deshacer/rehacer y atajos.
- Auditoría automatizada de catálogo, mini-programas, generadores, escenas, tipografía y vistas responsivas.
- CI final de la rama: 259 pruebas Node y 43 pruebas Playwright aprobadas; capturas de escritorio, tableta y móvil generadas.
- PR #7 continúa abierto contra main. No se ha fusionado.


## Actualización de cierre de fases 6–7

- Fase 6 implementada: panel de inicio integrado al espacio de Ejercicios, con accesos rápidos y progreso guardado; Constructor con historial de 60 estados, deshacer/rehacer y atajos de teclado.
- Fase 7 en validación: se agregaron oráculos independientes para los cinco ejercicios expertos, pruebas de ejecución de las 17 lecciones y pruebas de navegador para catálogo, filtros, paginación e historial del Constructor.
- PR #7 abierto contra main. La rama no está fusionada. La aceptación depende de que la última ejecución de CI pase Node y Playwright y de revisar sus capturas.


## Validación de Fases 3 y 4 — 15 de noviembre de 2026

- Fase 3: ocho actividades registradas; «Completa el hueco» y «Sigue la flecha» cubiertas con pruebas Node y Playwright.
- Fase 4: 17 lecciones en cinco pantallas; los 17 mini-programas se ejecutan y el progreso sobrevive a una recarga.
- GitHub Actions, ejecución final de código 43678898298: [correcta](https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43678898298), commit funcional `91aba187f3a6b0e97e007cab3af0f4bfc8b2f0f9`.
- Pruebas Node: 259 aprobadas, 0 fallidas.
- Pruebas Playwright: 43 aprobadas, 0 fallidas.
- Capturas de escritorio, tableta y móvil: artefacto `ui-audit-bb386d78121db34514c7e74986bc24af3d2f3123`, ID 14147328295.
- PR #7 sigue abierto contra main. No se ha fusionado; main permanece intacta.


## Actualización de Fase 6 en la portada v4 — 16 de noviembre de 2026

La nota histórica anterior decía que la PR #7 seguía abierta. Ese estado quedó obsoleto: **la PR #7 se fusionó el 15-11-2026**, merge commit `893dd1cf4192be1a627d8e21eea49d012506e3fb`. Integró la primera versión de Inicio y el historial del Constructor con límite de 60 snapshots.

Tras el rediseño v4, la portada pasó a una vista separada con Mi ficha y Aprende. El trabajo actual de M6 completa la continuidad de la Fase 6 en esa nueva estructura:

- Inicio refleja el progreso real de las 17 lecciones, con porcentaje y barra accesible.
- El progreso usa la clave existente `senapsis:v2:learn`; no duplica ni cambia la persistencia.
- Atajos directos desde Inicio a Ejercicios, Simulador y Laboratorio.
- Los controles Deshacer/Rehacer exponen accesibilidad y teclas rápidas.
- Se verifica el límite de 60 snapshots, la recuperación de estados y el descarte de la rama futura.

**Evidencia M6:** PR #21 abierta; CI [43961209113](https://github.com/Santiillana/Senapsis/actions/runs/43961209113), SHA `a3c38a7ba3c72f6aabe1a1686dbe3166f5911cd4`; 267/267 Node y 103/103 Chromium, cero fallos; capturas en artefacto `ui-audit-7ff31ec21cce8e9256bd5be23ce0f204181c52ca`, ID `14274866581`.

La PR #21 no está fusionada. El informe diferencia la primera implementación de la Fase 6 (PR #7) de esta adaptación y auditoría de la portada v4.
