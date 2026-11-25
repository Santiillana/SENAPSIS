# PASO 7: enlaces lección ↔ ejercicio y cobertura

Dependencias: PASOS 5 y 6.
Commit: `feat(aprende-paso-7): enlaces entre lecciones y ejercicios`

## Qué hacer
1. Cada lección enlaza a los ejercicios que practican sus conceptos; cada ejercicio indica qué lecciones necesita. Deriva las relaciones de los catálogos reales (src/content, src/math) por concepto. No inventes relaciones ni contenido.
2. Calcula la cobertura: lista corta de ejercicios cuyos conceptos no tienen lección suficiente en su tema. Entrégala como una línea por ejercicio en la respuesta final (no crees un documento).
3. Los enlaces conservan el contexto competencia → tema y funcionan con teclado.

## Cierre (verificable)
- Desde una lección se llega a un ejercicio relacionado y viceversa, sin volver a elegir competencia ni tema.
- Ningún enlace apunta a un ítem inexistente (comprobación automática en las pruebas).
- La lista de cobertura está en la respuesta final.
- Tests del área tocada en verde.
