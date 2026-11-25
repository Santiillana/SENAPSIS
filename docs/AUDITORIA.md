# Auditoría inicial — Senapsis v2

Fecha: 15 de noviembre de 2026
Repositorio: Santiillana/Diagramas-de-flujo-
Rama de trabajo inspeccionada: iteración histórica de mejoras del Simulador v2
Base verificada: main en d63acf146860209b2866460fbe34294b7c2d28ae

## 1. Estado real de la base

- El árbol de main contiene 64 rutas; la aplicación ya tiene cinco espacios, 40 ejercicios, 14 lecciones, parser/intérprete, SVG, simulador, seis actividades de laboratorio y constructor estructurado.
- package.json declara solo @playwright/test 1.56.1 como dependencia de desarrollo. Scripts disponibles: npm test y npm run test:browser. No existe script lint ni formatter.
- README y docs/IMPLEMENTATION_STATUS.md registran la integración de los cinco módulos y la aceptación histórica de 222 pruebas Node y 38 pruebas Chromium. La última confirmación principal consultada es d63acf; no hay ejecución de CI asociada a ese commit en la consulta de workflow runs. Por tanto, esos números son evidencia histórica del cierre anterior, no una repetición de la línea base en esta sesión.
- La rama de mejoras de esa iteración se creó desde `main`; la integración actual está consolidada en `main`.

## 2. Matriz de equivalencia del prototipo

La auditoría funcional existente en docs/ORIGINAL_FEATURE_AUDIT.md declara migrados el diagrama SVG, rutas V/F, token, cámara automática y manual, zoom/fit, controles de traza, pseudocódigo sincronizado, variables e historial, salida, explicación de operaciones, vueltas anidadas, Predice, Tabla, Ordena, Identifica símbolo, Encuentra el error y ¿Y si…?. El constructor sigue siendo estructurado, no un editor de conexiones libres por puerto.

Comprobación de implementación actual:
- Simulador: src/ui/simulator.js, prepare en línea 50, desglose en 154, render en 189, ejecución en 249 y enlaces en 413. Usa layoutFlow y renderDiagram; la UI consume snapshots del intérprete.
- Laboratorio: src/ui/lab.js, seis modos declarados en index.html líneas 178–183; renderizadores en líneas 98, 148, 177, 206, 230 y 254.
- Constructor: src/ui/builder.js; se apoya en makeNode, validateFlow y compileFlow del módulo central, y luego executePseudocode. Mantiene secuencias y bloques anidados.
- Aprende: src/ui/content-view.js, visualMarkup en línea 36 y renderLesson en 67. Hay una plantilla común de tres etapas cuyo rótulo depende de visual.kind; no son ocho escenas reutilizables por figura.
- Lecciones: src/content/lessons.js tiene 14 entradas. tests/content.test.js exige 14.
- Ejercicios: src/content/exercises.js contiene 40 entradas, distribución 20/10/10. No se modifica.

## 3. Contrato de eventos y límites del intérprete

src/core/interpreter.js es zona protegida.
- Límites: DEFAULT_MAX_EVENTS = 2500 (línea 15) y DEFAULT_MAX_ITERATIONS = 500 (línea 16).
- executePseudocode comienza en línea 65. Emite eventos con step, type, nodeId, sourceLine, sourceText, variables, outputs, loopStack, route, condition, result, change, value, expression, message e iteration; después agrega scene.
- Tipos usados por la UI: program-start, input, assignment, output, decision, branch, loop-init, loop-condition, loop-enter, loop-update, loop-exit, program-end y error.
- Errores de seguridad: step-limit y iteration-limit. No hace falta tocar el motor para proteger la interfaz ante el límite.
- sceneFor vive dentro de src/core/interpreter.js (línea 31). Por la zona protegida, la nueva capa visual debe adaptar el evento sin modificar el intérprete.

## 4. Pruebas existentes y protección

