# Registro de decisiones técnicas

## D-001 · Aplicación estática con módulos nativos
HTML semántico, CSS modular y JavaScript ES. GitHub Pages sirve el proyecto directamente.

## D-002 · Separación de capas CSS
Tokens, layout, componentes, movimiento, responsive y estilos de contenido separados por responsabilidad.

## D-003 · El motor es la única fuente de verdad
M1 y M2 no simulan ejecución. M3 implementa un único parser e intérprete deterministas. Diagrama, pseudocódigo, En escena, Variables, historial y salida consumen snapshots del mismo registro de eventos.

## D-004 · Referencia original inmutable
El HTML original se conserva byte por byte en `reference/diagramas_de_flujo_original.html`. Una función se considera migrada solo tras comprobar su equivalencia funcional.

## D-005 · Dock en el flujo de layout
El dock ocupa una fila propia del grid y nunca se superpone al lienzo.

## D-006 · No fingir controles incompletos
Los controles se habilitan solo cuando la acción correspondiente existe.

## D-007 · Accesibilidad desde la arquitectura
Navegación por teclado, estados ARIA, foco visible, tema claro/oscuro, movimiento reducido y respeto a `prefers-reduced-motion`.

## D-008 · CI reproducible en Ubuntu 24.04
Playwright 1.56.1 y Chromium se ejecutan sobre Ubuntu 24.04 porque el runner ubuntu-latest cambió a Ubuntu 26.04 y esa versión no tenía soporte de instalación de navegador compatible.

## D-009 · Contenido V5 independiente de la UI
14 lecciones y 40 ejercicios (20/10/10) residen en `src/content/`. Los conceptos de arreglos, matrices, funciones, procedimientos, recursividad y otros temas excluidos no se presentan como objetivos de aprendizaje.

## D-010 · Gramática restringida, sin evaluación dinámica
El parser de expresiones y el intérprete manejan solo operadores y estructuras explícitos del pseudocódigo educativo. Nunca ejecutar pseudocódigo como JavaScript; no usar `eval` ni `new Function`.

## D-011 · Snapshots como contrato de sincronización
Cada evento guarda variables, salida, nodo y línea, ruta lógica, cambios y contexto de iteración. La línea de tiempo navega esos snapshots sin volver a ejecutar estados previos; diagramas y paneles derivan del evento seleccionado.

## D-012 · Constructor compila al motor común
El M4 debe traducir los diagramas creados al pseudocódigo restringido de M3 y usar `executePseudocode`. No implementar un intérprete paralelo.

## D-013 · Constructor mediante flujo estructurado
El constructor utiliza una secuencia ordenada con ramas V/F y cuerpos de ciclo anidados. Las conexiones secuenciales se derivan del orden y la anidación; el compilador genera una sola gramática que consume el parser/intérprete de M3. No se crea un segundo motor. Este modelo impide aristas huérfanas por diseño, aunque no ofrece aún cableado libre entre puertos.

## D-014 · Laboratorio consume snapshots del simulador
La predicción, tabla, reconocimiento de símbolo y contexto visual leen la traza compartida. La actividad ¿Y si...? ejecuta una copia independiente y compara los resultados finales, sin mutar el recorrido base.

## D-015 · Oráculo independiente para validar el catálogo
Los resultados esperados se contrastan con cálculos de referencia por ejercicio, independientes del pseudocódigo y del intérprete. La batería se ejecuta dentro de CI junto con las pruebas de parser, UI y constructor.

## D-016 · Pan y cámara comparten un único desplazamiento
El auto-seguimiento centra el nodo activo y el gesto manual desplaza el lienzo mediante una transformación del mismo contenedor. Al tocar/arrastrar o hacer zoom manual se desactiva el seguimiento automático; la vista fit restablece el desplazamiento.

## D-017 · Vistas de simulador móviles
En pantallas pequeñas se navega con pestañas Problema, Diagrama, En escena, Variables, Salida e Historial. La pestaña cambia solo la superficie visible; no vuelve a ejecutar ni reinicia la traza.

## D-018 · Estado de escena colapsable
La explicación “En escena” puede minimizarse y expandirse sin afectar el estado del simulador. El estado de loop muestra el nivel exterior y el interno, cuando corresponda.

