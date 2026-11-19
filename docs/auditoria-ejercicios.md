# Auditoría de ejercicios

**Alcance:** inventario de los catálogos actuales y sus adaptadores. No se modificó ningún enunciado, respuesta ni ejercicio. El CSV completo se regenera con `node scripts/auditar-ejercicios.mjs`.

## Conteos y reconciliación

| Fuente | Conteo verificado | Hallazgo |
| --- | ---: | --- |
| Catálogo de diagramas de flujo | 45 | Los IDs son 1–45 y todos tienen métodos ejecutables. |
| Selector actual del Simulador | 45 | Se genera directamente desde esos mismos 45 ejercicios; el conteo de 44 mencionado en el plan está desactualizado. |
| Referencia HTML del simulador | 30 | La secuencia `R` de `docs/referencia-simulador/diagramas_de_flujo_original.html` incluye 30 entradas. |
| Fuentes de información | 24 | Tres escenarios, ocho preguntas por escenario. |
| Matemáticas | 39 | Enteros 15, racionales 9 y regla de tres 15. |
| **Total de los tres bancos actuales** | **108** | 45 de flujo + 24 de fuentes + 39 de matemáticas. |

La diferencia entre referencia y catálogo actual es de 15 ejercicios. La diferencia entre el valor histórico de 44 y el selector actual es de 1; el código actual no excluye ningún ID del catálogo. La referencia original se mantiene intacta.

## Cobertura por dificultad

Para comparar con la distribución objetivo, se agrupan Básico como fácil, Intermedio como intermedio y Avanzado + Experto como difícil. Los porcentajes son descriptivos; no implican que el nivel de cada ejercicio esté validado pedagógicamente.

| Tema | Fácil | Intermedio | Difícil | Objetivo aproximado 40/40/20 |
| --- | ---: | ---: | ---: | --- |
| Diagramas de flujo (45) | 20 (44 %) | 10 (22 %) | 15 (33 %) | 18 / 18 / 9 |
| Fuentes (24) | 6 (25 %) | 6 (25 %) | 12 (50 %) | 10 / 10 / 4 |
| Enteros (15) | 3 (20 %) | 5 (33 %) | 7 (47 %) | 6 / 6 / 3 |
| Racionales (9) | 3 (33 %) | 3 (33 %) | 3 (33 %) | 4 / 4 / 1 |
| Regla de tres (15) | 5 (33 %) | 5 (33 %) | 5 (33 %) | 6 / 6 / 3 |

En flujo se cubren entrada (43 ejercicios), asignación (39), impresión (45), operaciones (40), comparaciones (42), decisiones (22), ciclos Para (27), Mientras (24) y Hacer–Mientras (4). También hay acumuladores (16), contadores (15), validación (8), centinelas (4), ciclos anidados (7), promedios (8), máximo/mínimo (8) y series/potencias (3). Las etiquetas son las que expone el adaptador de conceptos.

## Hallazgos verificables

- No hay enunciados exactamente duplicados dentro de cada banco tras normalizar tildes, mayúsculas y puntuación.
- Los niveles aparecen en orden no decreciente dentro de los tres catálogos; esto no prueba por sí solo que la dificultad real sea coherente.
- Los 45 ejercicios de flujo tienen métodos, pseudocódigo y oráculos con casos de prueba.
- Las 24 preguntas de fuentes tienen una respuesta indicada y explicación breve; todavía no enlazan conceptos a IDs de lección.
- Los ejercicios de Matemáticas no tienen enlaces a conceptos/lecciones. `MAT-ENT-15` está pendiente de confirmar la transcripción y no tiene respuesta computable.
- Ningún banco contiene aún todos los cinco apartados de solución que pide la Fase 5. El CSV indica por ejercicio cuáles faltan (`queSePide`, `porQue`, `paraQue`, `pasos`, `cuandoSeUsa`). En flujo hay pseudocódigo y análisis; en fuentes, respuesta y justificación; en Matemáticas, varios tienen cálculo o pasos verificables.
- La verificación automatizada no certifica claridad, unicidad matemática en lenguaje natural ni dependencia de conocimientos previos. Esas revisiones deben concentrarse en el ejercicio pendiente y en los contenidos que se decida reescribir.

## Esquema común y recomendación

`src/content/exercise-adapter.js` adapta flujo, fuentes y Matemáticas al mismo esquema (`id`, tema, competencia, nivel, tipo, enunciado, datos, solución, conceptos, simulable, laboratorio y `esDeClase`). La validación determinista comprueba estructura y tipos; los bancos de origen permanecen sin cambios.

| Decisión | Propuesta basada en esta auditoría |
| --- | --- |
| Conservar | Los 45 ejercicios de flujo con oráculos; las preguntas de fuentes con respuesta y explicación; los ejercicios matemáticos con resultado calculable. |
| Corregir antes de publicar | Confirmar la transcripción de `MAT-ENT-15`; crear enlaces de concepto a lección en fuentes y Matemáticas; completar los apartados faltantes de la hoja de solución. |
| Reescribir o eliminar | No se recomienda eliminar por duplicidad. La auditoría no autoriza reescrituras ni cambios de nivel sin revisar cada enunciado con el usuario. |
| Ampliar | Ajustar gradualmente la distribución fácil/intermedio/difícil por tema, priorizando ejercicios intermedios en flujo y fuentes y reduciendo el peso relativo de los difíciles donde excede el objetivo. No se añadieron temas nuevos de lógica de programación fuera de flujo porque no fueron solicitados. |

Las cantidades objetivo son una guía de balance, no una cuota para inventar o reclasificar preguntas sin revisión pedagógica. La Fase 3b requiere que el usuario apruebe esta auditoría y pida explícitamente el piloto de borradores.
