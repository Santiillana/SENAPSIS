# Documento maestro V5 — Rediseño de Diagramas de flujo

**Objetivo:** reconstruir y superar el prototipo educativo entregado, conservando su riqueza funcional y visual, pero mejorando su pedagogía, claridad, arquitectura, precisión y facilidad de uso.

**Repositorio GitHub localizado:** `Santiillana/Diagramas-de-flujo-`  
**Rama predeterminada observada:** `main`  
**Referencia funcional:** `diagramas_de_flujo.html`  
**Referencias visuales entregadas:** tres capturas del prototipo en funcionamiento: pantalla de reto inicial, simulación con paneles y laboratorio con tabla de seguimiento.

> Este documento es la especificación principal. Sustituye las propuestas previas cuando exista alguna contradicción. La implementación debe realizarse en cinco módulos, en orden, con pruebas y commits verificables.

---

# 1. Visión: qué estamos construyendo

No es un curso genérico de programación ni una colección de dibujos de diagramas. Es un **laboratorio visual e interactivo para aprender a resolver problemas matemáticos y lógicos mediante diagramas de flujo**.

El estudiante debe poder:

1. Entender qué pide un problema.
2. Identificar datos de entrada, procesamiento y salida.
3. Descomponerlo en instrucciones ordenadas.
4. Elegir entre secuencia, decisión y repetición.
5. Construir una representación gráfica correcta.
6. Observar la ejecución paso a paso.
7. Entender qué ocurre con las variables y por qué cambian.
8. Predecir resultados, detectar errores y corregirlos.
9. Probar la solución con datos normales, límites y casos especiales.
10. Resolver problemas nuevos usando los mismos conceptos.

## 1.1 Alcance pedagógico cerrado

La plataforma debe enseñar exclusivamente los conceptos que aparecen en el HTML original y sus aplicaciones directas:

- Inicio y fin.
- Entrada y salida de datos.
- Variables, valores y asignación.
- Operaciones aritméticas básicas y uso de paréntesis.
- Secuencia de instrucciones.
- Comparaciones y condiciones.
- Operadores lógicos Y, O y NO, cuando se empleen en las expresiones ya soportadas.
- Decisiones Si, Si/Sino, anidadas y compuestas.
- Los tres bucles: **Para, Mientras y Hacer–Mientras**.
- Contadores y acumuladores.
- Validación de datos.
- Centinelas y condiciones de parada.
- Ciclos anidados.
- Máximos, mínimos, posiciones, promedios y series numéricas construidas con esos elementos.
- Senapsisdo de ejecución, seguimiento de variables, resultados y análisis de errores.

**No enseñar ni usar como objetivo de aprendizaje:** arreglos, listas, matrices como estructuras de datos, funciones, procedimientos, recursividad, búsqueda binaria, algoritmos de ordenamiento, objetos, clases, programación orientada a objetos, archivos, bases de datos, redes ni otros temas ajenos al archivo.

El código interno de la aplicación sí puede utilizar arrays, objetos, clases o funciones de JavaScript para implementar la interfaz. Eso no autoriza a convertirlos en contenidos ni requisitos de los ejercicios.

No introducir operadores de programación nuevos —por ejemplo, módulo `%`, división entera como operador especial u operadores no presentes en el pseudocódigo original— sin ampliar y explicar primero el alcance con autorización. Para generar pares o múltiplos, se puede avanzar de dos en dos o de K en K, como ya hace el material.

La dificultad debe crecer mediante la combinación y el dominio de estos conceptos, no mediante la incorporación de nuevos temas.

---

# 2. Auditoría del prototipo: qué se conserva y qué se supera

El HTML original es una aplicación autocontenida con HTML, CSS y JavaScript. Incluye un intérprete propio de pseudocódigo, construcción dinámica de SVG, registro de eventos de ejecución y sincronización de distintas vistas. Su valor no está solo en el aspecto: tiene una experiencia de simulación que debe preservarse.

## 2.1 Inventario obligatorio de funciones que no se pueden perder

| Elemento del prototipo | Decisión de rediseño |
|---|---|
| Selector numerado de ejercicios y colores por nivel | Conservar, ampliar de 30 a 40 y mejorar navegación. |
| Varias soluciones dentro de un ejercicio | Conservar; comparar métodos reales y correctos. |
| Pantalla de presentación antes de revelar | Conservar y mejorar como modo reto. |
| Enunciado, utilidad e idea clave | Conservar y completar con análisis de entradas, proceso y salidas. |
| Diagrama SVG generado dinámicamente | Conservar y mejorar geometría, conectores y legibilidad. |
| Flechas, bifurcaciones y etiquetas V/F | Conservar; validar que correspondan a la lógica ejecutada. |
| Resaltado y recorrido animado del algoritmo | Conservar y mejorar. |
| Cámara automática que sigue el paso | Conservar; sumar ajuste al diagrama completo, zoom y desplazamiento manual. |
| Inicio, pausa, paso atrás, paso adelante y final | Conservar. |
| Selector de velocidad | Conservar y añadir control de animaciones secundarias. |
| Línea de tiempo | Conservar, hacer clicable y sincronizada. |
| Pseudocódigo resaltado por paso | Conservar. |
| Datos de entrada editables y restauración de ejemplo | Conservar y validar con mensajes útiles. |
| Escena “En escena” | Conservar como panel protagonista y rehacer sus visualizaciones. |
| Variables actuales | Conservar y mejorar. |
| Historial de cada variable | Conservar, ampliar y permitir inspeccionar cambios. |
| Explicación del paso actual | Conservar, separar explicación sencilla y explicación técnica. |
| Desglose de operaciones y condiciones | Conservar y hacer más visible. |
| Contador de vueltas de ciclos y ciclos anidados | Conservar y mejorar. |
| Predicción antes de revelar un paso | Conservar, mejorar retroalimentación y evitar tapar el diagrama. |
| Tabla de seguimiento | Conservar y hacer legible en secuencias largas. |
| Ordenar instrucciones | Conservar. |
| Identificar el símbolo de cada instrucción | Conservar como actividad distinta del constructor libre. |
| Comparación y detección de errores | Conservar y aplicar a todo ejercicio donde sea pertinente. |
| “¿Y si…?” para cambiar condiciones e instrucciones | Conservar; mostrar consecuencias con una explicación causal. |
| Opción de revelar la solución | Conservar como ayuda voluntaria. |
| Ajuste del tamaño del texto | Conservar. |
| Pantalla completa | Conservar. |
| Tema oscuro y claro | Conservar y perfeccionar contraste. |
| Adaptación a pantallas pequeñas | Conservar y rediseñar. |
| `prefers-reduced-motion` | Conservar y completar con un control explícito de animaciones. |

**Criterio:** ninguna funcionalidad se considera sustituida por el mero hecho de que exista una pantalla nueva. Debe haber equivalencia funcional comprobada.

## 2.2 Problemas observables en las capturas que deben resolverse

Las capturas sirven como referencia del nivel de detalle que debe superarse, no como plantilla que se debe copiar.

### Pantalla de reto inicial

Conservar:
- Fondo de trabajo con cuadrícula.
- Selector de ejercicios.
- Tarjeta central con nivel, título, enunciado y datos de ejemplo.
- Invitación a intentar resolver antes de mostrar.
- Modo presentación.

Mejorar:
- Añadir objetivos y conceptos que se practican sin revelar la solución.
- Permitir elegir “intentar”, “ver una pista” o “revelar explicación”, sin obligar a una única ruta.
- Asegurar que el selector de 40 ejercicios sea usable en tabletas y móviles; no comprimir 40 botones hasta hacerlos ilegibles.
- Mostrar progreso por nivel y estado de cada reto, sin convertirlo en gamificación vacía.

