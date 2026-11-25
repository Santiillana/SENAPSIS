# PASO 4: estado compartido competencia → tema y pestañas

Dependencias: PASOS 1 a 3 (no son técnicos, pero así los cambios visuales quedan separados de los estructurales).
Commit: `feat(aprende-paso-4): contexto competencia-tema compartido entre lecciones y ejercicios`

## Qué hacer
1. Competencia y tema se eligen una sola vez. Ese contexto queda visible y compartido al alternar entre Lecciones y Ejercicios.
2. Volver a la lista de temas no pierde el lugar. El estado (competencia, tema, pestaña, ítem abierto) vive en la dirección de la página, de modo que el botón "atrás" del navegador funciona y un enlace abre la misma vista.
3. Mantén la barra superior Lecciones | Ejercicios | Simulador. El breadcrumb existente (Competencias › Evaluación de requisitos › Diagramas de flujo) se conserva como contexto visible en ambas pestañas.
4. No cambies todavía el diseño interno de lecciones ni de ejercicios.
5. El progreso ya guardado en el navegador no se pierde; no cambies sus claves de almacenamiento sin migración.

## Cierre (verificable)
- Alternar entre Lecciones y Ejercicios no vuelve a pedir competencia ni tema.
- "Atrás" y recargar la página restauran la misma vista.
- Una dirección copiada y pegada abre la misma competencia, tema, pestaña e ítem.
- Navegación por teclado y estados accesibles intactos.
- Tests y E2E del área de navegación en verde (actualiza solo los que dependan de marcado que cambió).
