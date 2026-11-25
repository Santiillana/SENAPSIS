# PASO 2: marcadores de explicación y arreglo de diagramas

Dependencias: PASO 1 (usa sus tokens).
Commit: `feat(aprende-paso-2): marcadores semanticos y diagramas legibles`

## Qué hacer
1. Añade los diez marcadores como tokens con sus variantes clara, oscura y "tinta" (tabla de abajo).
2. En los diagramas de flujo de las lecciones, aplica el color por rol y corrige defectos:
   - el texto nunca se sale ni se recorta de su figura (ajusta tamaño o divide en líneas). Caso conocido: "doble = n × 2" y "Mostrar doble" en la lección 01;
   - las puntas de flecha no tocan texto ni figuras;
   - letra legible; convenciones correctas de diagramas de flujo.
3. Todo color de SVG sale de variables, para que cambie con el modo.
4. No rediseñes la estructura de las lecciones (eso es del PASO 5). No toques el Simulador.

## Reglas
1. Un color = un rol, en todas las lecciones. Nunca decorativo.
2. Segundo canal obligatorio: ✓ y ✕ en correcto y error; las figuras ya difieren por forma. En oscuro, verde y turquesa tienen casi el mismo brillo: se distinguen por tono, así que el segundo canal es imprescindible.
3. Cada lección introduce como máximo 2 colores nuevos; un gráfico combina como máximo unos 5. La leyenda muestra solo los colores en uso, la primera vez que aparecen.
4. Los seis marcadores propios de las explicaciones (azul, violeta, rosa, naranja, turquesa, lima) no aparecen fuera de explicaciones.
5. No uses verde/ladrillo para Sí/No de una decisión ("No" no es un error). Propón, en una línea, el tratamiento del rombo de decisión y de inicio/fin, que los marcadores no cubren.

## Marcadores
| Rol | Claro: relleno | Texto sobre relleno | Claro: tinta (texto/línea fina) | Oscuro |
|---|---|---|---|---|
| Ahora: mira aquí | #F2B705 | marino | #8A6500 | #F2B705 |
| Correcto ✓ | #0F7B4F | marfil | | #3FBF8A |
| Error ✕ | #C8362B | marfil | | #F0695E |
| Trazo: estructura y camino | #14213D | marfil | | #ECE7DA |
| Dato: entra | #2F6FED | marfil | #2459D6 | #6E9BFF |
| Cálculo: se transforma | #7B4DE0 | marfil | | #A98BFF |
| Resultado: sale | #D9338A | marfil | #B8236F | #F06BB0 |
| Repite: ciclo | #F28A1E | marino | #B35A00 (solo sobre superficie-lectura) | #F59D45 |
| Variable: memoria | #0E9AA7 | marino | #0A6F79 | #3CC3CF |
| Contador: avance | #A6CE39 | marino | #4F6B00 | #B5D957 |

En claro, los rellenos llevan borde marino (3:1 como gráfico). En oscuro, el texto sobre relleno es #0D1524. Rosa con texto marfil da ≈4.4:1: ajusta el tono lo mínimo hasta 4.5:1. Dato, cálculo y resultado usan tonos vecinos a propósito: es el recorrido de la información (entra, se transforma, sale).

## Cierre (verificable)
- En las lecciones del tema Diagramas de flujo ningún texto se sale de su figura y las flechas no tocan texto.
- Cada color aparece con un solo significado y con segundo canal.
- Los gráficos cambian bien entre modo claro y oscuro.
- Tests del área tocada en verde.