### Simulador principal

Conservar el esquema conceptual de tres áreas:
- Izquierda: problema, explicación, método, pseudocódigo y datos.
- Centro: diagrama grande y navegable.
- Derecha: “En escena”, variables, historial y resultados.
- Abajo: explicación del paso y controles de ejecución.

Mejorar:
- El diagrama no debe quedar cortado por paneles ni por la barra inferior.
- La ventana de predicción no debe ocultar nodos importantes; usar una tarjeta anclada fuera del recorrido o una banda de pregunta en el dock.
- Debe existir ajuste automático al diagrama completo, zoom, desplazamiento, centrar paso actual y volver a cámara automática.
- Los paneles laterales deben poder contraerse, redimensionarse o convertirse en pestañas si falta espacio.
- Las explicaciones no deben competir con el nodo activo: ubicar cada explicación cerca de la vista que la necesita.
- En tabletas horizontales, mantener visibles diagrama, “En escena” y variables siempre que el espacio lo permita.

### Laboratorio abierto sobre el diagrama

Conservar:
- La actividad actual abierta mientras el diagrama sigue visible.
- Tabla o reto en un panel lateral.
- “En escena” y variables disponibles durante la actividad.
- Controles de ejecución y contexto del ejercicio.

Mejorar:
- El panel del laboratorio no debe bloquear conexiones ni ocultar la zona relevante del diagrama.
- Tabla de seguimiento con encabezados fijos, desplazamiento interno y foco en la fila actual.
- Diferenciar con claridad valor anterior, valor actual y fila/iteración.
- Permitir cambiar entre actividad y explicación sin perder el progreso.
- Mantener el ancho de columnas y el texto legibles en pantallas pequeñas.

---

# 3. Principio didáctico y visual obligatorio

La animación no es decoración ni un premio estético. **Es parte del método de explicación.** Las ilustraciones, luces, movimientos, cambios de estado, diagramas y visualizaciones deben revelar qué está ocurriendo en el algoritmo.

Cada concepto importante debe explicarse mediante tres capas conectadas:

1. **Intuitiva:** palabras sencillas y una analogía breve cuando ayude.
2. **Visual:** animación o visualización del fenómeno exacto.
3. **Técnica:** nombre correcto, regla, símbolo, expresión y comportamiento formal.

No simplificar hasta volver incorrecta la explicación técnica. No introducir una analogía como si fuera la definición formal.

## 3.1 Ejemplo: variables y asignación

- Intuitivo: una variable se puede imaginar como un recipiente identificado por un nombre cuyo contenido puede cambiar.
- Visual: el recipiente aparece, recibe un valor, conserva el anterior durante el cambio y muestra el nuevo valor.
- Técnico: explicar variable, valor, asignación y diferencia entre asignar y comparar.
- Sincronización: resaltar la instrucción `S = S + 5`, mostrar `10 + 5 = 15` y actualizar el panel de variables en el mismo instante lógico.

La analogía del recipiente es un recurso para entender, no una descripción literal de cómo cada lenguaje implementa memoria.

## 3.2 Ejemplo: Mientras

La animación debe mostrar:
1. Llegada al rombo de condición.
2. Lectura de los valores usados en la condición.
3. Evaluación visible de la expresión.
4. Resultado V o F.
5. Si es V, recorrido por el cuerpo.
6. Cambio de variable o instrucción correspondiente.
7. Retorno al rombo.
8. Nueva evaluación.
9. Si es F, salida del ciclo.

Después, mostrar una explicación intuitiva y otra técnica de por qué `Mientras` puede ejecutar cero veces.

## 3.3 Ejemplo: Hacer–Mientras

Mostrar primero la entrada al cuerpo y solo después la evaluación de la condición. La diferencia de orden con Mientras debe verse y compararse con los mismos datos. Explicar que el cuerpo se ejecuta al menos una vez.

## 3.4 Sistema de animación por eventos

Cada paso de ejecución debe generar información suficiente para animar y explicar lo ocurrido. Como mínimo:

- Inicio o fin.
- Lectura de dato.
- Asignación o nacimiento de variable.
- Operación aritmética.
- Evaluación de decisión.
- Inicio/preparación de Para.
- Evaluación de condición de Para o Mientras.
- Entrada al cuerpo de un ciclo.
- Avance de contador.
- Retorno al punto de control del ciclo.
- Evaluación final de Hacer–Mientras.
- Salida del ciclo.
- Impresión o salida de dato.
- Error o dato faltante.

El motor de ejecución será la única fuente de verdad. Las animaciones no deben inventar un estado distinto al que realmente produce el algoritmo.

Cada evento debe permitir obtener:
- Paso y línea de pseudocódigo.
- Nodo del diagrama relacionado.
- Tipo de evento.
- Valores de variables antes y después.
- Expresión evaluada y resultado, cuando corresponda.
- Camino elegido V/F.
- Identificador de vuelta y nivel de anidación.
- Contenido de salida en pantalla.
- Explicación sencilla.
- Explicación técnica.

## 3.5 Calidad visual de las animaciones

- Movimiento fluido y con intención didáctica.
- La luz o halo debe señalar el elemento activo, no decorar toda la pantalla.
- Flechas activas deben destacar el camino real.
- Los cambios de variable deben tener transición visible, con valor anterior y nuevo.
- Las decisiones deben mostrar expresión, valores sustituidos y resultado.
- Los ciclos deben hacer visible el retorno; distinguir vuelta exterior e interior.
- Las salidas deben aparecer en la pantalla con una transición comprensible.
- No llenar el lienzo de tarjetas flotantes.
- Evitar destellos rápidos, efectos que distraigan y movimiento permanente sin propósito.
- Permitir pausar, avanzar manualmente, repetir una escena y desactivar animaciones no esenciales.
- Respetar `prefers-reduced-motion`.

Toda animación automática prolongada debe poder pausarse, detenerse u ocultarse; las animaciones activadas por interacción deben poder reducirse o desactivarse cuando no sean imprescindibles. Consultar WCAG 2.2, criterios 2.2.2 y 2.3.3: https://www.w3.org/TR/WCAG22/.

## 3.6 Fundamento de diseño multimedia

Mantener próximos el texto y el elemento visual al que se refieren; sincronizar narración, texto y animación; resaltar información esencial; evitar adornos que no aportan; segmentar procesos largos en pasos. Estas decisiones se alinean con principios de coherencia, señalización, contigüidad espacial y temporal descritos en la investigación sobre aprendizaje multimedia: https://doi.org/10.1017/9781108894333.019.

---

# 4. Arquitectura de ventanas y disposición definitiva

Las ventanas no son una lista de elementos prescindibles. Se conserva todo lo que ofrece el prototipo y se da jerarquía a cada panel.

## 4.1 Ventanas permanentes del simulador

### A. Diagrama de flujo — área central

Es el objeto principal de trabajo.
- SVG nítido, conectores correctos y formas reconocibles.
- Zoom, desplazamiento, centrar y ajustar a todo el diagrama.
- Resaltado del nodo activo, trazo del recorrido y etiquetas V/F.
- Cámara automática activable/desactivable.
- Al cambiar el paso, el nodo correspondiente debe quedar localizable sin saltos bruscos.
- Los paneles nunca deben tapar permanentemente una parte necesaria del diagrama.

### B. “En escena” — panel protagonista

Debe permanecer visible en escritorio y tener prioridad en tabletas.
- Visualización específica para entrada, asignación, cálculo, decisión, Para, Mientras, Hacer–Mientras y salida.
- No usar siempre una tarjeta genérica con texto: escoger una representación acorde al evento.
- Mantener un texto corto que explique qué sucede ahora.
- Mostrar el símbolo relacionado y su nombre.
- Mostrar vueltas y anidación si se está dentro de ciclos.
- Permitir repetir la animación del evento actual.