- tests/architecture.test.js: navegación de cinco espacios, paneles del simulador, seis actividades de laboratorio, breakpoints responsive, movimiento reducido, referencia original y ausencia de eval/new Function en la capa inicial.
- tests/content.test.js: 14 lecciones, 40 ejercicios 20/10/10, estructura de fichas, métodos y casos de prueba, alcance conceptual y casos de Fibonacci/máximos/factorial.
- tests/reference-results.test.js: oráculo matemático independiente; calcula salidas de los 40 ejercicios y comprueba todos los casos de cada método. La batería exige al menos 170 escenarios.
- tests/interpreter.js, tests/parser.js, tests/exercise-execution.test.js, tests/performance.test.js y tests/ui-modules.test.js protegen el comportamiento central y la interfaz.
- Zona protegida: src/core/*, src/content/exercises.js, reference/*, .github/* y las pruebas existentes, salvo las dos excepciones expresas del documento de mejoras (conteo de lecciones y texto e2e eliminado).
- reference/diagramas_de_flujo_original.html tiene blob SHA 9f7f5a3d68d10b004e2ea306df1109906f13bc33, coincidente con el SHA consignado en docs/IMPLEMENTATION_STATUS.md. No hay un segundo archivo del prototipo original en esta sesión para hacer una comparación byte a byte independiente.

## 5. Riesgos, decisiones y preguntas de integración del Simulador

### 5.1. Alcance y zonas protegidas

- El objetivo inmediato es el **Simulador inmersivo**, no volver a construir Aprende, Ejercicios, Laboratorio ni Constructor.
- Se modifica únicamente la capa del Simulador y sus estilos/pruebas específicas. `src/core/*`, `src/content/exercises.js`, `src/content/lessons.js`, `reference/*`, `.github/*`, Constructor y Laboratorio quedan fuera de alcance.
- En ese momento la rama de trabajo se mantenía separada; esta restricción dejó de aplicar al integrar la versión vigente en `main`.
- El motor mantiene su contrato y límites actuales (2.500 eventos y 500 iteraciones). Los efectos visuales consumen eventos ya emitidos; no añaden lógica de ejecución al pseudocódigo.

### 5.2. Riesgos técnicos que deben resolverse

| Riesgo | Evidencia actual | Decisión de integración |
|---|---|---|
| El lienzo no es infinito | `#diagram-stage` usa `overflow:auto`; `.flow-diagram-container` se dispone con grid y la cámara solo traslada el contenedor | El escenario pasa a ser un viewport sin scroll. Un único `translate3d(x,y,0) scale(k)` en el contenedor del mundo controla el SVG completo |
| Zoom no anclado al cursor | `zoomDiagram()` cambia una variable de zoom y centra el nodo; límites actuales 0,65–3 | Implementar zoom cursor-céntrico entre 0,25–3 y pinch con dos punteros; no usar `scrollLeft/scrollTop` |
| La cámara desconoce las ventanas | `centerActiveNode()` calcula el encuadre a partir de `#diagram-stage`, sin restar paneles superpuestos | Medir el área libre con `getBoundingClientRect`; recalcular por `ResizeObserver`, minimización, texto, modo enfoque y viewport |
| Los gestos compiten con la UI | El pan escucha eventos en `document`; no usa `setPointerCapture` | Captura de puntero en el escenario; cancelar al perder/cancelar puntero; ignorar controles y ventanas |
| Paneles no son ventanas independientes | Existe la cuadrícula de tarjetas; solo “En escena” tiene botón de minimizar y móvil usa pestañas | Convertir paneles requeridos en ventanas de borde con identidad, minimizar/restaurar y contador de cambios |
| Ventanita contextual puede tapar rutas | La explicación actual se dibuja dentro de “En escena”; no existe cálculo de posiciones candidatas respecto a aristas y etiquetas | Probar derecha/izquierda/arriba/abajo usando bounds de nodo, aristas y V/F; fallback con cable |
| No existe vuelo hacia el destino exacto | La ficha SVG se mueve por el recorrido y aparecen valores en la escena; no hay chips que viajen a celdas concretas | Añadir una capa de vuelo que convierta bounds de origen y destino a coordenadas de pantalla, sin modificar el SVG por paso |
| Interrupciones pueden dejar efectos pendientes | La reproducción usa un intervalo limpiado por `stop()`; aún no hay ciclo de vida común para vuelos, RAF y pulsos | Un único gestor cancelable por paso limpia RAF, temporizadores, transiciones y chips antes de cada seek/run |
| Responsive cambia el escenario actual | Hay pestañas móviles para seis vistas y breakpoints 1080/760/440 | Escritorio usa ventanas en bordes; ≤1100 minimiza la columna izquierda; ≤900 usa paneles inferiores, con lienzo táctil |
| Capturas no se deben simular | CI ya sube `test-results/**/*.png`; Playwright ejecuta Chromium en `e2e/` | Escribir capturas reales en `test-results` y mantener intacto `.github/workflows/quality.yml` |

### 5.3. Discrepancia de identificación del ejercicio de aceptación

La referencia aportada llama “ejercicio 14” al algoritmo **Mayor de 10 números**, con variante Para y traza de 50 eventos. En el catálogo actual de la rama, ese mismo problema está identificado como **ejercicio 24**; el ID 14 es “Sumar los números de 1 hasta N”. La prueba visual debe localizar y ejecutar “Encontrar el mayor de diez números” (ID actual 24) sin cambiar el catálogo. Se comprobarán sus 50 eventos contra la referencia antes de convertir ese número en aserción fija.

### 5.4. Integración de la barra de ejercicios con la navegación 01–05

- Se conserva la navegación global existente, en el mismo orden y con la misma función: **01 Aprende · 02 Ejercicios · 03 Simulador · 04 Laboratorio · 05 Constructor**. No se reutilizan sus botones como selector de ejercicios.
- La barra de ejercicios será una segunda navegación, local a `#view-simulator`, visible solo dentro del Simulador. No cambia de espacio global ni duplica la barra 01–05.
- Se alimentará de los ejercicios ya existentes en memoria (lectura únicamente); cada selección cambiará `exerciseId` y `methodIndex` a través del flujo actual `prepare()` / `senapsis:request-simulation`. No se crean, renombran, reordenan ni corrigen ejercicios.
- La barra indicará el ejercicio activo y su variante/método; conservará selección y ejecución al minimizar/restaurar ventanas. La selección de otro ejercicio sí preparará una ejecución nueva, como hoy.
- En escritorio se mantiene compacta en el borde superior del Simulador. En móvil se hace desplazable horizontalmente y no reduce el área táctil del lienzo. La zona de trabajo comienza debajo de la barra superior global y de esta barra local; nunca se superponen para ocultar controles.

