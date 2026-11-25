# PASO 1: tokens de color, modos claro/oscuro y cuadrícula

Dependencias: ninguna. Es el primer paso. No cambies la estructura de pantallas.
Commit: `feat(aprende-paso-1): tokens de color, modos claro y oscuro y cuadricula`

## Qué hacer
1. Inventaría los tokens y colores fijos actuales en los estilos de Aprende y compáralos con las tablas de abajo.
2. Centraliza todo el color en variables (tokens) en un solo lugar. Que Aprende, Lecciones, Ejercicios y sus componentes los usen. No dejes colores fijos fuera de los tokens (incluidos los SVG existentes: pásalos a variables sin rediseñarlos todavía).
3. Implementa los modos claro y oscuro y la cuadrícula (C4).
4. Verifica los contrastes en la interfaz real. Umbrales: texto normal 4.5:1, interfaz y gráficos 3:1. Si algo no llega, ajusta lo mínimo y anótalo en una línea.
5. Revisa la pestaña activa de la barra superior (hoy "Aprende" se ve con poco contraste sobre el verde oscuro).

## Reglas de color (aplican a todo el rediseño)
1. Un color = un rol. Nunca decorativo.
2. El color nunca es el único canal: cada rol lleva además forma, símbolo o etiqueta.
3. La interfaz es neutra: solo verde de acción, mostaza como único acento y ladrillo para alertas.
4. Ningún color sirve de texto o línea fina si no pasa el contraste.

## Modo claro
| Token | Hex | Uso |
|---|---|---|
| fondo-página | #F7F1E3 | Fondo con cuadrícula |
| superficie-lectura | #FBF8F1 | Ventana grande, panel izquierdo |
| texto | #14213D | Texto y bordes fuertes |
| texto-secundario | #5B6477 | |
| marca | #0B3D2E | Nombre, títulos, pestaña activa con texto #F7F1E3 |
| acción | #0F7B4F | Botón principal con texto #FBF8F1; hover #0B6A43 |
| acento | #F2B705 | Solo relleno con texto marino. Nunca texto ni línea fina |
| alerta | #C8362B | Solo alertas |
| borde-suave | #D9D2C0 | Decorativo |
| borde-interactivo | #7A8396 | Controles |

## Modo oscuro (azul noche)
| Token | Hex |
|---|---|
| fondo-página | #0D1524 |
| superficie-lectura | #141F33 |
| superficie-elevada | #1B2A44 |
| texto | #ECE7DA |
| texto-secundario | #A5AFC4 |
| texto-terciario | #7C879E (solo no esencial) |
| borde-suave | #2E3F5F |
| borde-interactivo | #62779F |
| acción texto/enlace | #3FBF8A |
| acción botón | relleno #2BB37A, texto #06130D |
| pestaña-activa | relleno #1E5C45, texto #ECE7DA, borde #3FBF8A |
| acento | #F2B705 |
| alerta | #F0695E |

## Cuadrícula (ambos modos)
Fondo de página, hecha con CSS (sin imágenes), celdas de unos 24 px y línea de 1 px, definida con tokens. Claro: línea #E4D8BC. Oscuro: línea #1A2A45. Es decorativa: las superficies de lectura son sólidas y la cuadrícula nunca cruza el texto. Se oculta en alto contraste forzado.

## Mecánica de los modos
Modo inicial según prefers-color-scheme; el botón de modo existente lo cambia y se recuerda la elección. Sin parpadeo al cargar y sin eval. Declarar color-scheme.

## Cierre (verificable)
- No quedan colores fijos en los estilos de Aprende fuera de los tokens.
- El modo elegido se recuerda y no hay parpadeo al recargar.
- Contrastes de las tablas medidos; la pestaña activa cumple 4.5:1.
- Cuadrícula visible en ambos modos sin cruzar texto.
- Tests del área tocada en verde.