### C. “Variables” — panel protagonista

Debe permanecer visible junto a “En escena” en escritorio.
- Estado actual de todas las variables.
- Resaltar la variable que acaba de cambiar.
- Mostrar valor anterior → valor nuevo.
- Mostrar la instrucción responsable.
- Explicar por qué cambia y qué papel cumple (por ejemplo, contador o acumulador), sin asignar etiquetas falsas.
- Permitir inspeccionar el historial de una variable.
- Permitir consultar la tabla completa de seguimiento.

### D. Historial y tabla de seguimiento

- Mostrar cambios por paso y por vuelta.
- Mantener un valor por celda y encabezados claros.
- Fila actual resaltada.
- Distinguir primera asignación, modificación y valor sin cambio.
- Soportar cientos de iteraciones sin volver ilegible la ventana; usar scroll interno, encabezado fijo y enfoque en la fila activa.
- Retroceder en la línea de tiempo debe actualizar la tabla al estado histórico correcto.

### E. Panel de problema y pseudocódigo

Debe incluir:
- Número, nivel, título y enunciado.
- Para qué sirve el problema.
- Concepto clave.
- Análisis de entradas, proceso y salidas.
- Restricciones y datos permitidos.
- Selector de método cuando haya más de una resolución.
- Pseudocódigo sincronizado.
- Datos editables y restauración de ejemplo.

El estudiante puede contraer este panel cuando necesite ampliar el diagrama.

### F. Pantalla de salida

- Conservar la consola de resultados.
- Mostrar cada salida en su orden.
- Resaltar el resultado recién producido.
- Permitir revisar salidas anteriores.
- Diferenciar un resultado vacío de un error o de la ausencia de impresión.

### G. Barra inferior de ejecución

- Inicio, atrás, reproducir/pausar, adelante y final.
- Velocidad.
- Línea de tiempo con paso actual y total.
- Explicación corta del evento actual.
- Control de cámara automática y animaciones cuando corresponda.
- No debe cubrir nodos ni paneles importantes; reservar su espacio en el layout.

### H. Ventana flotante contextual

Conservar su capacidad para llamar la atención sobre un cambio o una condición, pero:
- Posicionarla cerca del nodo sin tapar rutas.
- Si no hay lugar, mostrarla en el dock o panel de escena.
- Poder minimizarla.
- No duplicar texto ya visible sin una razón didáctica.

### I. Pantalla inicial o “gate”

Conservar su concepto: presentación del problema antes de mostrar la respuesta.
- Fondo visual sutil.
- Título, nivel, enunciado y datos de ejemplo.
- Preguntas para que el estudiante piense entradas, proceso, salida, decisión o repetición.
- Botón de intentar/revelar y modo presentación.
- Opción de pista progresiva.

## 4.2 Organización por tamaños

### Escritorio ancho
- Columna izquierda: problema, método, pseudocódigo y datos.
- Centro: lienzo grande del diagrama.
- Columna derecha: “En escena” arriba y “Variables” abajo, con historial y salida accesibles.
- Dock inferior: explicación del evento y controles.
- Los paneles laterales pueden cambiar de ancho y contraerse.

### Tableta horizontal
- Mantener diagrama central amplio.
- “En escena” y “Variables” visibles en una columna derecha compacta.
- Problema/pseudocódigo en un panel izquierdo contraíble.
- Laboratorio desplegable sin tapar las vistas protagonistas.
- Barra inferior en una o dos filas según anchura.

### Móvil o tableta vertical
- No intentar comprimir tres columnas.
- Navegación por vistas o pestañas: Diagrama, En escena, Variables, Problema y Laboratorio.
- El estado y paso seleccionado se conservan al cambiar de vista.
- La línea de tiempo y los controles deben ser táctiles y legibles.

## 4.3 Dirección visual

No copiar el prototipo píxel por píxel. Usarlo como estándar mínimo de riqueza funcional.

Dirección propuesta:
- Interfaz técnica, pulida, contemporánea y ordenada.
- Lienzo con cuadrícula discreta, contrastada pero no invasiva.
- Jerarquía tipográfica clara; títulos y explicación legibles.
- Colores semánticos consistentes para ejecución, decisión verdadera/falsa, cambio de variable, advertencia y error.
- Resplandor aplicado al paso activo, no como decoración general.
- Tarjetas y paneles con profundidad sutil.
- Espacio negativo suficiente.
- Diagramas con tamaño de letra cómodo y líneas que no atraviesen textos.
- Transiciones que ayuden a seguir la atención.
- Tema claro/oscuro y contraste comprobable.

El criterio es que la interfaz sea visualmente superior por claridad, composición, precisión y calidad de animación, no por acumular más efectos.

---

# 5. Los cinco espacios de la plataforma

1. **Aprende:** lecciones visuales e interactivas de los conceptos permitidos.
2. **Ejercicios:** catálogo progresivo de 40 problemas.
3. **Simulador:** ejecución animada sincronizada del pseudocódigo y diagrama.
4. **Laboratorio:** predicción, tabla, ordenar, identificar símbolo, detectar errores y “¿Y si…?”.
5. **Constructor:** lienzo gráfico para crear un diagrama completo con los símbolos y estructuras ya enseñados.

“Aprende”, “Ejercicios”, “Simulador”, “Laboratorio” y “Constructor” son secciones de la experiencia, no cinco temas adicionales.

## 5.1 Aprende

Lecciones cortas y secuenciales:
- Qué es un algoritmo y qué representa un diagrama.
- Cómo seguir flechas y leer un flujo.
- Inicio y fin.
- Entrada, salida y proceso.
- Variables y asignación.
- Operaciones y paréntesis.
- Decisiones Si y Si/Sino.
- Condiciones anidadas y compuestas.
- Contadores y acumuladores.
- Ciclo Para.
- Ciclo Mientras.
- Ciclo Hacer–Mientras.
- Ciclos anidados.
- Validación y centinelas.

Cada lección: objetivo, explicación sencilla, definición técnica, ilustración animada, ejemplo guiado, manipulación de datos y comprobación breve.

## 5.2 Ejercicios

Cada ejercicio tiene:
- Enunciado.
- Objetivo de aprendizaje.
- Conceptos que practica.
- Entradas, salidas y restricciones.
- Análisis del problema.
- Método 1 y método 2 cuando sean diferentes y correctos.
- Pseudocódigo y diagrama por método.
- Datos de ejemplo.
- Casos de prueba normales, límite y especiales.
- Errores frecuentes y explicación.

## 5.3 Simulador

Todas las ventanas descritas en la sección 4.1 conectadas al mismo estado y secuencia de eventos.

## 5.4 Laboratorio

Conservar y mejorar las actividades del original:
- Predice el siguiente paso.
- Tabla de seguimiento.
- Ordena instrucciones.
- Identifica la figura adecuada para cada instrucción.
- Encuentra el error.
- “¿Y si…?” para cambiar un valor, condición o instrucción y observar el efecto.

La actividad “Construye” existente (identificar símbolo por línea) se mantiene. Es diferente del constructor completo.

## 5.5 Constructor completo

El estudiante construye un diagrama completo, no solo asigna símbolos a líneas de pseudocódigo.
- Colocar Inicio y Fin.
- Colocar Entrada, Salida y Proceso.
- Colocar Decisión con salidas etiquetadas V/F.
- Construir Para, Mientras y Hacer–Mientras usando la representación didáctica explícitamente explicada.
- Conectar nodos mediante flechas.
- Mover, editar y eliminar elementos.
- Validar conexiones, caminos y cierre del flujo.
- Ejecutar el diagrama si es válido.
- Mostrar errores con ubicación y orientación para corregir.