### 5.5. Criterios que todavía deben probarse

1. El escenario cubre el espacio disponible debajo de la cabecera global y la barra local, sin borde, radio ni scroll interno.
2. Una sola transformación del mundo conserva el punto bajo el cursor en zoom; traslación ilimitada y escala entre 0,25 y 3.
3. El área libre excluye todas las ventanas visibles y el dock; figura activa, flecha de salida y etiquetas V/F permanecen visibles en cada paso automático.
4. Ventanita contextual sin intersección con figura, conectores y etiquetas; cable de fallback cuando no cabe.
5. Vuelos de Leer e Imprimir terminan dentro del objetivo DOM específico; el destino recibe pulso/contador.
6. Cinco seeks rápidos cancelan todos los vuelos; no quedan elementos ni temporizadores huérfanos.
7. Movimiento reducido omite vuelos y pulsos animados.
8. Capturas verificables de escritorio 1920×1080 y móvil 390×844 para pasos 1, 3 y 7 del algoritmo “Mayor de 10 números”.

### 5.6. Preguntas que quedan explícitas (sin bloquear el plan)

- Identidad exacta de “De clase”: el catálogo contiene 22 (potencia), 23 (Fibonacci), 24 (mayor de diez), 28 (promedio de cinco materias) y 39 (análisis ampliado de cinco materias). La selección original sigue NO VERIFICADA; no afecta el Simulador y no se tocará aquí.
- El ancho máximo del 28 % para cada columna lateral se interpretará como límite individual; en ventanas simultáneas se preservará siempre un rectángulo libre útil para el diagrama.
- Si ninguna posición de la ventanita contextual cabe, se utilizará cable fino al nodo y la explicación permanecerá en “En escena”, sin tapar la ruta.
- Para la barra local se propone selector horizontal desplazable, no un sexto espacio ni una modificación de la navegación 01–05.

