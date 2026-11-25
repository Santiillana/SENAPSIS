# Auditoría de equivalencia funcional del prototipo original

**Fuente:** `diagramas_de_flujo.html`, conservado byte por byte en `reference/diagramas_de_flujo_original.html`.

Esta tabla diferencia una función migrada y probada, una sustitución intencional de interfaz y una limitación que sigue pendiente. El hecho de conservar el archivo original no se cuenta como migración.

## Matriz de equivalencia

| Capacidad original | Evidencia de prototipo | Equivalencia en Senapsis | Estado |
|---|---|---|---|
| Selector numerado de 40 ejercicios | `#ch` | Catálogo filtrable de 40 fichas 20/10/10 | Migrada |
| Puerta de reto antes de revelar | `#gt`, `#rv` | Modo reto en ficha: análisis, proceso, pistas y revelado voluntario | Migrada |
| Enunciado/contexto | `#info` | Panel Problema; entradas, salidas, restricciones y método | Migrada |
| Métodos alternativos | `#tabs`, `load` | Selector de método en ficha y simulador | Migrada |
| Diagrama SVG | `#sv`, `draw`, `buildG` | SVG generado desde AST del parser | Migrada |
| Símbolos terminal/entrada/proceso/salida/decisión | SVG original | Símbolos SVG con estilos semánticos | Migrada |
| Flechas, rutas y etiquetas V/F | `route`, conectores y rótulos | Rutas derivadas del AST; ruta elegida resaltada desde el evento real | Migrada |
| Token animado | `#tk`, `setTk` | Token SVG ligado al nodo activo; transición desactivable por reduced motion | Migrada |
| Cámara automática | `camT`, `camKick` | Seguimiento del nodo activo mediante transformación de canvas | Migrada |
| Cámara manual / pan | control en canvas | Arrastre desplaza el mismo canvas y desactiva auto-cámara | Migrada |
| Zoom y ajuste | `fit`, controles | Zoom por escala SVG y fit calculado desde viewBox | Migrada |
| Avance/retroceso/inicio/final | `#ctl` | Dock del simulador y navegación determinista por snapshots | Migrada |
| Play/pause y velocidad | `#pl`, `#sp` | Reproducción, pausa y cuatro velocidades | Migrada |
| Timeline y salto de paso | `#sl`, `#vu` | Range y tarjetas de historial navegables | Migrada |
| Pseudocódigo resaltado | `#code` | Línea activa/recorrida ligada al sourceLine del evento | Migrada |
| Datos editables y restauración | `#tx`, `#rs` | Input editable y botón de restauración del sample del método | Migrada |
| Escena gráfica/explicativa | `#sc`, `scene` | Panel En escena con símbolo, texto, condición, operación y contexto de ciclos | Migrada con nueva composición |
| Ventana flotante de escena | `#vf`, `showVF`, `hideVF` | Panel persistente junto al diagrama; puede minimizarse, no flota sobre el lienzo | Sustitución intencional de UI |
| Variables actuales | `#vars` | Tabla de variables desde el evento actual | Migrada |
| Valor anterior/nuevo y causa | estado original / `#hist` | Transición, instrucción fuente e historial por variable | Migrada |
| Grafo geométrico de rutas | Referencia: Dijkstra sobre aristas SVG | Grafo de conectores con Dijkstra y rastro SVG sobre los mismos paths; fallback geométrico equivalente | Migrada |
| Transferencia de valores (fly) | Referencia: Leer / asignación / Imprimir | Chips animados desde el evento al nodo/celda de variable o nueva salida, con pulso y contador de destino | Migrada |
| Historial variable por iteración | `#hist` | Eventos filtrados por variable con número de paso y vuelta | Migrada |
| Salida | `#out` | Salida acumulada del snapshot | Migrada |
| Explicaciones y desglose de operaciones | `#ex`, `show` | traceExpression con operandos y resultados desde el evaluador común | Migrada |
| Vueltas de ciclos anidados | estado de escena | Stack de loops con nivel externo/interno y vuelta | Migrada |
| Predice | `ask`, `#qz` | Actividad compara predicción con el próximo evento verdadero | Migrada |
| Tabla de seguimiento | `tTab` | Tabla de snapshots, cambios, salida y contexto de iteración | Migrada |
| Ordena instrucciones | `oTab` | Reordena las líneas del método y comprueba el orden | Migrada |
| Identifica símbolo | `cTab` | Reconoce el símbolo asociado al nodo de ejecución actual | Migrada |
| Encuentra el error | `eTab` | Contraejemplos ejecutados por el motor; incluye un algoritmo correcto | Migrada |
| ¿Y si…? | `mTab` | Ejecuta código/datos cambiados en una copia aislada y compara estado final | Migrada |
| Revelar solución | `#rv` | Revelado voluntario en la puerta de reto | Migrada |
| Tamaño del pseudocódigo | `#fm`, `#fp` | A− / A / A+ persistente entre recargas | Migrada |
| Pantalla completa | `#fs` | Fullscreen del lienzo y botón de salida dentro del fullscreen | Migrada |
| Tema claro/oscuro | variables CSS / preferencia | Tema explícito persistente | Migrada y ampliada |
| Diseño responsive | media queries | Layout adaptativo; tabs móviles para seis paneles del simulador | Migrada y ampliada |
| Movimiento reducido | `prefers-reduced-motion` | Respeta media query y control de motion; anima token/rutas solo cuando corresponde | Migrada y ampliada |
| Laboratorio visible junto al diagrama | `#lab` | Contexto persistente con SVG, escena y variables; la actividad queda al costado/abajo | Migrada |
| Constructor completo con conectar flechas arbitrariamente | No está en el prototipo original; requisito nuevo V5 | Constructor estructurado: secuencia, ramas V/F y cuerpos de ciclos; flechas inferidas por orden/anidación | **Parcial / limitación declarada** |