## D-019 · Desglose de expresiones desde AST
El desglose de cada operación utiliza el mismo evaluador de expresiones y el snapshot anterior/actual del intérprete. No se mantiene un cálculo visual independiente.

## D-020 · El límite de Pages se declara, no se presume
El proyecto estático es compatible con GitHub Pages, pero un merge no demuestra por sí mismo que Pages esté activado. La URL pública y la configuración de despliegue deben comprobarse tras configurar Settings → Pages.


## D-021 · La referencia original es la autoridad visual del Simulador
Para la vista Simulador, la composición de tarjetas y el dock en una fila del grid quedan sustituidos por la composición inmersiva de la referencia original: barra de 54 px, lienzo de viewport, paneles de vidrio laterales y dock flotante. La navegación global 01–05 y el resto de espacios se conservan. Esta decisión prevalece sobre D-005 para el Simulador porque la solicitud de rediseño especifica esa paridad visual; el dock debe permanecer por encima del escenario y no consumir una fila del layout.

## D-022 · Motor y SVG de una sola construcción
El intérprete y `src/core/*` no se modifican. El SVG sigue construyéndose al preparar un ejercicio; el avance actualiza clases y snapshots mediante `highlightDiagram()`. Las nuevas capas de cámara, rutas, paneles y animación consumen los mismos eventos y no vuelven a ejecutar el pseudocódigo.

## D-023 · Tokens del Simulador aislados y alineados con la referencia
El Simulador utiliza los valores cromáticos de la referencia y el tamaño base de 17 px en escritorio / 15 px en móvil, con rango de 13–26 px. Los nuevos alias quedan limitados al contexto del Simulador para no cambiar Aprende, Ejercicios, Laboratorio ni Constructor. Tema oscuro como valor inicial; el interruptor existente sigue controlando el tema.

## D-024 · La geometría de referencia se mide, no se codifica en la prueba
La aceptación compara bounding boxes del HTML original y del Simulador a 1920×1080. Las medidas de referencia se leen durante la ejecución de Playwright; no se duplican como fixtures fijos. Criterio máximo de diferencia: 6 px por elemento.

## D-025 · Despliegue separado de revisión
Registro histórico de la iteración de mejoras v2: los cambios se desarrollaron en una rama separada y se mantuvo `main` intacta hasta su integración. Esa restricción ya no aplica; la versión vigente está en `main`.

## D-026 · Cámara como transformación única del mundo
El SVG mantiene sus dimensiones base tras prepararse el ejercicio. Desplazamiento y zoom se aplican juntos en una única transformación de #flow-diagram-container; no se utiliza scroll para navegar el diagrama. El zoom conserva el punto bajo el cursor y los gestos de puntero usan captura para evitar saltos al salir del área.
## D-027 · Encuadre según el espacio disponible
La cámara automática calcula el rectángulo libre entre barra superior, paneles visibles y dock. El minimapa refleja la zona visible y permite desplazar la cámara con clic o arrastre. Una manipulación manual pausa el seguimiento y muestra el control «Seguir el proceso».

## D-028 · Ventanas satélite con estado independiente
Problema, Tus datos, Pseudocódigo, En escena, Variables, Pantalla e Historial son ventanas separadas con identidad cromática, controles para minimizar y fijar, y un rail para restaurarlas. El estado minimizado/fijado se guarda de forma tolerante a fallos en localStorage; en tablet se minimizan automáticamente las ventanas izquierdas que no estén fijadas.
## D-029 · Ventana contextual ligada a la figura
La explicación breve de cada evento se ancla al nodo activo y prueba cuatro posiciones (derecha, izquierda, arriba y abajo). Se rechazan ubicaciones que se crucen con la figura, flechas, etiquetas de rama, paneles o dock; cuando no existe una posición limpia se usa una conexión de apoyo.