No se permite que el constructor invente una sintaxis distinta a la que entiende el simulador.

---

# 6. Catálogo definitivo de 40 ejercicios

El catálogo debe contener exactamente 20 básicos, 10 intermedios y 10 avanzados. Se preservan los problemas del HTML original, se corrigen y se reorganizan. Los ejercicios nuevos solo combinan conceptos permitidos.

## 6.1 Básicos — 20

| N.º | Ejercicio | Conceptos | Métodos posibles |
|---:|---|---|---|
| 1 | Suma de dos números | Entrada, asignación, suma y salida | Suma directa; guardar resultado en variable intermedia. |
| 2 | Resta de dos números | Entrada, operación y salida | Resta directa; cálculo por etapas. |
| 3 | Área y perímetro de un rectángulo | Variables, multiplicación, suma | Fórmulas directas; operaciones auxiliares separadas. |
| 4 | Promedio de tres notas | Suma, división y paréntesis | Fórmula directa; acumulación mediante Para. |
| 5 | Mayor de dos números | Decisión Si/Sino | Comparación directa; variable que conserva el mayor. |
| 6 | Clasificar número: positivo, negativo o cero | Decisiones anidadas | Rombos anidados; condiciones excluyentes ordenadas. |
| 7 | Aprobar o reprobar una nota | Comparación y decisión | Preguntar por aprobación; preguntar por reprobación. |
| 8 | Mayor de tres números | Comparaciones múltiples | Variable campeona; decisiones anidadas/compuestas. |
| 9 | Aplicar descuento según importe de compra | Rangos y condiciones | Decisiones anidadas; condiciones ordenadas por umbral. |
| 10 | Contar de 1 hasta N | Para y Mientras | Para; Mientras. Hacer–Mientras solo con N≥1 explícito. |
| 11 | Cuenta regresiva desde N hasta 1 | Decremento y condición | Para; Mientras. Definir qué sucede si N≤0. |
| 12 | Tabla de multiplicar de un número | Ciclo y operación | Para; Mientras. |
| 13 | Mostrar pares desde 2 hasta N | Avance de 2 en 2 | Para con avance de dos; Mientras con avance de dos. |
| 14 | Sumar los números de 1 hasta N | Acumulador | Para; Mientras. |
| 15 | Sumar los números pares hasta N | Acumulación y avance | Para avanzando de dos en dos; Mientras avanzando de dos en dos. |
| 16 | Contar múltiplos de 3 hasta N | Contador y avance | Avanzar de tres en tres; Mientras avanzando de tres en tres. |
| 17 | Contar positivos y negativos en cinco datos | Dos contadores y decisión | Para; Mientras. El cero no incrementa ninguno. |
| 18 | Calcular promedio de cinco números | Acumulador y contador | Para; Mientras. |
| 19 | Validar una nota entre 0 y 5 | Condición compuesta y repetición | Hacer–Mientras; Mientras con lectura inicial y repetición. |
| 20 | Sumar números hasta que el usuario escriba cero | Centinela y condición de parada | Mientras; Hacer–Mientras. El centinela no se contabiliza como dato. |

## 6.2 Intermedios — 10

| N.º | Ejercicio | Conceptos | Métodos posibles |
|---:|---|---|---|
| 21 | Factorial de un número | Acumulador de producto y ciclo | Para; Mientras. Dominio: entero no negativo; 0!=1. |
| 22 | Potencia con exponente entero no negativo | Multiplicación repetida y decisión de exponente cero | Para; Mientras. Validar el dominio. |
| 23 | Fibonacci: términos que no superen 40 | Actualización ordenada de variables y ciclo | Mientras; Hacer–Mientras con condición y salida correctamente ubicadas. Debe imprimir 0,1,1,2,3,5,8,13,21,34; nunca 55. |
| 24 | Encontrar el mayor de diez números | Inicialización y comparación repetida | Para; Mientras. Inicializar máximo con el primer dato, no con cero. |
| 25 | Adivinar el número 7 y contar intentos | Centinela, decisión y contador | Hacer–Mientras; Mientras con primera lectura previa. |
| 26 | Encontrar el mayor y su posición entre cinco datos | Variables relacionadas y actualización conjunta | Para; Mientras. Política de empate explícita: conservar primera posición. |
| 27 | Encontrar mayor y menor de cinco datos | Dos valores de referencia y decisiones | Para; Mientras. Inicializar con el primer dato. |
| 28 | Promedio de cinco materias, seis notas cada una | Ciclos anidados y reinicio de acumulador | Para anidado; Mientras anidado. |
| 29 | Contar datos hasta que aparezca el primer negativo | Centinela, contador y decisión | Mientras; Hacer–Mientras con el centinela excluido de la cuenta. |
| 30 | Validar número entre 1 y 10 y mostrar tabla del 1 al 5 | Validación seguida de ciclo | Hacer–Mientras + Para; Mientras + Para. |

## 6.3 Avanzados — 10

| N.º | Ejercicio | Conceptos | Métodos posibles |
|---:|---|---|---|
| 31 | Promedio general de cinco materias con seis notas cada una | Ciclos anidados, acumuladores por grupo y global | Sumar treinta notas y dividir por treinta; promediar los cinco promedios. Justificar equivalencia porque los grupos tienen igual tamaño. |
| 32 | Cuadrícula de multiplicación de tres filas por tres columnas | Ciclos anidados | Para anidado; Mientras anidado. |
| 33 | Ahorrar hasta alcanzar una meta | Acumulador, contador y ciclo condicionado | Mientras; Hacer–Mientras con meta positiva y validada. |
| 34 | Encontrar mayor, menor y posiciones entre N datos | Seguimiento de varios valores y posiciones | Para; Mientras. Inicializar con primer dato; definir empate. |
| 35 | Sumar valores positivos, calcular su promedio y contar negativos y ceros en N datos | Condiciones, contadores y acumuladores | Para; Mientras. Controlar el caso sin positivos. |
| 36 | Analizar N notas: promedio, aprobadas, reprobadas y nota más alta | Varias variables y decisiones dentro de ciclo | Para; Mientras. Umbral de aprobación definido en el enunciado. |
| 37 | Leer hasta cero y calcular suma, cantidad, promedio, positivos y negativos | Centinela, varios contadores y acumuladores | Mientras; Hacer–Mientras. Si el primer dato es cero, definir resultado sin división entre cero. |
| 38 | Generar tablas de multiplicar desde 1 hasta N | Dos ciclos anidados y operaciones | Para anidado; Mientras anidado. |
| 39 | Analizar cinco materias con seis notas: promedio por materia, promedio general y conteo de aprobadas/reprobadas | Ciclos anidados, reinicio local y acumulador global | Para anidado; Mientras anidado. Procesar datos al leerlos; no almacenar arreglos ni matrices. |
| 40 | Comparar N valores con un valor de referencia: contar mayores, menores e iguales y sumar los mayores | Condición múltiple, contadores y acumulador | Para; Mientras. |

**Regla de métodos alternativos:** dos métodos son válidos cuando ambos resuelven el mismo enunciado, con iguales entradas, restricciones y resultados. Cambiar nombres de variables no constituye un segundo método. No fabricar una segunda solución solo para cumplir una cuota; explicar por qué una alternativa no aporta valor y proponer otra actividad de comparación.

---

# 7. Validación de contenido y algoritmos

## 7.1 Ficha de validación obligatoria por ejercicio

