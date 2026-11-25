# PASO 6: Ejercicios en dos zonas

Dependencias: PASO 5 (reutiliza su componente; no lo dupliques).
Commit: `feat(aprende-paso-6): ejercicios en panel izquierdo y ventana de explicacion`

## Qué hacer
1. Ejercicios usa el mismo componente de dos zonas del PASO 5.
   - Panel izquierdo: ejercicios del tema activo con dificultad y los conceptos que practican, con filtros ligeros por dificultad y por concepto. Quita contadores tipo "N de N ejercicios".
   - Ventana grande: enunciado, conceptos que usa, pistas y explicación gráfica de la solución, con las mismas reglas de superficie única del PASO 5.
2. Botón "Ver paso a paso en el Simulador" en cada ejercicio que ya sea simulable. Abre el Simulador con ese ejercicio y permite volver al mismo punto (ítem y pestaña, por la dirección).
3. El Simulador NO se rediseña ni cambia su comportamiento. Si ya acepta abrir un ejercicio concreto, úsalo. Si no, haz el cambio mínimo en su entrada sin alterar su funcionamiento y anótalo en una línea.
4. Móvil y tablet igual que en el PASO 5.

## Cierre (verificable)
- Todo ejercicio que hoy abre en el Simulador sigue abriendo igual, y desde él se vuelve al mismo ejercicio.
- Los filtros por dificultad y concepto funcionan y se reflejan en la dirección.
- Sin tarjetas ni marcos anidados en la ventana.
- Funciona en 1366, tablet y 390 px, en claro y oscuro.
- Tests y E2E de ejercicios y de entrada al Simulador en verde.