## D-030 · Rutas y rastro derivados de conectores del SVG
El grafo de navegación se construye a partir de las aristas generadas por layoutFlow y sus paths SVG. Dijkstra selecciona la ruta de coste geométrico mínimo; los vértices del rastro se muestrean desde el atributo d real del conector. Si el navegador no ofrece métricas SVG, el fallback reproduce la misma geometría del renderer (secuencia, rama V/F o retorno), sin inventar una trayectoria ni modificar el intérprete.
## D-031 · Coreografía cancelable sobre snapshots
Los pasos manuales y la reproducción automática adaptan el evento de snapshot ya existente. Leer y las asignaciones vuelan hacia la variable afectada; Imprimir vuela hacia la nueva salida. Cada movimiento cancela RAF y temporizadores anteriores antes de iniciar otro. La preferencia de movimiento reducido elimina vuelos y pulsos animados, manteniendo el resaltado del destino.

## D-032 · No cubrir la decisión ni las ramas V/F
En los eventos de decisión, rama y condición de ciclo, la explicación permanece en el panel persistente En escena. La ventana flotante se oculta y el cable guía conecta el rombo con ese panel; las burbujas flotantes se reservan a los eventos secuenciales cuando existe un rectángulo libre. Esto prioriza la visibilidad de las ramas y sus etiquetas en los momentos de mayor densidad gráfica.


## D-033 · El simulador v3 reproduce la navegación espacial sin minimapa
El scroll convencional desplaza el lienzo; Ctrl/⌘+rueda y pellizco aplican zoom. El seguimiento automático puede pausarse con intervención manual y se reactiva al avanzar un evento. No se renderiza ni se mantiene una superficie de minimapa.

## D-034 · Concentración es un estado CSS independiente de Fullscreen API
La clase `body.focus` es la fuente de verdad del modo Concentración. La Fullscreen API mejora la inmersión cuando el navegador la admite, pero su ausencia o rechazo no impide el modo. Las flechas avanzan/retroceden eventos de la misma traza y Escape restaura el encuadre estándar.

## D-035 · Predice pertenece al Simulador y consume eventos preguntables
La pregunta se prepara desde el siguiente snapshot del intérprete y pausa la reproducción. Responder no modifica la traza; «Ver el paso» confirma el evento real y conserva el estado de reproducción anterior. El Laboratorio mantiene sus propias actividades, sin botón duplicado en la barra del Simulador.

## D-036 · Paleta del Observatorio aislada por tokens
Los tokens `--senapsis-*` definen escenario, vidrio, texto y acentos. La paleta oscura es la inicial y la paleta clara sigue el atributo `data-theme`; los alias solo se aplican dentro de `data-active-space="simulator"`.

## D-037 · La rueda no es un control de zoom
La rueda vertical desplaza el lienzo, Shift/deltaX desplazan horizontalmente y solo Ctrl/⌘+rueda, pellizco y botones modifican la escala. Esto conserva el comportamiento de desplazamiento espacial y evita el zoom involuntario.

## D-038 · No asumir un destino de producción no documentado
El repositorio no contiene una configuración de despliegue ni una URL pública verificable. GitHub Pages queda como tarea manual porque su origen debe activarse en Settings. La rama no debe declarar que Cloudflare u otro proveedor es producción sin evidencia verificable. El workflow post-deploy es manual y requiere el origen HTTPS real como entrada.

## D-039 · Respaldo antes del cambio de producción
La rama `respaldo/antes-simulador-v3` y la etiqueta `v2-antes-simulador-v3` apuntan al SHA `893dd1cf4192be1a627d8e21eea49d012506e3fb`. El PR se fusionará solo tras el éxito de pruebas unitarias, e2e, paridad y controles del Simulador; la etiqueta permite identificar el estado anterior.

## D-040 · Marca de release verificable contra un origen explícito
Cada entrega del Simulador v3 incorpora una meta `senapsis-release` y la misma cadena en el pie de página. El workflow post-deploy solo se ejecuta manualmente y exige el origen HTTPS real como entrada. Espera la marca exacta y ejecuta humo de navegador contra ese origen antes de declarar la versión verificada.

## D-041 · Evidencia antes que afirmaciones
La incapacidad de clonar el repositorio desde el entorno de trabajo no se sustituye por resultados simulados. Las pruebas se consideran aprobadas solo con el resumen real de GitHub Actions para el SHA exacto del PR y, para producción, con la marca HTTP y la ejecución del workflow post-deploy sobre un origen proporcionado y verificable.


## D-042 · No hay publicación implícita al fusionar
La validación CI del PR no equivale a un despliegue. El workflow de humo post-deploy no se activa en cada push a `main`: exige ejecución manual con el origen público real. Si no se dispone de ese origen, se reporta como pendiente y no se declara producción verificada.