Cada ejercicio debe declarar:
- Entradas y tipo de dato.
- Restricciones y precondiciones.
- Proceso esperado.
- Salidas y formato.
- Resultado(s) esperado(s) para cada prueba.
- Casos límite.
- Casos inválidos o fuera del dominio.
- Motivo de terminación de cada ciclo.

## 7.2 Pruebas mínimas

Para cada algoritmo probar como mínimo:
- Caso normal.
- Caso de límite inferior.
- Caso de límite superior.
- Valor repetido o empate cuando corresponda.
- Entradas negativas cuando el dominio las permita.
- Entradas fuera del dominio.
- Caso de ciclo con cero iteraciones cuando sea posible.
- Caso de Hacer–Mientras que confirme la ejecución inicial obligatoria.
- Caso de centinela en primer lugar.
- Caso que confirme que todos los ciclos terminan.

Las soluciones se comparan con resultados esperados definidos independientemente. No utilizar una solución como única autoridad para validar la otra.

## 7.3 Correcciones conocidas del prototipo

- Fibonacci debe imprimir solo los términos hasta 40. No imprimir 55. Ambas versiones deben generar exactamente la misma secuencia requerida.
- Máximo de diez valores y máximo/posición deben inicializarse con el primer dato, no con cero, para admitir todos los valores negativos.
- Factorial: 0! = 1; negativos fuera del dominio.
- Potencia: exponente cero produce 1; el ejercicio limita a exponentes enteros no negativos.
- `Para`, `Mientras` y `Hacer–Mientras` no son intercambiables sin precondiciones idénticas. Si Hacer–Mientras ejecutaría indebidamente una iteración, hay que validar o usar otro método.
- Meta de ahorro: validar meta positiva y controlar si ya se alcanzó antes de exigir un depósito.
- Entradas inválidas o insuficientes deben generar un mensaje claro, no convertirse silenciosamente en cero ni desaparecer.
- Los ciclos no terminantes deben detenerse con un error pedagógico identificable, mostrando la variable/condición implicada. El límite de protección no es una salida válida.
- Los promedios no deben dividir entre cero. Declarar el resultado cuando no haya datos que promediar.
- Las políticas de empate deben ser explícitas.

## 7.4 Simbología y fuentes

Contrastar nombres, formas y convenciones con ISO 5807:1985: https://www.iso.org/standard/11955.html. La página oficial consultada indica que la norma fue revisada y confirmada en 2019 y continúa vigente. No llamar “normativo” a un símbolo simplificado sin verificarlo.

En el material didáctico distinguir:
- símbolo para datos/entrada-salida;
- proceso;
- decisión;
- terminal;
- conectores y flechas;
- documento y visualización en pantalla, si se enseñan como símbolos distintos;
- representación compacta didáctica del ciclo Para frente a la representación del flujo mediante condición, cuerpo y retorno.

Explicar que las decisiones del material pueden representarse con caminos V/F; si se muestran selecciones múltiples, indicar expresamente sus salidas.

---

# 8. Requisitos técnicos y de calidad

## 8.1 Arquitectura sugerida

Preferir JavaScript nativo y módulos ES, sin frameworks o dependencias innecesarias. La aplicación debe publicarse como sitio estático y funcionar en GitHub Pages.

Estructura sugerida (puede ajustarse después de inspeccionar el repositorio):

```text
/
  index.html
  README.md
  assets/
    illustrations/
    icons/
  src/
    app.js
    styles/
      tokens.css
      layout.css
      components.css
      motion.css
      responsive.css
    content/
      lessons.js
      exercises.js
    core/
      tokenizer.js
      expression-parser.js
      pseudocode-parser.js
      validator.js
      interpreter.js
      trace.js
    diagram/
      layout.js
      renderer.js
      connectors.js
    ui/
      navigation.js
      exercise-view.js
      scene-view.js
      variables-view.js
      history-view.js
      playback.js
      lab.js
      builder.js
  tests/
    expressions.test.js
    parser.test.js
    execution.test.js
    exercises.test.js
    regression.test.js
```

Esta estructura es una guía, no una obligación de crear archivos vacíos. Cada archivo debe tener una responsabilidad real.

## 8.2 Motor e integridad

El diagrama, pseudocódigo, “En escena”, variables, historial, tabla y salida deben derivarse de la misma ejecución.

- No mantener varias implementaciones del mismo algoritmo para distintas ventanas.
- Usar un formato de eventos/traza común.
- El avance y retroceso deben reconstruir el estado exacto.
- Cambiar datos o método reinicia de manera consistente la ejecución.
- Validar sintaxis y estructura antes de ejecutar.
- Mostrar error con línea/instrucción cuando sea posible.
- No utilizar `eval` ni `new Function` para ejecutar texto libre de pseudocódigo. Implementar un parser limitado a la gramática aprobada.
- Limitar pasos de ejecución para evitar bloqueos, identificando la causa y sin presentar el límite como resultado del programa.

## 8.3 Calidad de diagramas

- Todos los nodos deben caber en el lienzo virtual.
- Las etiquetas no se deben superponer con nodos, conectores o flechas.
- Las ramas V/F deben ser inequívocas.
- Los retornos de ciclo deben ser legibles y no cruzar texto.
- Los ciclos anidados deben mostrar claramente qué cuerpo pertenece a cada ciclo.
- Mantener una distancia uniforme entre símbolos.
- Ajustar automáticamente el encuadre sin deformar el SVG.
- El zoom debe conservar calidad vectorial.
- El paso activo se identifica con luz/halo y trazo de ruta, pero el resto del diagrama continúa visible.

## 8.4 Accesibilidad

- Contraste suficiente en tema claro y oscuro.
- Teclado utilizable en navegación, controles, laboratorio y constructor.
- Estados no comunicados exclusivamente por color.
- Botones con etiquetas accesibles.
- Animaciones pausables y opción de reducir movimiento.
- Respetar `prefers-reduced-motion`.
- Foco visible.
- Textos ampliables.

## 8.5 Pruebas y entrega

- Pruebas automatizadas de parser, intérprete y catálogo.
- Pruebas visuales/manuales en escritorio, tableta horizontal y móvil.
- Comprobar que no haya errores de consola.
- Probar cada uno de los 40 ejercicios y todos sus métodos.
- Comprobar retroceso, avance, velocidad, cámara y cambio de datos.
- Comprobar cada ventana del laboratorio.
- Construir un diagrama desde cero y ejecutarlo.
- README con instrucciones de ejecución y publicación.
- Cada módulo termina con commit descriptivo y resumen de cambios.

---

# 9. Implementación en cinco módulos y prompts independientes

**Regla general para cada prompt:** el usuario proporcionará siempre los mismos dos archivos: (1) `diagramas_de_flujo.html`, el prototipo original, y (2) este documento maestro V5. Además, indicará únicamente qué módulo debe ejecutarse. El agente debe poder retomar el trabajo sin depender de ninguna conversación anterior.

La fuente de verdad se divide así:
- **HTML original adjunto:** referencia inmutable para auditar las funciones, comportamiento y contenido que deben conservarse o superarse. No es el punto desde el que se debe sobrescribir el trabajo ya implementado.
- **Documento maestro V5 adjunto:** especificación pedagógica, visual, técnica y de aceptación. Sus reglas prevalecen sobre supuestos del agente.
- **Repositorio GitHub `Santiillana/Diagramas-de-flujo-`:** fuente de verdad del estado de implementación, módulos terminados, código, decisiones y commits. Antes de cada módulo hay que inspeccionarlo desde cero.

No depender de memoria de chat, mensajes previos ni de que sea la misma cuenta/modelo. El historial de implementación debe quedar escrito en el repositorio y actualizado al terminar cada módulo.