## Limitación explícita del constructor

El constructor permite colocar tipos de nodo, editar sus propiedades, mover/eliminar instrucciones, entrar a ramas V/F y a cuerpos de ciclos, validar bloques y ejecutar la solución en el mismo intérprete M3. Sus conexiones son implícitas a partir del orden y la estructura anidada.

No ofrece todavía un editor libre de puertos/aristas en el que el alumno pueda arrastrar cualquier conector hacia cualquier nodo, ni un validador de aristas huérfanas arbitrarias porque ese tipo de arista no forma parte de su modelo. Esto significa que el criterio V5 de conexiones manuales arbitrarias no está cubierto íntegramente. No debe declararse como completado en futuros informes sin implementar ese alcance adicional.

## Controles del laboratorio

El original tenía paneles/actividades que se podían alternar. En móvil el nuevo simulador usa tabs para Problema, Diagrama, En escena, Variables, Salida e Historial; cada cambio conserva el índice actual de la traza. En escritorio los paneles se presentan en paralelo.

## Evidencia automatizada final M5

- CI push: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43614738106 — success.
- Node: 222/222; suite incluye 170 escenarios de resultados independientes del catálogo.
- Playwright Chromium: 38/38; cinco espacios, responsive 1440/1024/390 px, motor, laboratorio, constructor, controles del simulador, pan, fullscreen, zoom, vista móvil, reduced motion y capturas.
- Capturas finales subidas como artefacto de CI: `ui-audit-045f5be0b2f5dc7fe39eb34797a69cba26448612`.
- HTML original Git blob: `9f7f5a3d68d10b004e2ea306df1109906f13bc33`.

## Regla de cierre

Solo una prueba funcional puede convertir una fila de “parcial” a “migrada”. Una equivalencia de interfaz puede ser intencionalmente distinta, pero debe conservar la acción educativa, declarar su cambio visual y mantener los datos del mismo motor.


## Actualización de equivalencia para la versión integrada en Senapsis (16-11-2026)

La interfaz actual de la rama `main` amplía la navegación y el catálogo respecto de la línea base de este documento:
- Inicio enlaza Mi ficha y Aprende.
- Mi ficha contiene Hoy, Semana, Calendario, Actividades y Biblioteca.
- Aprende contiene Aprende, Ejercicios, Simulador y Laboratorio.
- El catálogo actual tiene 45 retos: conserva el conjunto base y añade cinco retos expertos.
- El Laboratorio mantiene ocho actividades y el constructor estructurado dentro del mismo espacio.

Esta actualización no convierte en “migrada” una capacidad que siga siendo parcial. En particular, el constructor no ofrece conexión libre entre cualquier puerto SVG. La evidencia de navegación y equivalencia del release debe asociarse al SHA auditado en `docs/IMPLEMENTATION_STATUS.md`, no a capturas o resultados de una rama histórica.