## 6. Auditoría tipográfica

Se examinaron las ocho hojas de src/styles/*.css. Hay 196 declaraciones con tamaño numérico px/rem/em; 156 están por debajo de 13 px:
- layout.css: 5 de 9; líneas 8, 9, 17, 23 y 24.
- components.css: 37 de 49; desde 7 px hasta 12 px en múltiples componentes.
- responsive.css: 3 de 8; líneas 23, 44 y 45.
- content.css: 40 de 49; desde 7 px hasta 12 px en listas, etiquetas, tarjetas y controles.
- simulator.css: 28 de 32; desde 7 px hasta 12 px en narración, historial, variables y controles.
- lab-builder.css: 43 de 48; desde 7 px hasta 12 px en actividades, constructor y estados.
- tokens.css: 0 de 1 bajo el umbral.
- motion.css: 0 declaraciones de font-size.

El conteo corresponde a valores numéricos explícitos; no incluye tamaños heredados ni atributos SVG. Las figuras deben auditarse también por su marcado y cajas delimitadoras durante la fase del Simulador.

## 7. Jerga localizada en la interfaz

- index.html: línea 19 contiene «ENTORNO DE APRENDIZAJE» y «BASE 01 · ARQUITECTURA».
- index.html: línea 38 contiene «V5».
- index.html: línea 111 contiene «SVG SINCRONIZADO».
- index.html: línea 144 contiene «REGISTRO DETERMINISTA».
- index.html: línea 86 contiene «CONTEXTO DEL RETO».
- index.html: línea 253 contiene «REDISEÑO V5» y una nota de transición.
- navigation.js: SPACE_META contiene encabezados «ESPACIO 01 / 05» a «ESPACIO 05 / 05».
- content-view.js añade etiquetas internas de visualización y marca «SENAPSIS · APRENDE».
- index.html tiene seis actividades de laboratorio, en líneas 178–183.

## 8. Discrepancias del documento de mejoras frente al repo

- Confirmado: 14 lecciones, no 17.
- Confirmado: seis modos del Laboratorio, no ocho.
- Confirmado: existe una plantilla de visualización reutilizada, no escenas independientes por figura.
- Confirmado: hay tipografía inferior a 13 px, incluidas etiquetas de 7–9 px.
- Confirmado: hay jerga de desarrollo que debe retirarse.
- Corregido: el intérprete ya tiene límites de eventos e iteraciones; no se necesita run-guard dentro del motor.
- Confirmado: el Constructor actual usa bloques estructurados y no conexiones libres por puerto; el documento no debe presentar esto como una regresión del prototipo, sino como una limitación de alcance heredada.
- La cabecera y navegación ya incluyen cinco espacios, tema y movimiento reducido; deben pulirse, no reconstruirse.

## 9. CI y antecedentes de trabajo

- El registro histórico de CI describía filtros de rama anteriores. La configuración vigente está en `.github/workflows/quality.yml` y se debe consultar antes de publicar cambios.
- Se encontró la rama independiente instruction-2/live-lab-phase, 90 commits por delante de main. No se reutiliza: su diff modifica src/content/exercises.js, altera tests/reference-results.test.js, toca .github y agrega dependencias/archivos, contradiciendo la zona protegida.
- Su ejecución más reciente consultada fue Actions run 43669616951. La suite Node pasó, pero falló la suite de navegador con 18 pruebas fallidas. Los fallos incluyen errores de análisis del simulador, controles que no se estabilizan, expectativas de salida y zoom, y contraste positivo de 3,16:1 en tema claro.
- No se ejecutó un entorno local de Node/Playwright desde esta conexión de GitHub; no se generan capturas ficticias. Las capturas quedan pendientes de la CI del pull request.

## 10. Resultado de Fase 0

Auditoría de archivos y estructura completada con fuentes del repositorio. No se modificó código, pruebas, contenido protegido, referencia ni main. No verificado: reproducción local de las pruebas, inspección visual manual y comparación byte a byte contra un prototipo separado.