Cada módulo debe producir un estado ejecutable, tener pruebas, hacer commits y entregar un informe con archivos modificados, pruebas realizadas, limitaciones y siguiente etapa. No avanzar automáticamente a la siguiente etapa.

## MÓDULO 1 — Auditoría, arquitectura y experiencia visual

### Objetivo

Establecer una base sólida y una experiencia visual superior, preservando desde el inicio las vistas y funciones del prototipo. No llenar todavía las pantallas con contenido nuevo no verificado.

### Prompt 1

> Trabaja en el repositorio GitHub `Santiillana/Diagramas-de-flujo-`.
>
> Tu tarea es ejecutar el MÓDULO 1 de `Propuesta_redisenio_diagramas_de_flujo_v5.md` (o de este documento, si se te proporciona como archivo adjunto).
>
> **Primero audita:** lee el repositorio completo, identifica rama predeterminada, estado de commits y estructura. Encuentra y lee el HTML de referencia adjunto o existente. Compara funciones presentes contra la sección 2.1. No supongas que el repositorio está vacío: verifica su estado real.
>
> **Alcance del módulo:**
> 1. Crear arquitectura modular con HTML, CSS y JavaScript nativo, compatible con GitHub Pages.
> 2. Definir tokens visuales, tipografía, escala, colores semánticos, superficies, estados y reglas de animación.
> 3. Diseñar navegación de cinco espacios: Aprende, Ejercicios, Simulador, Laboratorio y Constructor.
> 4. Diseñar la pantalla inicial/reto.
> 5. Diseñar el espacio de simulación: problema/pseudocódigo a la izquierda, diagrama central, “En escena” y “Variables” a la derecha, dock inferior.
> 6. Diseñar el laboratorio abierto sin tapar las vistas protagonistas.
> 7. Hacer responsivo para escritorio, tableta horizontal y móvil.
> 8. Conservar en la arquitectura la capacidad de todas las funciones del inventario original.
>
> **Dirección de diseño:** no copies las capturas literalmente. Supéralas en jerarquía, espacio, legibilidad, navegación, equilibrio y acabado. Conserva la cuadrícula discreta, el carácter técnico, la tarjeta de reto, el diagrama dominante, la escena explicativa y el inspector de variables. Evita paneles que corten el diagrama y ventanas flotantes que cubran nodos.
>
> **Animaciones:** define el sistema visual y los estados de movimiento desde ahora. El brillo debe señalar el paso real; no uses efectos decorativos. Implementa control de movimiento y reducción de movimiento.
>
> **No hagas todavía:** inventar ejercicios, agregar conceptos fuera del alcance, ni crear un motor de ejecución simulado que no comparta estado real. Si el HTML original puede conservarse funcional durante la transición, no lo elimines antes de tener equivalentes comprobados.
>
> **Aceptación del módulo:**
> - La aplicación arranca y navega sin errores.
> - Las cinco secciones tienen estructura clara.
> - El espacio de simulación conserva todas las zonas necesarias.
> - “En escena” y “Variables” tienen presencia prioritaria.
> - El diagrama dispone de espacio propio y no queda tapado por el dock.
> - Las vistas se adaptan a los tres tamaños previstos.
> - No se perdió ninguna función del inventario sin una equivalencia documentada.
> - README explica cómo ejecutar y publicar.
>
> Ejecuta pruebas, realiza commit con un mensaje claro y entrega un informe. Detente después del Módulo 1.

## MÓDULO 2 — Aprende y catálogo validado de 40 ejercicios

### Objetivo

Construir el contenido didáctico y los datos de los ejercicios con progresión real. No implementar todavía el constructor ni cambiar la gramática del motor sin necesidad.

### Prompt 2

> Continúa el repositorio en el estado que dejó el Módulo 1. Ejecuta exclusivamente el MÓDULO 2 de este documento.
>
> **Alcance:**
> 1. Crear las lecciones del espacio Aprende con explicación intuitiva, explicación técnica, ilustración/animación pertinente, ejemplo y comprobación.
> 2. Incorporar exactamente 40 ejercicios con la distribución 20 básicos, 10 intermedios y 10 avanzados.
> 3. Usar la lista de la sección 6 como catálogo aprobado. No añadir problemas de matrices, arreglos, funciones, procedimientos, recursividad ni otros temas externos.
> 4. Cada ejercicio debe contener enunciado, objetivo, conceptos, entradas, salidas, restricciones, estrategia, métodos, ejemplos, pruebas normales, pruebas límite y errores frecuentes.
> 5. Crear segundo método únicamente si es genuinamente distinto y correcto. Mantener la misma especificación de entradas/salidas y probar equivalencia.
> 6. Corregir los problemas conocidos de Fibonacci, máximos negativos, límites de ciclos, centinelas, promedio sin datos y validaciones.
> 7. Separar contenido de la interfaz para que las lecciones y los ejercicios sean fáciles de auditar.
>
> **Explicación por capas:** sencilla, visual y técnica. Las tres deben describir el mismo fenómeno. Evita definiciones imprecisas y analogías presentadas como hechos literales.
>
> **Validación:** no marques contenido como verificado hasta comprobar fórmulas, condiciones, pseudocódigo y resultados con casos independientes. Si un ejercicio requiere sintaxis que el motor no soporta, no la inventes: regístralo como requisito del Módulo 3 y mantén el pseudocódigo dentro del alcance aprobado.
>
> **Aceptación del módulo:** exactamente 40 ejercicios; 20/10/10; ningún concepto fuera del alcance; ficha completa para cada ejercicio; dos métodos solo cuando aporten valor; ejemplos y resultados verificados; progreso de dificultad justificable; lecciones de todos los conceptos permitidos.
>
> Ejecuta pruebas de contenido, commit y entrega un informe con ejercicios, métodos y casos de prueba. Detente después del Módulo 2.

## MÓDULO 3 — Parser, intérprete, diagramas y simulación sincronizada

### Objetivo

Hacer que pseudocódigo, SVG, animaciones, variables y resultados procedan de una sola ejecución determinista.

### Prompt 3

> Continúa sobre los commits de los módulos 1 y 2. Ejecuta exclusivamente el MÓDULO 3 de este documento.
>
> **Primero inspecciona** la gramática real del pseudocódigo original y la estructura de los 40 ejercicios. No cambies la sintaxis por comodidad. Implementa solo lo necesario para el alcance aprobado.
>
> **Motor:**
> 1. Tokenizador y parser restringidos a la sintaxis del pseudocódigo educativo.
> 2. Validación estructural antes de ejecución.
> 3. Intérprete para asignaciones, operaciones, entrada/salida, condiciones Si/Sino, Para, Mientras y Hacer–Mientras.
> 4. Registro determinista de eventos y snapshots de estado.
> 5. Soporte de avance, retroceso, salto a paso y reproducción.
> 6. Protección contra ciclos que no terminan, con error pedagógico.
> 7. Mensajes precisos para datos inválidos o faltantes.
>
> No uses `eval` ni `new Function` para ejecutar pseudocódigo. No introduzcas arrays/matrices como contenido ni sintaxis de módulo `%` sin aprobación expresa.
>
> **Sincronización obligatoria:** cada paso del motor debe ser la fuente de verdad para diagrama, pseudocódigo resaltado, “En escena”, panel de variables, historial, tabla, pantalla y explicación. Al retroceder, todo debe volver al estado exacto previo.
>
> **Diagramas SVG:** construir nodos y conectores desde la misma estructura lógica. Verificar geometría, flechas, V/F, retornos, ciclos anidados, ajuste al contenido, zoom y foco del nodo actual.
>
> **“En escena”:** crear una visualización por tipo de evento. Ejemplos: dato que entra, valor que se asigna, operación que se desglosa, condición que se evalúa, recorrido por una rama, vuelta de un ciclo y resultado que aparece. Sincronizar transición y explicación.
>
> **“Variables”:** mostrar valores actuales, anterior/nuevo, instrucción causante, razón del cambio, historial y vuelta correspondiente. Mantener una tabla de seguimiento legible.
>
> **Aceptación del módulo:** todos los métodos de los 40 ejercicios pueden ejecutarse; cada salida coincide con sus pruebas; avance y retroceso son deterministas; SVG y pseudocódigo nunca contradicen el motor; “En escena” y “Variables” explican el mismo paso; no hay errores de consola ni ciclos bloqueantes.
>
> Realiza commit, documenta pruebas y limitaciones. Detente después del Módulo 3.