## D-043 · Cuatro espacios y Constructor integrado en el Laboratorio
La navegación principal de la entrega actual contiene Aprende, Ejercicios, Simulador y Laboratorio. El Constructor no es una quinta vista ni un destino de navegación: vive como «Lienzo libre» dentro de Laboratorio → «Arma el diagrama». Esta organización reemplaza para la experiencia actual la estructura de cinco espacios descrita en documentación anterior.

## D-044 · Cuatro ventanas del Simulador, con salida e historial dentro de Variables
El Simulador presenta Problema, Pseudocódigo, En escena y Variables como sus cuatro ventanas pedagógicas. Pantalla e Historial se muestran como elementos desplegables dentro de Variables. No se crean ventanas satélite adicionales, minimizadores ni railes de restauración. Los controles de visibilidad son centralizados y la cámara recalcula el área disponible.

## D-045 · Selector de ejercicios contenido en el panel de controles
El selector circular de ejercicios forma parte del panel flotante agrupado. No utiliza posicionamiento fijo ni se superpone a los botones de zoom, cámara o presentación. La lista debe permanecer desplazable dentro de su contenedor y no bloquear los demás controles.

## D-046 · Cuatro vistas móviles del Simulador
En pantallas de hasta 900 px, el Simulador muestra pestañas Problema, Diagrama, En escena y Variables. Las pestañas ocupan una altura acotada; el diagrama conserva una fila flexible y el dock otra fila inferior. Cambiar de pestaña no modifica ni vuelve a ejecutar la traza.

## D-047 · Depuración con corrección ejecutable
«Caza el error» distingue localizar la línea sospechosa de seleccionar la corrección. La corrección se ejecuta con los mismos datos de entrada y se compara con el resultado original y el esperado. La actividad «¿Y si…?» compara las secuencias de eventos y señala el primer punto en el que divergen. Ambas actividades operan sobre copias independientes de la ejecución base.

## D-048 · Los tests siguen el contrato de la interfaz vigente
Las pruebas de aceptación deben seleccionar los ejercicios respetando la paginación, abrir el panel de controles antes de interactuar con sus controles internos y validar los nombres y agrupaciones visibles actuales. No se conservan expectativas de una quinta vista, ventanas minimizables, selector flotante independiente ni valores de variables que no correspondan al algoritmo ejecutado.


## D-022 · El cierre de M5 se ancla al repositorio y SHA vigentes
La evidencia de integración se registra contra `Santiillana/Senapsis`, su rama `main` y el SHA exacto validado. Los historiales que mencionan `Santiillana/Diagramas-de-flujo-`, PR antiguos o commits de una iteración previa se conservan solo como historial, no como estado vigente.

## D-023 · Las verificaciones automatizadas no equivalen a publicación
La suite CI demuestra el comportamiento del commit en el entorno de Actions. La publicación requiere completar un workflow de despliegue y ejecutar el smoke test contra el origen HTTPS real. Una URL no comprobada nunca se describe como producción activa.

## D-024 · El diseño estructurado del constructor se declara con precisión
El constructor integrado permite secuencias, decisiones y ciclos anidados mediante un modelo estructurado compilado al motor común. No se denomina editor libre de conexiones arbitrarias entre puertos. Esta limitación debe seguir visible en los informes de aceptación.

 
## D-025 · Evitar contextos de contención para navegación fija móvil
En la cabecera móvil, un `backdrop-filter` sobre el contenedor padre podía crear un containing block para la navegación descendiente `position: fixed` y superponerla al selector de sección. La auditoría M5 detectó el bloqueo de interacción; se quitó ese filtro del padre en móvil y se conservó un fondo sólido. La regresión está cubierta por el recorrido responsive de M5.

## D-026 · Evidencia M5 ligada al SHA y al artefacto exactos
La aceptación automatizada de M5 se registra contra el SHA `ee804803354a8ea5cf60d17c37405ac90792faa0`, el run 43954434334 y el artefacto `ui-audit-29b2188dc0b27d9a41da525ea8b589d40b83d1df`. Un resultado histórico de otra rama o SHA no sustituye esa evidencia.
