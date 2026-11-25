# Fase 1 · Inventario y propuesta de arquitectura

**Step 1 · Solo auditoría; no cambia comportamiento.**  
Rama `mejoras-desarrollo` · 17 de noviembre de 2026

## Estado de partida

- El árbol estaba limpio (`mejoras-desarrollo`, cuatro commits por delante de `origin/mejoras-desarrollo`). La fase 0 y la reparación de la suite E2E constan en `docs/PROGRESO.md` y en los commits `8a0996a` y `b6bd177`.
- `npm test`: 29 archivos, 29 aprobados, cero fallos.
- Suite Playwright: 144 casos solicitados, en ejecución al redactar esta auditoría; se registrará su resultado antes de iniciar el step 2.
- Se localizaron `reference/diagramas_de_flujo_original.html` y su copia de consulta en `docs/referencia-simulador/`. La fuente histórica `reference/` queda protegida y no se modifica.

## Arquitectura observada

| Responsabilidad | Ubicación real | Estado y límites |
| --- | --- | --- |
| Catálogo del simulador | `src/content/exercises.js` | 45 ejercicios, 64 métodos y 185 casos de contenido. Es la fuente de verdad para selección, pseudocódigo y entradas de demostración. |
| Gramática segura | `src/core/parser.js`, `src/core/expression.js` | Parser con AST y evaluación de expresiones restringida; no interpreta JavaScript ni usa `eval`. Los nodos conservan `id`, línea, fuente y cuerpos anidados. |
| Ejecución | `src/core/interpreter.js` | `executePseudocode` genera una traza determinista de eventos con estado de variables, salidas, pila de ciclos, ruta, línea y datos del evento. Aplica límites de eventos e iteraciones. `createTimeline` ofrece navegación por índice. |
| Geometría del diagrama | `src/diagram/layout.js` | `layoutFlow` calcula nodos, aristas, dimensiones y `byId`, incluyendo IDs sintéticos para bifurcaciones/uniones. |
| SVG del diagrama | `src/diagram/renderer.js` | `renderDiagram` dibuja el modelo; `highlightDiagram` actualiza estado activo, visitado, ruta y ficha animada. |
| Escenas didácticas | `src/ui/scenes/` | Registro y renderizadores por tipo de evento (entrada, proceso, decisión, salida, ciclos, terminales y error), con utilidades compartidas. `simulator.js` integra escena y traza. |
| Carcasa de pseudocódigo | `src/ui/simulator.js` | 1.732 líneas al momento del inventario: catálogo, preparación, transporte, render de escena/variables/salida/traza, predicción, presentación, paneles, cámara, zoom, pan y tooltip/ficha contextual. Estado mutable compartido en ámbito de módulo. |
| Simulador de fuentes | `src/ui/source-simulator.js` | 130 líneas, interfaz propia de recorrido, predicción y cámara. Es un simulador distinto, no una implementación del contrato del simulador de diagramas. |
| Contrato de contenido | `src/content/temas.js`, `src/content/exercise-adapter.js` | Los ejercicios se adaptan al catálogo de ejercicios; el paso ejecutado procede del intérprete. No hay hoy un módulo de tema de diagramas que posea `construirPasos` ni un contrato común con el simulador de fuentes. |
| Pruebas | `tests/`, `e2e/` | Cobertura Node para parser, intérprete, escenas, layout, compilador, catálogo y módulos. Hay 33 archivos E2E y pruebas específicas de layout, navegación, escenas, recorrido y fuentes. |

## Contrato real de paso

Cada evento actual contiene, como base, `step`, `type`, `nodeId`, `sourceLine`, `sourceText`, `variables`, `outputs`, `loopStack`, `route`, `condition`, `result`, `change`, `value`, `expression`, `message`, `iteration` y `scene`. Los eventos específicos agregan campos como `errorCode`. El objeto `scene` se calcula en el intérprete y tiene `title`, `body`, `technical` y `variable`.

Esto da a la interfaz un estado suficiente para reproducir, rebobinar, buscar pasos y asociar nodo/código/variables/salida. Sin embargo, mezcla el evento ejecutable con texto de presentación (`scene`) y no formaliza campos de foco, globo, pregunta o modelo visual. Algunos eventos (inicio/fin/error) no tienen un `nodeId` de programa; la vista los vincula a nodos terminales o a líneas.

## Brechas y riesgos verificados

1. La carcasa principal concentra responsabilidades y estado global en `simulator.js`; cambios de cámara y de explicación pueden interferir con transporte y render.
2. Los módulos de parser/intérprete, layout, SVG y escenas ya están separados. Reescribirlos al extraer la carcasa duplicaría trabajo y aumentaría el riesgo de cambiar semántica.
3. La traza sí es el punto estable de integración; el contrato de tema propuesto en el plan todavía no existe como API separada. Incorporarlo requiere adaptadores con pruebas de equivalencia para los 45 ejercicios y sus 64 métodos.
4. El simulador de fuentes tiene navegación por teclado propia; no debe quedar acoplado a la extracción del simulador de flujo.
5. `renderDiagram` reemplaza el SVG mediante `innerHTML`; el resaltado posterior opera sobre DOM y CTM de SVG. El render del paso debe conservar orden de dibujado, accesibilidad y el posicionamiento contextual de `#vf`.
6. Cámara, pan, zoom y ficha contextual dependen de medidas reales del DOM, `ResizeObserver`, `requestAnimationFrame` y geometría SVG. Son especialmente sensibles a tamaños pequeños y a `prefers-reduced-motion`.
7. No hay una necesidad verificada de modificar el motor, el parser, los catálogos ni el compilador para comenzar la extracción.

## Propuesta para el step 2

- Mantener parser, intérprete, layout, renderer SVG y registro de escenas sin cambios semánticos.
- Extraer primero el contrato/adaptador puro de eventos del simulador de flujo a un módulo pequeño. Normalizar de forma explícita el evento del intérprete a un modelo de vista estable (`id`, foco/relación con nodo, tipo y datos de escena, estado de variables/salida, frase, línea y pregunta opcional), sin mover la ejecución ni inferir eventos nuevos.
- Mantener `simulator.js` como composición/controlador durante la extracción; pasar dependencias explícitas al render de paso en vez de replicar estado de transporte o cámara.
- Añadir pruebas deterministas de correspondencia evento-modelo para inicio, entrada, asignación, decisión ambas rutas, salida, ciclos, fin y error; comparar la traza y salidas antes/después para la batería de contenido existente.
- Aplazar la separación visual completa de la carcasa hasta que este adaptador y las pruebas pasen. No introducir dependencias, `eval` ni lógica de pseudocódigo fuera del parser/intérprete seguro.

## Criterio de avance

El step 2 puede comenzar cuando la ejecución completa de las 144 pruebas E2E quede verde. Al cierre de cada step se ejecutarán Node y Playwright; cualquier diferencia en eventos, salidas o accesibilidad se corrige antes de avanzar. Esta auditoría no modifica la experiencia ni el código de producción.