## MÓDULO 4 — Laboratorio y constructor gráfico

### Objetivo

Mantener todas las actividades del prototipo y añadir un constructor completo que use la misma semántica que el simulador.

### Prompt 4

> Continúa sobre el estado de los módulos 1, 2 y 3. Ejecuta exclusivamente el MÓDULO 4.
>
> **Laboratorio:** conserva y mejora las seis actividades: Predice, Tabla, Ordena, Identifica símbolo, Encuentra el error y ¿Y si…?. Todas deben funcionar en los 40 ejercicios cuando la actividad tenga sentido.
>
> - Predice: pregunta antes del paso; tras responder, explica usando el estado real.
> - Tabla: fila y columna correctas, valor anterior/actual y foco en la iteración actual.
> - Ordena: permitir organizar instrucciones y explicar errores de orden/estructura.
> - Identifica símbolo: mantener como actividad de reconocimiento, no confundirla con construir un diagrama.
> - Encuentra el error: usar pruebas independientes, casos de borde y contraejemplos; puede haber dos algoritmos incorrectos o uno correcto.
> - ¿Y si…?: variar condiciones/datos/líneas seleccionadas con análisis del efecto y prevención de ejecuciones bloqueadas.
>
> El panel del laboratorio debe convivir con diagrama, “En escena” y variables; no debe bloquear las rutas ni ocultar nodos fundamentales. En pantallas pequeñas, usar panel o pestaña adaptable.
>
> **Constructor:** implementar un lienzo donde el estudiante agregue, edite, mueva y conecte los símbolos permitidos; dibuje ramas V/F; cree los tres tipos de ciclo; compruebe estructura y ejecute el diagrama. Usar el mismo modelo de nodos/flujo y motor del Módulo 3. No crear un segundo intérprete.
>
> El editor debe indicar errores con ubicación y motivo, por ejemplo: falta un inicio, falta una salida de decisión, conexión huérfana, ruta sin fin o estructura de ciclo incompleta. No “autocorregir” silenciosamente.
>
> **Aceptación del módulo:** todas las actividades del laboratorio son utilizables; una actividad no destruye el estado de simulación; el constructor crea y ejecuta al menos un ejercicio de secuencia, uno de decisión y uno de cada bucle; errores de conexión se detectan; el diagrama construido se sincroniza con “En escena” y variables.
>
> Ejecuta pruebas, commit y entrega informe. Detente después del Módulo 4.

## MÓDULO 5 — Integración, auditoría, rendimiento y publicación

### Objetivo

Asegurar que la plataforma completa sea consistente, precisa, accesible y publicable.

### Prompt 5

> Continúa el estado de los módulos 1 a 4. Ejecuta exclusivamente el MÓDULO 5: auditoría final e integración.
>
> **Auditoría pedagógica:** revisar todos los textos, definiciones, analogías, símbolos, enunciados y restricciones. No dejar contenido fuera del alcance. Corregir ambigüedades y explicaciones que contradigan la ejecución.
>
> **Auditoría de los 40 ejercicios:** ejecutar cada método con todos los casos de prueba; verificar entradas, resultados, ciclos, empates, negativos, límites y casos sin datos. Confirmar que métodos alternativos producen las mismas salidas bajo las mismas restricciones.
>
> **Auditoría visual:** comparar la experiencia con las capturas de referencia como nivel mínimo, no como diseño a copiar. Verificar pantalla de reto, simulador, “En escena”, “Variables”, tabla e interfaz de laboratorio. El diagrama no debe quedar cortado; ventanas no deben superponerse de forma destructiva; la tipografía debe leerse en escritorio, tableta horizontal y móvil.
>
> **Auditoría de movimiento:** comprobar sincronización de luces, rutas, variables, explicaciones y timeline. Control de pausa, reducción de movimiento y ausencia de destellos/distra­cciones.
>
> **Auditoría funcional:** comprobar navegación, modo presentación, selección de ejercicio/método, entradas, restauración, zoom, cámara, pantalla completa, ajuste de texto, tema, avance/retroceso, velocidad, predicción, laboratorio, constructor y publicación.
>
> **Rendimiento:** probar ejercicios con muchas iteraciones, ciclos anidados y diagramas grandes; evitar bloquear la interfaz; limitar memoria e historial cuando sea necesario sin perder trazabilidad educativa.
>
> **Publicación:** verificar GitHub Pages desde la rama y ruta configuradas; README claro; instrucciones para desarrollo y despliegue; enlaces internos correctos.
>
> **No declares finalizado** ningún apartado que no se haya probado. Si algo no se puede probar en el entorno disponible, decirlo explícitamente y dejar una lista reproducible de validación pendiente.
>
> **Aceptación final:** 40 ejercicios correctos; cinco espacios utilizables; todas las funciones originales conservadas o con equivalencia; constructor funcional; simulador sincronizado; animaciones pedagógicas de alta calidad; accesibilidad básica; consola limpia; sitio publicable.
>
> Crea commit final y entrega un informe de aceptación con pruebas pasadas, fallos corregidos y limitaciones reales. No empieces nuevos módulos después de este.

---

# 10. Reglas de trabajo en GitHub

1. Antes de cada módulo, vuelve a inspeccionar el repositorio y no confíes en descripciones antiguas del estado.
2. No sobrescribas el HTML original hasta tener una copia de referencia dentro del repositorio o una equivalencia funcional probada.
3. Si el repositorio está vacío, inicializa el primer commit en la rama predeterminada; no intentes crear una rama desde un commit inexistente.
4. Si tiene contenido, crea una rama de trabajo desde el commit vigente y respeta cambios ajenos.
5. Un módulo, uno o varios commits coherentes; nunca agrupar cambios no relacionados.
6. No modificar etapas ya aceptadas salvo que una dependencia o error lo exija; documentar el motivo.
7. Al finalizar cada módulo, informar: commit/hash, archivos, funcionalidades, pruebas ejecutadas, resultados, problemas restantes y confirmación de que la aplicación sigue funcionando.
8. No presentar como terminado algo que solo se haya escrito pero no ejecutado.



# 11. Protocolo de continuidad entre conversaciones y cuentas

Este proyecto está diseñado para poder ejecutarse en conversaciones separadas, incluso usando otra cuenta o modelo. **No debe requerir que el agente recuerde conversaciones anteriores.** El usuario quiere adjuntar siempre los mismos dos archivos y escribir solamente: “Ejecuta el módulo N”.

## 11.1 Los dos archivos que el usuario adjuntará en cada sesión

1. `diagramas_de_flujo.html`: prototipo original completo. Se utiliza como referencia funcional y se conserva intacto en el repositorio.
2. `Propuesta_redisenio_diagramas_de_flujo_v5.md`: documento maestro con alcance, auditoría, ventanas, criterios visuales, catálogo y los cinco prompts.

No exigir al usuario que vuelva a explicar el proyecto, copie decisiones de conversaciones anteriores, adjunte documentos intermedios ni resuma lo que ya se hizo.

