# Diagnóstico del Simulador v3 (E0)

Base inspeccionada: rama `main`, commit `893dd1cf4192be1a627d8e21eea49d012506e3fb`.
Referencia leída completa: `reference/diagramas_de_flujo_original.html` (586 líneas).
Destino: `src/ui/simulator.js`, `src/diagram/layout.js`, `src/diagram/renderer.js`, `src/styles/simulator.css`, `index.html`.
El diagnóstico registra las causas observadas en la base antes de cambiarla; las líneas corresponden a ese commit.

## D1–D18: causa y corrección aplicada en la rama

| Defecto | Causa observada en la base (ruta:línea) | Acción en `mejoras/simulador-v3` |
|---|---|---|
| D1 | `src/styles/simulator.css:326-350`: alias de escenario gris azulado y tarjetas planas; las figuras no usan la paleta rica del archivo de referencia. | Tokens `--senapsis-*`, fondo radial Observatorio, vidrio, estados y paleta clara/oscura aislada. |
| D2 | `src/ui/simulator.js:873-887`: el listener wheel siempre llama a `zoomAt()`. | Wheel desplaza; Shift/deltaX lateral; Ctrl/⌘+wheel y pellizco hacen zoom; botones dedicados. |
| D3 | `src/ui/simulator.js:1077-1097`: `fitDiagram()` limita escala a la altura disponible y reinicia el desplazamiento en cero. | Fórmula de ancho de referencia y centrado dentro del área libre. |
| D4 | `src/ui/simulator.js:425-440`: `setCameraFree()` muestra `#sim-camera-follow`; cámara se desactiva por gesto y no se reactiva en todos los pasos. | Se elimina la llamada/banner; cámara actualiza aria y se reactiva al renderizar el evento siguiente. |
| D5 | `src/ui/simulator.js:798-840`: rastro histórico y ficha existentes en v2 no conservaban una estela activa perceptible con rebote/etiqueta. | Rastro activo con dashoffset, texto de operación, anillo y rebote; el rastro recorrido se conserva desde los snapshots. |
| D6 | `src/ui/scenes/scene-event.js` y `src/ui/simulator.js:943-1005`: escena y contexto se distribuyen entre superficies y algunas alturas fijas. | Ventanas de vidrio, cuerpo desplazable como último recurso; escena y superficies de Concentración concisas. |
| D7 | `src/styles/simulator.css:2-70,360-470`: el grid mantiene problema/diagrama/inspector y paneles internos con alturas máximas, más el dock. | Panel izquierdo unificado y columna derecha apilada, con capas y tamaños coordinados. |
| D8 | `index.html:180-184`, `src/ui/simulator.js:641-672,890-910`: minimapa HTML, generación SVG y listeners de interacción. | Eliminado del HTML y se retiraron sus funciones, llamadas y listeners JS. |
| D9 | `src/ui/simulator.js:1206`: el botón 🎯 invoca `openLabActivity("predict")`. | Predice es un flujo propio del Simulador; no cambia sección ni hash. |
| D10 | `src/ui/simulator.js:1197-1353`: listeners agrupados, con controles de interfaz heredados y navegación a Laboratorio. | Auditoría de listeners: barra, paneles, selector, zoom, reproducción, teclado, concentración y Predice. La aceptación final depende de P15/CI. |
| D11 | `src/ui/simulator.js:811-840,943-1005`: vuelo corto y actualización por snapshot sin señal visual unificada entre figura y destino. | Ficha con ruta, rastro animado, pulso de llegada; se preservan vuelos de variables/salida de la capa de coreografía. |
| D12 | `src/diagram/renderer.js:45-70`: figura activa se resalta, pero no había etiqueta junto a la ficha ni anillo de llegada. | SVG persistente con rastro activo, anillo, etiqueta y estado de rebote. |
| D13 | `src/ui/simulator.js:1077-1130`, `src/styles/simulator.css:196-205`: pantalla completa solo sobre el stage; no hay un modo de ocultar chrome y recalcular escala de foco. | Clase `body.focus`, CSS de pantalla completa, fit específico y salida con Escape. |
| D14 | `index.html:20-42`: barra del Simulador incluía acción a Laboratorio. | Botón Laboratorio retirado; Laboratorio sigue como espacio 04. |
| D15 | `index.html:20-42`, `src/ui/simulator.js:1197-1353`: controles compactos sin grupos claros ni atajos uniformes. | Grupos Texto/Vista/Aprender/Paneles/Concentración, aria-label, title, aria-pressed y atajos. |
| D16 | `src/styles/simulator.css:365-470,782-810`: contenedores con max-height, overflow y cabeceras con insignias/acciones en la misma fila. | Ajustes de ventanas, flujo vertical en panel izquierdo y cuerpo de información con mayor espacio. |
| D17 | `src/ui/simulator.js:843-872`: centrado basado en la figura, sin criterio estable para eje/ramas ni objetivo vertical al 45%. | Cámara calcula eje x=520, permite desplazamiento parcial para ramas y centra figura al 45%, con suavizado exponencial. |
| D18 | `src/ui/simulator.js:425-440`, `index.html:179`: aviso de cámara libre como botón flotante persistente. | Botón flotante retirado del HTML y de la gestión JS; el estado vive en 🎥 Cámara. |

