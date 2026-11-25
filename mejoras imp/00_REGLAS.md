# Rediseño de Aprende (Senapsis): reglas comunes

Leer SIEMPRE antes de un paso, junto con AGENTS.md y el archivo PASO_N del paso pedido. No leas los demás pasos.

## Reglas de ejecución
- Ejecuta solo el paso pedido. No refactorices ni "mejores" nada fuera de su alcance.
- Búsqueda dirigida: lee solo los archivos necesarios. No recorras el repo ni releas lo que ya conoces.
- No crees documentos nuevos. Al cerrar, actualiza una sola línea en docs/ESTADO.md.
- Pruebas: corre solo las del área tocada. La suite completa solo en el PASO 8.
- No preguntes salvo bloqueo real. Ante una ambigüedad, elige lo que dice el paso y anótalo en una línea.
- Respuesta final: máximo 5 líneas (qué cambió, pruebas y resultado, commit).
- Un commit por paso con el mensaje indicado en el paso.
- Si el paso no cabe en la sesión, termina la parte coherente más pequeña, haz commit y dilo en una línea.
- Antes de empezar, verifica con `git log --oneline -15` que los pasos de los que depende ya están hechos. Si falta uno, detente y dilo.

## Alcance de todo el rediseño
Cambian: Lecciones, Ejercicios, la navegación entre ellos, las explicaciones, el color con modos claro y oscuro, y el nombre/logo que falte.
No cambian: el Simulador (solo se añade un enlace desde lecciones y ejercicios para abrirlo y volver al mismo punto), Mi ficha, y Laboratorio (retirado: no restaurar ni depender de él). Todo ejercicio que hoy abre en el Simulador sigue abriendo igual.

## Orden de los pasos
1. Tokens de color, modos claro/oscuro y cuadrícula
2. Marcadores de explicación y arreglo de diagramas
3. Nombre y logo
4. Estado compartido competencia → tema y pestañas
5. Lecciones en dos zonas (crea el componente de dos zonas)
6. Ejercicios en dos zonas (reutiliza el componente del paso 5)
7. Enlaces lección ↔ ejercicio y cobertura
8. Cierre: suite completa y documentación