## 11.2 El repositorio es la memoria persistente del proyecto

Al ejecutar el Módulo 1, crear y mantener, como mínimo, estos archivos de seguimiento en GitHub:

- `docs/MASTER_SPEC.md`: copia del documento maestro recibido o referencia íntegra a la especificación, para que el repositorio contenga las mismas reglas.
- `docs/IMPLEMENTATION_STATUS.md`: estado de los cinco módulos, dependencias, commits, pruebas, archivos relevantes, decisiones y pendientes.
- `docs/DECISIONS.md`: decisiones técnicas importantes y sus motivos; no repetir debates ya cerrados.
- `reference/diagramas_de_flujo_original.html`: copia byte por byte del HTML original, sin modificarlo.
- `reference/README.md`: explicación de que el archivo de referencia es inmutable y cómo se usa para la auditoría de equivalencia.

Si el repositorio ya contiene archivos equivalentes, inspeccionarlos y reutilizarlos; no crear duplicados innecesarios. Si el HTML original ya está guardado, comparar su hash con el archivo adjunto. Si coincide, conservarlo. Si no coincide, no reemplazarlo silenciosamente: registrar la diferencia y mantener la versión original ya aceptada hasta aclarar cuál es la referencia oficial. No bloquear innecesariamente una etapa si la comparación permite concluir que es el mismo archivo.

El archivo `docs/IMPLEMENTATION_STATUS.md` debe contener una tabla similar a esta:

| Módulo | Estado | Commit de cierre | Pruebas | Bloqueos / pendientes |
|---|---|---|---|---|
| 1. Arquitectura y diseño | Pendiente / En curso / Aceptado | SHA o enlace | Evidencia | Lista |
| 2. Lecciones y 40 ejercicios | Pendiente / En curso / Aceptado | SHA o enlace | Evidencia | Lista |
| 3. Motor y simulación | Pendiente / En curso / Aceptado | SHA o enlace | Evidencia | Lista |
| 4. Laboratorio y constructor | Pendiente / En curso / Aceptado | SHA o enlace | Evidencia | Lista |
| 5. Integración y publicación | Pendiente / En curso / Aceptado | SHA o enlace | Evidencia | Lista |

Debe incluir también:
- Rama predeterminada y rama de trabajo vigente.
- Último commit inspeccionado.
- Módulos efectivamente completados (no asumir que un commit equivale a aceptación).
- Comandos de instalación, desarrollo, pruebas y build.
- Pruebas ejecutadas y resultados reales.
- Funciones originales conservadas y cómo se verificaron.
- Problemas conocidos y pasos reproducibles.
- Siguiente acción recomendada.

## 11.3 Procedimiento obligatorio al recibir “Ejecuta el módulo N”

1. Leer los dos adjuntos de la sesión actual. No confiar en versiones recordadas ni en archivos de sesiones anteriores.
2. Acceder al repositorio `Santiillana/Diagramas-de-flujo-` y comprobar permisos, rama predeterminada, ramas existentes, último commit, archivos y estado real.
3. Leer `docs/MASTER_SPEC.md`, `docs/IMPLEMENTATION_STATUS.md` y `docs/DECISIONS.md`, si existen; contrastarlos con el documento maestro adjunto. Si hay discrepancias, la especificación adjunta V5 prevalece, salvo que el repositorio documente una decisión posterior aprobada por el usuario.
4. Leer el HTML original del adjunto y compararlo con `reference/diagramas_de_flujo_original.html`. Usarlo como patrón de equivalencia funcional, no como base para borrar la implementación actual.
5. Comprobar las dependencias del módulo solicitado. Un módulo solo puede comenzar cuando sus prerrequisitos están aceptados. Si falta un prerrequisito, no simular que está cumplido ni saltarlo: informar claramente qué falta y cuál es el módulo que debe completarse primero.
6. Si el módulo ya está aceptado, no rehacerlo. Revisar su estado y explicar que ya está completado; solo hacer cambios si hay un fallo reproducible o una instrucción nueva del usuario.
7. Trabajar sobre el estado actual del repositorio, no sobre una copia regenerada desde el HTML original. Preservar cambios válidos y evitar sobrescribir trabajo previo.
8. Ejecutar exclusivamente el módulo solicitado. No avanzar por iniciativa propia al siguiente.
9. Probar la aplicación, actualizar el registro de continuidad y los documentos de decisiones, guardar evidencia de pruebas y crear un commit identificable.
10. Actualizar `docs/IMPLEMENTATION_STATUS.md` con estado real, SHA del commit, pruebas aprobadas/fallidas y pendientes. No marcar “Aceptado” si existen criterios obligatorios sin cumplir.
11. Entregar un resumen breve con commit, cambios, pruebas y estado del módulo. El siguiente modelo debe poder continuar leyendo solamente los dos adjuntos y el repositorio.

## 11.4 Trabajo seguro con ramas y commits

- Nunca hacer `force push` ni reescribir historia.
- No modificar directamente `main` si el repositorio ya tiene flujo de ramas establecido; usar una rama de módulo y una integración verificable, o respetar la estrategia documentada en el repositorio.
- Si el repositorio está realmente vacío, inicializar `main` con el Módulo 1; no intentar crear una rama desde un SHA inexistente.
- Si la rama ya existe y contiene avances, inspeccionarla y continuarla sin duplicar el trabajo.
- No borrar ni sobrescribir el HTML de referencia.
- Un commit de módulo debe ser pequeño, descriptivo y comprobable. Registrar su SHA en el estado del proyecto.
- No inventar ejecución de pruebas, capturas, despliegues ni resultados. Decir explícitamente qué no se pudo verificar.

## 11.5 Única instrucción que el usuario necesita escribir

Después de adjuntar los dos archivos y tener GitHub conectado con permisos al mismo repositorio, el usuario podrá escribir:

**“Ejecuta el Módulo 1 del documento maestro. Trabaja directamente en el repositorio conectado. Sigue el protocolo de continuidad y cumple los criterios de aceptación antes de detenerte.”**

En otra conversación o cuenta, adjunta los mismos dos archivos, conecta GitHub al mismo repositorio y escribe, por ejemplo:

**“Ejecuta el Módulo 2 del documento maestro. Trabaja sobre el estado actual del repositorio; no reinicies ni repitas módulos aceptados.”**

Para los módulos 3, 4 y 5, solo cambia el número. No se necesita repetir el contexto ni entregar el historial de conversación.

**Condición externa:** cambiar de cuenta no transfiere automáticamente permisos de GitHub. La nueva cuenta debe tener la integración/conexión de GitHub habilitada y acceso al mismo repositorio. Los dos archivos adjuntos no sustituyen ese permiso ni contienen el código ya implementado; el repositorio conserva ese trabajo.

---

# 12. Criterio final de éxito

La plataforma terminada debe superar al prototipo en cinco dimensiones simultáneas:

- **Pedagogía:** explica el concepto en lenguaje sencillo y técnico, sin errores.
- **Visualización:** las animaciones, luces, ilustraciones y ventanas hacen visible el proceso real.
- **Profundidad:** permite seguir el diagrama, observar “En escena”, revisar variables y entender por qué cambian.
- **Práctica:** el estudiante resuelve, construye, predice, prueba y corrige, en vez de limitarse a mirar.
- **Calidad técnica:** todas las vistas reflejan una sola ejecución correcta, con pruebas independientes y una interfaz robusta.

**La prueba definitiva:** alguien que nunca haya resuelto un problema concreto debe poder analizarlo, diseñar el diagrama, ejecutarlo, explicar sus decisiones y demostrar con diferentes entradas que su solución funciona, usando exclusivamente los conceptos de esta plataforma.