## Función de referencia → módulo destino

| Función de `diagramas_de_flujo_original.html` | Pieza del repositorio | Acción / estado |
|---|---|---|
| `parse`, `exec` | `src/core/interpreter.js:65-110` | Se conserva el intérprete existente; la UI adapta snapshots y no duplica el motor. |
| `draw`, `fig`, `nd`, `sq`, `M` | `src/diagram/layout.js:16-120`, `src/diagram/renderer.js:45-70` | Layout y SVG persistente; no se modifica `src/core`. |
| `buildG`, `exitPt`, `rest`, `route` | `src/ui/simulator.js:690-840` | Grafo y rutas geométricas existentes sobre aristas SVG; ficha animada desde coordenadas muestreadas. |
| `moveTok` | `src/ui/simulator.js:811-840` | Duración y easing alineados con referencia; rastro, etiqueta y rebote añadidos. |
| `lay`, `fit`, `camT`, `camKick` | `src/ui/simulator.js:843-920,1077-1110` | Área libre, fit por ancho, cámara exponencial y reactivación por evento. |
| `show` | `src/ui/simulator.js:943-1005` | Render sincroniza pseudocódigo, paneles, variables, escena, línea de tiempo y ficha. |
| `sIo`, `sOp`, `sCond`, `TR`, `FK`, `LP`, `MON`, `STP`, `why`, `scene` | `src/ui/scenes/scene-event.js` y renderer de escena | Reutiliza presentaciones y desglose derivados del evento; no se copia el texto completo del motor. |
| `exp`, `histHTML` | `src/ui/simulator.js:943-1005` | Explicación, cambios, memoria e historial de snapshots. |
| `showVF`, `placeVF`, `vfTrack`, `tween` | `src/ui/simulator.js:730-810` | Ventana contextual existente; ubicación y animación evolucionan en la capa UI. |
| `fly` | `src/ui/simulator.js:730-810` | Vuelos de cambios/salida y pulso sobre ventana de destino. |
| `askable`, `ask` | `src/ui/simulator.js` | Nuevo Predice por snapshots preguntables, con pausa, respuesta y revelado. |

## Límites conocidos del diagnóstico

El layout v2 no expone directamente las tres estructuras `PLS`, `CT`, `PO` con los nombres del archivo 1. El repositorio ya proporciona nodos, aristas y rutas derivadas de paths SVG, que se consumen desde la UI. No se han modificado `src/core/*`. Las afirmaciones de paridad geométrica, ausencia de recortes y estabilidad en los 50 pasos deben respaldarse con Playwright; no se dan por aprobadas solo por la inspección del código.
