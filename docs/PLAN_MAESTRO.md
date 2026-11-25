# Senapsis: plan maestro de mejoras para Codex

Instrucciones de implementación · Versión 1 · 18 de noviembre de 2026 · Rama de trabajo: `mejoras-desarrollo`

## 1. Cómo usar este documento

Este documento es la fuente de verdad para materializar todos los cambios y mejoras que el dueño del proyecto definió pantalla por pantalla. Está escrito para Codex y debe leerse completo antes de empezar.

Reglas de trabajo:

1. **Orden.** Ejecutar las fases en el orden del mapa (sección 5). Dentro de cada fase, un `step-N` por punto, con commits `feat(step-N): ...` o `fix(step-N): ...`, como ya se hace en el repositorio.
2. **Inventario antes de editar.** Al comenzar cada fase, entregar un informe breve: qué existe, rutas y nombres reales, qué se reutiliza, qué falta y qué riesgos hay. Los nombres de archivos que aparecen aquí (`src/ui/simulator.js`, `src/ui/lab.js`, `src/ui/content-view.js`, `src/ficha/view-actividades.js`, `src/content/temas.js`) son hipótesis tomadas de un informe previo: **verificarlos, no asumirlos**.
3. **`reference/` no se toca.** Nunca. Tampoco se copia código de referencias externas al código de producción.
4. **Detenerse en lugar de inventar.** Si falta un insumo (el HTML de referencia del simulador, una decisión abierta de la sección 3, un dato real), parar y preguntar al usuario.
5. **Pruebas.** Las pruebas Node y E2E existentes deben seguir pasando al cierre de cada step. Cada fase añade las suyas. No se avanza de fase con pruebas en rojo ni con regresiones sin explicar.
6. **Reporte por step.** Al terminar: qué cambió, archivos tocados, pruebas añadidas, capturas (ver checklist de UI, sección 4.8), riesgos y pendientes.
7. **Precedencia.** Si dos instrucciones se contradicen, prevalece la de la fase más específica. La sección 4 (sistema de diseño) aplica a todas las fases.
8. **Cambios pequeños y reversibles.** No mezclar refactor y rediseño en el mismo commit. Los módulos grandes (`simulator.js`, `lab.js`, `content-view.js`, `view-actividades.js`) se dividen por responsabilidades solo cuando la fase los toca.

## 2. Contexto del producto

- **Qué es:** prototipo mínimo viable de una plataforma que se presentará al SENA, enfocada en **fichas** (grupos de formación). La primera ficha es ADSO (Análisis y Desarrollo de Software). Más adelante cada ficha tendrá su propia configuración, datos y moderador.
- **Dos espacios principales:** **Mi ficha** (Centro de control, Clases, Actividades, Biblioteca) y **Aprende** (Lecciones, Ejercicios, Simulador, Laboratorio).
- **Estado técnico** (según el informe previo de Codex): aplicación estática en HTML, CSS y JavaScript nativo, sin dependencias de runtime; Playwright como dependencia de desarrollo; rama `mejoras-desarrollo` con 26 commits sobre `main`; 29 archivos de pruebas Node y 31 pruebas E2E; registro de temas en `src/content/temas.js`; publicada en Cloudflare Workers; CI en pushes y pull requests hacia `main`.
- **Competencias actuales (5):**
  - Principales: **Establecer requisitos**, **Evaluación de requisitos**.
  - Transversales: **Comunicación**, **Matemáticas**, **TICs**.
- **Temas actuales:** Formas de recolectar información (Establecer requisitos); Diagramas de flujo (Evaluación de requisitos); Números enteros, Números racionales y Regla de tres (Matemáticas). TICs y Comunicación aún no tienen temas.
- **Norte de calidad:** el recorrido principal debe quedar impecable para la demostración: simulador de diagramas de flujo, Aprende, Centro de control y Clases. Todo lo demás debe ser coherente con ese nivel.

## 3. Decisiones

### 3.1 Decisiones cerradas

| Tema | Decisión |
| --- | --- |
| Competencias | Las 5 actuales. Cada una tiene un campo `tipo`: `principal` o `transversal`. Se podrán añadir, quitar, desactivar o modificar desde el panel de moderador. |
| Lecciones | Se completan **manualmente**: un control discreto al final de la lección, desmarcable. |
| Progreso | Tema = lecciones completadas / lecciones totales. Competencia = suma de completadas / suma de totales de sus temas (no promedio de porcentajes). |
| Actualización de datos | Backend profesional con formulario: Cloudflare Workers + D1 (plan gratuito) + Cloudflare Access para proteger al moderador. Nada de commits ni archivos estáticos para actualizar contenido. |
| Multi-ficha | Todo dato compartido lleva `ficha_id` desde el primer día, aunque hoy solo exista ADSO. |
| Estado personal | Lo que marca cada aprendiz (evidencia hecha, lección completada, favoritos, preferencias) vive en su navegador, separado de los datos compartidos. |
| Simulador | Carcasa común + contrato de paso + módulos por tema. Se empieza por diagramas de flujo, ya con esa separación. |
| HTML de referencia | Es del usuario. Buscarlo primero en el repo (puede estar incrustado); si no está, pedirlo. Se usa como guía; el resultado debe **superarlo**. |
| Navegación de Aprende | La subsección «Aprende» se renombra **«Lecciones»**. Orden de subsecciones: Lecciones, Ejercicios, Simulador, Laboratorio. |
| Dificultad | Se elimina como filtro de la lista de temas. Se muestra dentro de lecciones y ejercicios (de lo más simple a lo más difícil). |
| Plataforma | Pública. Prototipo para la ficha ADSO, pensada para extenderse a más fichas. |

### 3.2 Decisiones abiertas (no bloquean las primeras fases)

1. **Contactos de instructores** (correo, teléfono, foto): ¿públicos, restringidos a quien tenga el enlace de la ficha, u opcionales por instructor con consentimiento? Mientras no se decida, el modelo los trata como **opcionales y no publicados por defecto**.
2. **Contenido de aprendizaje entre fichas:** ¿catálogo común y cada ficha activa competencias y temas, o contenido propio por ficha? Propuesta: catálogo común con activación por ficha.
3. **Etiqueta «Lógica de programación» en las evidencias:** hoy aparece como competencia en las tarjetas de evidencia, pero no coincide con las 5 competencias. Hasta aclararlo, cada evidencia se asocia a una competencia (clave foránea) y esa etiqueta se trata como **tema o resultado de aprendizaje** secundario.
4. **Regla de color por género** del instructor en el horario: inventariar cómo funciona hoy y conservarla; el usuario confirmará si se mantiene.
5. **Nombres de los niveles de dificultad:** propuesta Básico, Intermedio, Avanzado, Reto (confirmar).
6. **Mecánicas del Laboratorio transversales** (por ejemplo Clasifica, Relaciona): ¿se repiten por tema o pertenecen a uno?

## 4. Sistema de diseño y calidad de UI (aplica a todo)

La calidad visual es un requisito, no un adorno. Los problemas que el usuario señaló una y otra vez son los mismos: **espacios desperdiciados, elementos apretados o solapados, texto cortado, tarjetas dentro de tarjetas, botones con demasiado texto y vistas que cambian de forma al navegar**. Este sistema los elimina de raíz.

### 4.1 Principios

1. **Menos, pero claro.** Una idea por bloque, poco texto, jerarquía evidente. El texto largo solo donde hace falta explicar.
2. **Consistencia.** Misma cabecera, mismos espacios y mismos componentes en todas las vistas. Lo único que cambia al navegar es el contenido y el estado activo.
3. **Aprovechar la ventana.** Nada de columnas angostas con media pantalla vacía. Las vistas principales caben en una pantalla sin recortes.
4. **Movimiento con propósito.** Las animaciones explican (qué cambió, de dónde viene, a dónde va); nunca estorban ni producen saltos bruscos.
5. **Un solo nivel de tarjeta.** Sin tarjetas anidadas, sin esquinas decorativas ni marcos que no aporten información.

### 4.2 Tokens

Definir (o unificar los existentes) como variables CSS en un único archivo de tokens y usarlos en todo el CSS. No usar valores sueltos en píxeles para espaciado, radios ni duraciones.

| Familia | Tokens y valores de partida (ajustables con criterio visual, pero únicos) |
| --- | --- |
| Espaciado | `--space-1` 4 px · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 24 · `-6` 32 · `-7` 48 · `-8` 64 |
| Uso del espaciado | Dentro de una tarjeta: 8 a 12 px entre elementos y 16 de padding. Entre tarjetas: 16. Título de sección a su contenido: 16 a 20. Entre secciones de una página: 48. Padding lateral de página: 24 en escritorio y 16 en móvil |
| Tipografía | Escala 13 · 14 · 16 · 18 · 22 · 28 · 36 px. Mínimo absoluto 13 px. Interlineado 1,5 en texto y 1,2 en títulos. Conservar las familias actuales (serif de títulos, sans de interfaz, mono de código); no cambiarlas sin aprobación |
| Radios | 8 px controles · 12 px tarjetas y paneles · 999 px chips |
| Elevación | Dos niveles. En tema oscuro, preferir bordes sutiles a sombras |
| Movimiento | `--dur-fast` 120 ms · `--dur-base` 200 ms · `--dur-slow` 320 ms · escenas del simulador 600 a 1500 ms. Entradas: `cubic-bezier(0.22, 1, 0.36, 1)`. Cámara y desplazamientos: `cubic-bezier(0.65, 0, 0.35, 1)` |
| Ancho de contenido | `max-width` aproximado de 1480 px centrado, que a 1920 px conserve los márgenes actuales |

### 4.3 Color

1. **Tokens semánticos**, no colores sueltos: superficie (`bg`, `surface`, `surface-raised`), texto (`primary`, `secondary`, `muted`), `border`, `accent`, estados (`success`, `warning`, `danger`, `info`).
2. **Color por competencia.** Cada competencia define cuatro tokens: `--comp-<id>-solid`, `-tint` (fondo translúcido, entre 8 % y 14 % de opacidad), `-border` y `-text`. **Tomar los colores que ya usa la pantalla Aprende** (azul para Establecer requisitos, violeta para Evaluación de requisitos, ámbar para TICs, verde azulado para Comunicación, rosado para Matemáticas); no inventar otros. Es la **única fuente de color de competencia** para Horario, Evidencias, Actividades, Biblioteca, Progreso, Ejercicios y Laboratorio.
3. **Estados** (vencida, vence mañana, entregada, pendiente) usan colores y formas distintos de los de competencia, para no confundir un vencimiento con una materia.
4. **Contraste AA:** 4,5:1 para texto y 3:1 para componentes. El color nunca es el único portador de significado (añadir ícono o etiqueta).
5. **Tema claro y oscuro** completos, con los mismos tokens. Conservar los acentos actuales (verde en Mi ficha claro, amarillo en Aprende oscuro) y el interruptor de tema existente.
6. **Los tintes translúcidos** no pueden bajar el contraste del texto por debajo de AA; verificarlo en ambos temas.

### 4.4 Componentes base

Crear o unificar, una sola implementación reutilizable cada uno: cabecera y barra de subsecciones; selector de espacio (Mi ficha / Aprende); tarjeta (un nivel); tarjeta de competencia y tarjeta de tema; chip y chip de estado; indicador de progreso (**un solo tipo por contexto**: anillo o barra, nunca ambos); estado vacío; acordeón; drawer lateral (escritorio) y bottom sheet (móvil); tooltip; interruptor; botón (**una sola acción primaria por vista**); hoja cuadriculada; mini-escena del simulador; tarjeta de evidencia; tarjeta de documento.

### 4.5 Layout y responsive

- Breakpoints de prueba: **390×844** (móvil), **768×1024** (tableta), **1366×768** (portátil) y **1920×1080** (escritorio).
- Las pantallas de altura completa usan `100dvh` menos la altura de la cabecera, **nunca `100vh` ni alturas fijas en píxeles**.
- **Cero scroll horizontal** en cualquier vista y tamaño. El contenido ancho (tablas, código) se desplaza dentro de su propio contenedor.
- El scroll vertical ocurre en el contenedor de contenido; la cabecera permanece fija y completa.
- Grillas con `auto-fill` y mínimos razonables para que las tarjetas aprovechen el ancho y tengan todas el mismo tamaño.
- En móvil: una columna, paneles laterales convertidos en selectores colapsables o pestañas inferiores, chips con scroll horizontal propio.

### 4.6 Accesibilidad

- Foco visible (anillo de 2 px) en todo elemento interactivo; navegación completa por teclado.
- Objetivos táctiles de al menos 44 px en móvil.
- Roles y etiquetas: `role="progressbar"` con `aria-valuenow`, `aria-pressed` en chips seleccionables, `aria-label` en botones de ícono, `aria-live` discreto para avisos.
- `prefers-reduced-motion`: todas las animaciones muestran su estado final sin movimiento.
- Nada que dependa solo de hover. `lang="es"`.

### 4.7 Texto y microcopy (español)

- Títulos y subtítulos en **mayúscula de oración**: «Martes, 17 de noviembre», no «Martes, 17 De Noviembre». Corregir los existentes («Semana Del 16 De Nov Al 21 De Noviembre»).
- Botones: un verbo corto o un ícono con `aria-label` y tooltip. Sin frases largas dentro de botones.
- Comillas y apóstrofos tipográficos en todo texto visible; fechas en formato colombiano («17 de noviembre de 2026») y hora en 24 horas.
- **Prohibido ocultar información esencial con truncado.** Se trunca (máximo 2 líneas) solo cuando el detalle completo está a un clic.
- Estados vacíos con una frase clara y, si procede, la acción siguiente.

### 4.8 Checklist de UI por entrega

Cada step que cambie interfaz debe adjuntar capturas en los 4 tamaños de 4.5 y en ambos temas, y confirmar:

1. Sin scroll horizontal, sin texto cortado ni solapado, sin tarjetas anidadas.
2. Espaciado según tokens y alineaciones consistentes (títulos, márgenes laterales).
3. Contraste AA y foco visible.
4. Estados cubiertos: cargando, vacío, error y con datos.
5. `prefers-reduced-motion` verificado.
6. Pruebas E2E que comprueban lo anterior donde sea medible. Crear un **helper reutilizable de Playwright** que, para cada ruta principal y cada tamaño, falle si hay desbordamiento horizontal o elementos que se solapan, y úsese en toda la suite.

## 5. Mapa de fases

| Fase | Contenido | Depende de |
| --- | --- | --- |
| 0 | Cabecera unificada y compacta; helper de pruebas de UI | Sección 4 |
| 1 | Simulador de diagramas de flujo y arquitectura reutilizable | Fase 0 |
| 2 | Color por competencia y tipo (principal o transversal) | Fase 0 |
| 3 | Auditoría de ejercicios (solo informe) | Fase 1 |
| 4 | Aprende: navegación, Lecciones, hoja cuadriculada, Mi progreso | Fases 2 y 3 |
| 5 | Ejercicios y Laboratorio por competencia y tema | Fases 3 y 4 |
| 6 | Modelo de datos con `ficha_id`, API de lectura y Mi ficha completa | Fase 2 |
| 7 | Panel de moderador y autenticación | Fase 6 |
| 8 | Migración de simulaciones de fuentes y matemáticas a la plantilla común | Fase 1 |

## Fase 0. Cabecera unificada y compacta

**Objetivo.** Una sola cabecera, idéntica en forma y posición en todas las vistas, mucho más compacta, que nunca desaparece.

**Problemas observados.** Hay un hueco vertical grande entre el selector Mi ficha / Aprende y la barra de subsecciones. En el Simulador la cabecera cambia: desaparece el selector, la barra adopta otro estilo y los botones de sol y pulso toman su lugar. Al desplazarse, a veces la página entera sube y deja la cabecera cortada.

**Inventario previo.** Ubicar dónde se renderiza la cabecera (probablemente `src/ui/` y `src/ficha/`, más el CSS global), qué código la oculta o reemplaza en el Simulador (modo pantalla completa o foco) y qué hacen exactamente los botones de sol y pulso (hipótesis: tema y nivel de movimiento). Confirmar antes de moverlos.

**Pasos.**

1. **Estructura.** Fila 1: logo a la izquierda, selector Mi ficha / Aprende centrado, botones de sol y pulso a la derecha, siempre en el mismo lugar. Fila 2: barra de subsecciones pegada debajo, con estilo de subrayado único para todas las vistas. Altura total objetivo: **104 px o menos** (56 px la fila 1 y 44 px la fila 2). Eliminar el hueco actual.
2. **Cabecera fija.** Pegada arriba; el scroll ocurre solo en el contenedor de contenido. Resolver el desplazamiento de página completa que deja la cabecera cortada.
3. **Una sola cabecera para todo.** Centro de control, Clases, Actividades, Biblioteca, Lecciones, Ejercicios, Simulador y Laboratorio comparten el mismo componente. En el Simulador **no** se oculta ni se sustituye. Lo único que cambia entre vistas es cuál opción aparece activa.
4. **Modo enfoque (opcional).** Un botón discreto en el Simulador que oculta temporalmente la cabecera para ganar espacio, con atajo de teclado y retorno claro. **No** es el comportamiento por defecto y recuerda la preferencia.
5. **Renombre.** La subsección «Aprende» pasa a **«Lecciones»** (etiqueta, textos, `aria-label` y pruebas que la referencien). El selector principal de espacios conserva «Aprende». Los cambios de navegación interna llegan en la Fase 4.
6. **Cero scroll horizontal** global (había barras de desplazamiento horizontal en varias vistas): encontrar y corregir la causa común.
7. **Helper de pruebas de UI** descrito en 4.8, aplicado a todas las rutas principales.

**Fuera de alcance.** Colores, tipografías y contenido de las vistas.

**Criterios de aceptación.**

- Al alternar entre todas las subsecciones de Mi ficha y Aprende, el selector y la barra no cambian de posición ni de tamaño (E2E con comparación de cajas delimitadoras).
- En el Simulador siguen visibles y funcionales el selector y la barra.
- La altura de la cabecera es de 104 px o menos y es igual en todas las vistas.
- Sin scroll horizontal en las rutas principales a 390, 768, 1366 y 1920 px.
- La subsección se llama «Lecciones» en toda la interfaz.
- Pruebas Node y E2E existentes en verde; E2E nuevos de estabilidad de cabecera y de modo enfoque.

## Fase 1. Simulador de diagramas de flujo y arquitectura reutilizable

**Objetivo.** Dejar el simulador de diagramas de flujo como la pieza estrella de Senapsis: mejor que el archivo de referencia del usuario, sin los bugs actuales y construido sobre una arquitectura que sirva a todos los temas futuros. Es la prioridad máxima del proyecto.

**Insumo obligatorio.** El archivo de referencia se llama «Diagramas de flujo en movimiento» (`diagramas_de_flujo.html`). El usuario cree que puede estar incrustado en la plataforma. Buscarlo primero en el repo; si no aparece, **detenerse y pedirlo**. Debe quedar copiado, sin modificar, fuera de `src/` (por ejemplo `docs/referencia-simulador/`). Es del usuario, así que se pueden reutilizar sus ideas, pero **no se copia su código tal cual**: se reimplementa con la arquitectura, los tokens y el estilo de Senapsis.

**Qué tiene la referencia y debe conservarse en espíritu:**

- Pantalla previa por ejercicio con enunciado, datos de ejemplo, tres preguntas guía y botón para ver la solución; casilla «Modo presentación».
- Barra de ejercicios con color por nivel, controles de tamaño de texto (A− / A+) y modo cámara.
- Panel izquierdo con enunciado, «¿Para qué sirve?», «Idea clave», conmutador de versiones del algoritmo (Con Para / Con Mientras) y pseudocódigo con la línea activa resaltada.
- Diagrama centrado con nodo activo amarillo y brillo, nodos ya ejecutados en verde azulado, conexión recorrida en dorado, marcador circular que viaja por la conexión y etiquetas V/F.
- **Globo flotante pegado a la figura** con un microtexto por paso.
- Panel **En escena** con una mini-animación distinta por tipo de figura, y panel **Variables** con cajitas que nacen y cambian.
- Modo **Predice antes de ver**.

**Problemas del simulador actual que esta fase corrige:**

1. El diagrama queda descentrado (pegado a la derecha del lienzo) y no se encuadra.
2. Las flechas del teclado no avanzan ni retroceden pasos.
3. No hay seguimiento automático: al avanzar, la vista no se centra ni hace zoom sobre la figura activa.
4. El panel Controles se sale por la derecha y tapa el panel En escena; el selector de ejercicios (1 a 44) está metido en ese menú.
5. Los globos explicativos aparecen lejos o arriba, no junto a la figura.
6. Los cuatro paneles laterales tienen demasiada información pequeña, tarjetas anidadas, textos cortados y elementos solapados (por ejemplo, la insignia «3 líneas» cortada, un marcador amarillo sobre un título, la ficha del paso encima de las cajas de datos).
7. La memoria se explica en dos paneles a la vez (información repetida).
8. Las animaciones tienen saltos bruscos entre pasos.

### 1.1 Inventario previo (antes de programar)

Entregar un informe con:

1. Cómo se separan hoy motor y vista en `src/ui/simulator.js`, `src/ui/source-simulator.js`, el parser e intérprete de pseudocódigo, el compilador del Constructor y el generador SVG.
2. Qué datos entrega el motor por paso y cuáles faltan para lo que pide esta fase. Candidatos a faltar: fila de entrada con el índice del dato leído, variable destino de cada asignación, valores sucesivos del contador de un ciclo, expresión de la condición con valores sustituidos. Proponer cómo exponerlos como funciones puras sobre el trazado del motor, **sin cambiar la semántica del intérprete ni del compilador, que no se reescriben**.
3. Cómo se calcula hoy el layout del diagrama y por qué queda a la derecha; cómo se anima cada paso (CSS, JS manual, `requestAnimationFrame`) y dónde ocurren los saltos.
4. Cómo se registran los atajos de teclado y por qué no responden (foco retenido, `keydown` en el elemento equivocado, `preventDefault` ausente).
5. Qué hacen realmente «Cámara automática», «Ajustar» y «Concentración».
6. De dónde sale la posición del globo (probable causa: coordenadas calculadas antes del layout o sin aplicar la transformación de la cámara).
7. Qué pruebas E2E dependen de los paneles actuales.
8. Qué ejercicios existen para el simulador y cuántos (la referencia tiene 30; el selector llega a 44; el catálogo de diagramas de flujo muestra 45).

### 1.2 Arquitectura objetivo: carcasa, contrato y módulos de tema

Separar tres capas, para que agregar un tema nuevo no implique reescribir el simulador.

1. **Carcasa** (sin ningún conocimiento de temas): layout de tres zonas, barra de reproducción, atajos, cámara y zoom, panel Controles, globo, modos didácticos, persistencia de preferencias y accesibilidad.
2. **Contrato de paso**: la carcasa solo sabe leer una lista de pasos. Todo ejercicio simulable, de cualquier tema, se convierte en esa lista.
3. **Módulo de tema** (plantilla): aporta lo específico. La primera plantilla es `flujo` (diagramas de flujo).

**Contrato de paso** (documentar en `docs/` y validar con una función de validación y pruebas):

| Campo | Significado |
| --- | --- |
| `id` | Identificador único y estable del paso |
| `foco` | Referencia al elemento del lienzo que se activa y hacia el que se enfoca la cámara |
| `globo` | Microtexto corto que aparece junto al foco |
| `escena` | Objeto `{ tipo, datos }` para el panel En escena |
| `estado` | Estado visible tras el paso (en `flujo`: variables y sus cambios) |
| `salida` | Texto acumulado en la pantalla hasta este paso |
| `frase` | Frase corta para la barra inferior |
| `lineaCodigo` | Línea de pseudocódigo activa (opcional) |
| `pregunta` | Pregunta para el modo Predice (opcional, generada desde el estado real) |

**Interfaz de una plantilla de tema:** `construirPasos(ejercicio)`, `renderizarLienzo(contenedor, ejercicio)`, `escenas` (mapa de tipo a componente), `renderizarEstado(...)`.

**Principio de renderizado:** cada vista del simulador (lienzo, escena, variables, globo) es una **función pura del estado del paso**, no una secuencia de mutaciones acumuladas. Así avanzar, retroceder y arrastrar la barra de progreso dan siempre el mismo resultado coherente.

**Registro de plantillas:** cada tema declara en `src/content/temas.js` qué plantilla usa y su configuración. Dejar un archivo corto en `docs/` titulado «Cómo agregar un tema nuevo» con cuatro pasos: registrar el tema; escribir sus ejercicios como datos; elegir una plantilla existente o crear una nueva que cumpla el contrato; probar. Con una plantilla existente, un tema nuevo es **solo datos y configuración**.

### 1.3 Layout y paneles

A 1920×1080: panel izquierdo (\~300 a 340 px), lienzo central flexible, panel derecho (\~360 a 420 px) y barra de reproducción inferior. Los paneles laterales tienen alto propio, título fijo y scroll interno; nunca texto cortado contra el borde. Los paneles son colapsables y recuerdan la preferencia; en móvil se convierten en pestañas inferiores sobre el lienzo. Tipografía mínima de 13 px. A 1366×768 todo debe seguir legíble y sin solapamientos.

**Selector de ejercicio.** Reemplazar los círculos 1 a 44 por una tira discreta con los ejercicios del tema elegido (integrada con la selección competencia, tema y ejercicio de las fases 4 y 5), con el nivel indicado por **color y etiqueta**, no solo por color. Fuera del menú Controles.

**Panel izquierdo.**

- Título, chip de dificultad y enunciado.
- «¿Para qué sirve?» e «Idea clave» como acordeón o texto continuo, **sin subtarjetas anidadas**.
- Conmutador de versiones (Con Para / Con Mientras) solo si el ejercicio las tiene.
- Pseudocódigo con líneas numeradas, línea activa resaltada y sincronizada con el nodo del diagrama; al hacer clic en una línea, ir al primer paso que la ejecuta.

**Panel derecho.** Dos secciones: **En escena** (arriba) y **Variables** (abajo). Eliminar los paneles redundantes.

### 1.4 Lienzo, cámara y zoom

1. **Encuadre inicial.** Calcular el cuadro delimitador del diagrama y ajustar `viewBox` para centrarlo con margen uniforme (\~10 %) y escala proporcional. Recalcular al abrir, al cambiar de ejercicio, al redimensionar (`ResizeObserver`) y al abrir o cerrar paneles.
2. **Centrar en la figura activa** (antes «Cámara automática»). Interruptor en Controles, **activado por defecto**. En cada cambio de paso, la cámara centra la figura activa con un zoom base tal que el nodo ocupe aproximadamente entre el 15 % y el 20 % del alto visible, con mínimo y máximo razonables.
3. **Movimiento continuo.** La cámara anima traslación y escala con interpolación (400 a 600 ms, escalado por la velocidad), sin saltos. Una nueva orden interrumpe la anterior desde la posición actual, sin teletransportes.
4. **Zoom del usuario.** Los botones − y + (y rueda del ratón o pellizco; la rueda no desplaza la página dentro del lienzo) cambian un factor multiplicativo acotado. Ese factor **persiste durante la navegación por pasos**: la cámara sigue centrando la figura activa con el zoom elegido. «Ajustar» lo restablece y encuadra todo. Se guarda por sesión.
5. **Pan manual.** Arrastrar el lienzo pausa el centrado hasta el siguiente cambio de paso.
6. Al terminar la ejecución, volver al encuadre completo. Con el centrado desactivado, la cámara no se mueve.
7. **Estados visuales de nodos:** pendiente (neutro), activo (relleno amarillo con brillo y escala sutil), ejecutado (verde azulado atenuado). Conexiones recorridas resaltadas en dorado que se dibujan con `stroke-dashoffset`. El marcador circular **viaja a lo largo de la conexión** con interpolación, no salta entre nodos.
8. Reutilizar nodos SVG y animar atributos; no reconstruir el SVG completo en cada paso.

### 1.5 Teclado

- `→` y `↓`: paso siguiente. `←` y `↑`: paso anterior. `Espacio`: reproducir o pausar. `Inicio` y `Fin`: primer y último paso.
- Registrar en `document` mientras el simulador esté activo y retirar al salir (sin fugas ni duplicados).
- No dispararlos con el foco en campos de texto, `select`, `textarea` o controles que usan las flechas (deslizadores, radios). **Sí** deben funcionar con el foco en un botón del propio simulador: tras pulsar un botón, devolver el foco al lienzo.
- `preventDefault` solo para estas teclas dentro del simulador. `aria-keyshortcuts` en los botones. Mostrar los atajos en un tooltip del panel Controles.

### 1.6 Panel Controles

- Anclado bajo el botón «Controles» dentro del lienzo, con ancho máximo y scroll interno; no se sale de la ventana ni tapa En escena. Se cierra con `Esc` y clic fuera.
- Grupos: **Vista** (−, +, Ajustar, Centrar en la figura activa), **Ventanas** (Problema, Pseudocódigo, En escena, Variables, Ocultar todas), **Ayudas** (Predice, Presentación: aparecer paso a paso) y **Texto** (A−, A, A+).
- El selector de ejercicios 1 a 44 sale de este menú.
- Aclarar qué hace «Concentración»; si duplica «Ocultar todas» o el modo enfoque de la Fase 0, retirarla y reportarlo.

### 1.7 Globo contextual

- Anclado al **nodo activo** en coordenadas del SVG (por ejemplo con `foreignObject` dentro del mismo grupo transformado) o recalculado en cada fotograma de la animación de cámara, después del layout. Así se mueve sincronizado con la figura, sin retraso ni saltos.
- Posición preferida: a la derecha de la figura; si no cabe, a la izquierda; evitar arriba y abajo para no tapar conexiones. Nunca sobre el nodo ni sobre nodos vecinos. Con conector corto hacia la figura.
- Contra-escalado: tamaño legible independiente del zoom, con ancho máximo. Siempre dentro del lienzo visible (clamping con margen).
- Contenido: un microtexto por tipo de paso, por ejemplo «Entra un dato: b ← 5», «Nace la variable a ← 2», «Decisión: V (4 <> 0). Sigue el camino V». Aparece con transición corta y se desvanece al salir. Respeta el interruptor de Ventanas.

### 1.8 Panel En escena: diseño de escenas (prioridad alta)

**Antes de programar**, producir un **documento de diseño de escenas** en `docs/`: una lámina por tipo de figura con storyboard de fotogramas, qué se muestra, qué se mueve, orden y duración, frase didáctica y estado final. **El usuario lo aprueba antes de implementar.** Es más barato corregir una lámina que una animación programada.

**Criterios de calidad de toda escena:** una sola idea visual; duración de 0,6 a 1,5 s a velocidad 1×; pausable y **reversible** (al retroceder, se reconstruye el estado coherente del paso anterior); renderizada como función del estado del paso; anima solo `transform` y `opacity` donde sea posible; una frase de texto de una línea; colores semánticos coherentes con el lienzo (activo amarillo, ejecutado verde azulado, dato azul, resultado verde, falso o error coral); `prefers-reduced-motion` muestra el estado final; cada elemento en su propia fila con espaciado fijo, **sin posicionamiento absoluto compartido** (la causa de los solapamientos actuales).

**Especificación de partida por tipo** (el documento de escenas la refina):

1. **Inicio.** El óvalo pulsa una vez (0,4 s) y aparece la fila de memoria con cajitas vacías punteadas. Frase: «Todo programa empieza con la memoria vacía».
2. **Entrada (Leer).** Fila de datos de entrada con el dato actual resaltado. Ese dato se eleva (0,3 s), viaja por una flecha curva hacia la caja de la variable receptora (0,5 s) y esta nace o cambia de valor con una transición corta. El dato consumido queda tachado o atenuado. Frase: «Leer toma el siguiente dato y lo guarda en una variable».
3. **Proceso (asignación u operación).** Variable origen, burbuja con el valor u operación, variable destino. En operaciones, mostrar la expresión con los valores sustituidos (por ejemplo `2 × 2`) y luego el resultado. Si el destino ya existía, el valor viejo sale tachado y entra el nuevo; si nace, aparece con animación de nacimiento. Frase de ejemplo: «Copia el valor de B en A».
4. **Decisión (rombo).** La condición con valores sustituidos (`4 <> 0`), insignia V o F que aparece con un pequeño rebote, y mini árbol con los dos caminos: el elegido se dibuja con trazo animado y el otro se atenúa. Frase: «La pregunta decide qué camino sigue; esta vez fue V».
5. **Repetición.** *Para:* contador con los valores que va tomando (1, 2, 3 y el valor que ya no cumple, marcado en coral), el actual resaltado; en la preparación nace la variable, en cada vuelta el incremento desplaza el resalto al siguiente valor. *Mientras:* la condición evaluada en cada vuelta con valores sustituidos, camino V hacia el cuerpo y F hacia la salida, con contador de vueltas. Frase: «M va tomando estos valores; cuando deja de cumplirse, el ciclo termina».
6. **Salida (Imprimir).** El valor viaja de la variable a una mini pantalla y el texto aparece con efecto de escritura breve. Frase: «Imprimir muestra el valor en la pantalla».
7. **Fin.** Óvalo Fin y resumen: lo que quedó en pantalla y los valores finales de las variables, con opción discreta de repetir.
8. **Escena genérica** de respaldo para tipos de figura que el motor soporte y no tengan escena propia (informar cuáles son).

### 1.9 Panel Variables

- Cajitas con nombre y valor. Una variable **nace** con una animación de aparición corta; al cambiar, el valor nuevo entra con una burbuja o resalte breve.
- Bloque «Cómo cambió cada variable»: historial compacto con chips de valores sucesivos, sin duplicar las cajitas.
- «Pantalla»: salida acumulada hasta el paso actual.
- **Ficha del paso** al final, compacta: figura, «Paso N de M», «Qué hace» y «¿Por qué aquí y en este orden?» en acordeón cerrado por defecto. La ficha **no repite** el texto del globo ni el de En escena.

### 1.10 Barra de reproducción

Frase corta del paso (una línea), botones (inicio, anterior, reproducir o pausar, siguiente, final), selector de velocidad y barra de progreso arrastrable con «Paso N de M». Etiquetas alineadas con sus controles. La velocidad escala todas las animaciones. Pausar o cambiar la velocidad a mitad de una animación no produce saltos.

### 1.11 Pantalla previa «Intenta primero»

Tarjeta centrada con nivel y número, título, enunciado, datos de ejemplo y tres preguntas guía (qué entra y qué se imprime; qué se calcula y en qué orden; si hay decisión o repetición). Un solo botón primario: «Ver la solución». Casilla «Modo presentación» que omite la pantalla y se recuerda en el navegador. Si el usuario llega desde «Ver en el simulador» en Ejercicios, la pantalla solo aparece si ese ejercicio aún no se ha visto.

### 1.12 Modos didácticos (subfase final)

1. **Predice antes de ver:** en pasos clave, pregunta de opción múltiple sobre el valor siguiente con retroalimentación inmediata. Las preguntas se generan **desde el estado real del motor**, nunca con textos fijos que puedan contradecirlo. Interruptor en Controles; desactivado por defecto.
2. **Versiones del algoritmo** (Con Para / Con Mientras) si el catálogo ya las tiene; si no, registrarlo como mejora futura.
3. **A− / A / A+** accesible y guardado en el navegador.
4. **Modo presentación y pantalla completa:** resueltos con el modo enfoque de la Fase 0.

### 1.13 Pasos de ejecución (un `step-N` por punto)

1. Inventario, brecha frente a la referencia y propuesta de arquitectura por escrito, sin código funcional.
2. Extraer carcasa y contrato de paso; el simulador actual funciona igual que antes. Pruebas de regresión.
3. Atajos de teclado.
4. Cámara: encuadre, seguimiento animado y zoom del usuario; panel Controles reubicado.
5. Globo anclado al nodo.
6. Layout y paneles sin cortes ni solapamientos; barra de reproducción alineada.
7. Panel Variables.
8. Documento de diseño de escenas → **aprobación del usuario**.
9. Escenas en este orden: Entrada, Proceso, Decisión, Repetición, Salida, Inicio y Fin.
10. Pantalla «Intenta primero» y modos didácticos.
11. Pulido: tema claro y oscuro, `prefers-reduced-motion`, 1366×768, rendimiento, documentación del contrato y guía «Cómo agregar un tema nuevo».

**Fuera de alcance de la Fase 1.** Cambiar el lenguaje de pseudocódigo, reescribir intérprete o compilador, cambiar los enunciados de los ejercicios, migrar fuentes y matemáticas (Fase 8), `reference/`.

### 1.14 Criterios de aceptación

- El simulador se comporta y se ve como la referencia, adaptado al estilo de Senapsis, y la **supera** en: cámara continua, globo anclado, escenas reversibles, teclado, paneles sin solapamientos y responsive.
- Con el diagrama cargado, `→` avanza y `←` retrocede sin hacer clic antes en el lienzo, y siguen funcionando tras pulsar cualquier botón.
- Con «Centrar en la figura activa», la figura del paso queda centrada con zoom suficiente en cada paso, con transición continua. El zoom elegido con − o + se mantiene; «Ajustar» lo restablece.
- El globo está siempre pegado a la figura activa, dentro del lienzo, y se mueve con la cámara sin retraso.
- Ningún panel muestra texto cortado ni solapado a 1920×1080 y a 1366×768; Controles no se sale de la ventana.
- Pseudocódigo, nodo, globo, En escena y Variables están sincronizados en cada paso, avanzando y retrocediendo, y también al arrastrar la barra de progreso.
- La carcasa no contiene lógica de diagramas de flujo: una prueba de contrato la ejecuta con una plantilla mínima ficticia y funciona.
- Agregar un ejercicio nuevo de diagramas de flujo solo requiere datos.
- Documento de escenas aprobado antes de implementarlas.
- Pruebas Node y E2E existentes en verde; nuevas: contrato de paso, contenido por paso, sincronización, centrado (centro del nodo ≈ centro del lienzo), persistencia del zoom, distancia globo–nodo menor que un umbral y atajos de teclado.

## Fase 2. Color por competencia y tipo (principal o transversal)

**Objetivo.** Que exista una única fuente de verdad para las competencias (identidad, tipo y color) y que todas las vistas la usen, de modo que el usuario pueda reconocer a qué competencia pertenece cualquier cosa por su color.

**Inventario previo.** Dónde están definidas hoy las competencias (probablemente `src/content/temas.js`); dónde y cómo se definen los colores y las formas de los puntos (en Aprende: círculo, rombo, cuadrado, triángulo y hexágono); cómo se asigna hoy el color en el Horario de Mi ficha, incluida la **regla de color según el género del instructor**, y qué materias del horario corresponden a qué competencia. Informar de cualquier dato que hoy dependa del *nombre* de la competencia en lugar de un identificador.

**Pasos.**

1. **Modelo.** Cada competencia: `id` estable (nunca el nombre), `nombre`, `tipo` (`principal` o `transversal`), `orden`, `activa`, ícono o forma, y referencias a sus tokens de color. Las 5 actuales: Establecer requisitos y Evaluación de requisitos (principales); Comunicación, Matemáticas y TICs (transversales). Debe poder añadirse, quitarse, desactivarse o modificarse una competencia sin romper temas, clases ni evidencias existentes.
2. **Tokens.** Para cada competencia, los cuatro tokens de la sección 4.3 (`solid`, `tint`, `border`, `text`) en tema claro y oscuro, **partiendo de los colores que ya usa Aprende**. Prueba unitaria que calcule la relación de contraste de cada combinación texto/fondo en ambos temas y falle por debajo de AA.
3. **Componente de competencia.** Un único componente (punto o ícono con la forma propia, más el nombre) reutilizado en chips, encabezados, tarjetas, Horario, Evidencias, Actividades, Biblioteca, Progreso, Ejercicios y Laboratorio. El color nunca es el único portador de significado: la forma y el nombre siempre acompañan.
4. **Agrupación por tipo.** En Aprende, Mi progreso, Actividades y Biblioteca, mostrar las **principales primero** y las **transversales** agrupadas después, con una etiqueta discreta «Transversal». Sin cambiar el color de ninguna.
5. **Horario de Mi ficha.** Cada bloque de clase pertenece a una competencia (clave foránea). Conservar la regla de color por género si existe, documentando cómo interactúa con el color de la competencia; si choca con el sistema nuevo, reportarlo al usuario antes de cambiar nada.
6. **Documentación breve:** «Cómo agregar o modificar una competencia».

**Fuera de alcance.** Cambiar la lista de competencias, sus colores actuales o los temas.

**Criterios de aceptación.**

- Un solo mapa competencia → color y tipo; ninguna vista tiene colores de competencia propios.
- Las pruebas de contraste pasan en ambos temas.
- Renombrar una competencia no rompe ningún enlace ni dato (prueba con ids).
- Las principales aparecen antes que las transversales en todas las vistas con competencias.

## Fase 3. Auditoría de ejercicios (solo informe)

**Objetivo.** Decidir con datos si los ejercicios existentes son los pertinentes. El usuario quiere ejercicios **fáciles, intermedios y difíciles, variados, principalmente de matemáticas y programación**, empezando por diagramas de flujo. **En esta fase no se modifica ningún ejercicio**: se entrega un informe y el usuario aprueba.

**Entregable.** `docs/auditoria-ejercicios.md` más una tabla (CSV) con todos los ejercicios.

**Contenido del informe.**

1. **Inventario completo** de los 108 ejercicios y del banco del simulador: tema, competencia, nivel, tipo, enunciado, si tiene solución, pasos y conceptos asociados; marcar duplicados y huecos. **Reconciliar los conteos**, que hoy no coinciden: el catálogo de diagramas de flujo muestra 45 ejercicios, el selector del simulador llega a 44 y la referencia del usuario tiene 30.
2. **Matriz de cobertura** por tema: cuántos ejercicios hay por nivel y qué conceptos cubre cada uno.
3. **Evaluación de calidad** de cada ejercicio: enunciado claro y sin ambigüedad; un único resultado correcto; dificultad coherente con su nivel; progresión de lo simple a lo difícil; que no dependa de algo aún no enseñado en las lecciones.
4. **Propuesta** de qué conservar, reescribir, eliminar y añadir, con una distribución objetivo por tema (partida: 40 % fáciles, 40 % intermedios, 20 % difíciles, ajustable) y la lista de conceptos a cubrir.
5. **Progresión sugerida para diagramas de flujo:** secuencia, entrada y salida; asignación y operaciones; decisión simple y anidada; ciclos Para y Mientras; acumuladores y contadores; combinaciones (por ejemplo potencia, factorial, promedio, mayor de n números).
6. **Matemáticas:** enteros, racionales, porcentajes y regla de tres, más los temas que el usuario pida añadir. Incluir propuesta de ejercicios de lógica de programación fuera de diagramas de flujo si el usuario los quiere.
7. **Esquema único de ejercicio**, validado por pruebas, para que añadir ejercicios nunca requiera tocar código de vistas. Campos mínimos: `id`, `tema_id`, `competencia_id`, `nivel`, `tipo`, `enunciado`, `datos`, `solucion` (qué se pide, por qué se resuelve así, para qué sirve, cómo se resuelve paso a paso y cuándo se usa), `conceptos` (enlaces a lecciones), `simulable` (plantilla del simulador), `laboratorio` (mecánica asociada), `esDeClase`.
8. Señalar qué ejercicios **carecen** del contenido necesario para la hoja de solución de la Fase 5 (qué, por qué, para qué, cómo, cuándo).

**Después de la aprobación del usuario** (otra fase de trabajo, no antes): Codex redacta borradores de los ejercicios nuevos o reescritos, con un **piloto en diagramas de flujo**; el usuario los aprueba y luego se replica en los demás temas.

**Criterios de aceptación.** Informe completo y consistente con el repositorio; conteos reconciliados; esquema propuesto con pruebas de validación sobre los datos actuales; **cero cambios** en los ejercicios existentes.

## Fase 4. Aprende: navegación, Lecciones, hoja cuadriculada y Mi progreso

**Objetivo.** Un flujo claro competencia → tema → lecciones, con lecciones diseñadas como una hoja cuadriculada de scroll continuo con animaciones, y un panel de progreso que funcione.

### 4.1 Navegación y lista de temas

Estructura de las cuatro subsecciones de Aprende: **Lecciones** (teoría por tema), **Ejercicios** (práctica explicada), **Simulador** (ejecución animada) y **Laboratorio** (práctica manual). Todas se organizan por competencia y tema; ya no hay accesos a las otras tres dentro de la vista de un tema, porque están en la barra superior.

1. **Flujo en tres niveles.** (1) Competencias con sus temas. (2) Al hacer clic en una competencia, listado de sus temas. (3) Al hacer clic en un tema, la vista de lecciones. **Una sola miga** en una línea arriba de la vista, y un «Atrás» claro. Eliminar la miga duplicada que hoy aparece dentro del panel de la lección.
2. **Eliminar las pestañas internas** Lecciones / Ejercicios / Simulador / Laboratorio dentro del tema y el selector «Tema» redundante (o simplificarlo dentro de la fila de migas si sirve para cambiar de tema sin volver). Eliminar rutas, estado y pruebas que solo existían para esas pestañas, sin romper los enlaces cruzados (por ejemplo, «Ver en el simulador» desde un ejercicio).
3. **Quitar el filtro de Dificultad** de la lista de temas. Antes de borrar su estado, comprobar si otras vistas o pruebas lo usan; conservar el código compartido y retirar solo su uso aquí. **No** eliminar el dato de dificultad: se muestra dentro de lecciones y ejercicios.
4. **Rediseño de la lista** con el sistema de la sección 4: separación entre secciones de competencia de 48 px; entre el título de la sección y su grilla de 16 a 20 px; entre tarjetas de 16 px. Eliminar márgenes negativos y alturas fijas que causan los solapamientos actuales (títulos pegados a las tarjetas).
5. **Encabezado de competencia:** punto o ícono con su forma y color, título de peso moderado, contador a la derecha en estilo secundario, y línea fina divisoria o tinte sutil. Etiqueta «Transversal» en las transversales.
6. **Grilla de tarjetas** con `auto-fill` y ancho mínimo de 260 a 300 px, todas del mismo tamaño y estructura aunque el título tenga una o tres líneas.
7. **Tarjeta de tema:** ícono, título (máximo 2 líneas), **un único indicador de progreso** y las métricas con leyenda. Los cuatro contadores coinciden con los de las pestañas internas (por ejemplo 8, 24, 1, 6): verificar que son lecciones, ejercicios, simulador y laboratorio y mostrarlos con ícono, número y tooltip accesible («8 lecciones»).
8. **Competencias sin temas:** bloque compacto atenuado «Próximamente» dentro de su sección, con el mismo ritmo vertical que las demás.
9. **Chips de competencia:** conservarlos como navegación rápida (desplazan a la sección) o filtro, sin el recuadro contenedor que dejó la retirada de Dificultad.
10. **Encabezado de página:** alinear verticalmente la píldora «Racha» y el botón «Mi progreso» con el título.
11. **Scroll:** el contenido se desplaza en su contenedor; la cabecera no queda cortada.

### 4.2 Vista de lecciones

**Layout.** Panel izquierdo de 280 a 320 px y hoja de lección con el resto (70 % a 80 % del ancho a 1920 px). En móvil, el panel izquierdo es un selector colapsable.

**Panel izquierdo (ligero).** Título del tema pequeño; progreso en una línea («1 de 8»); lista numerada de lecciones **en orden de dificultad creciente** con estado (pendiente, en curso, completa) y un indicador discreto de dificultad (1 a 3 puntos); el glosario como acceso discreto al final. Quitar las barritas de cuatro segmentos, las descripciones y los bloques redundantes.

**Hoja cuadriculada.** El panel de la lección es una hoja de cuaderno:

- Fondo de cuadrícula sutil con CSS (`background-image` de gradientes, celda aproximada de 24 px y opacidad baja para no estorbar la lectura).
- **Modo A:** cuadrícula clara sobre fondo oscuro con texto claro. **Modo B:** cuadrícula oscura sobre fondo claro con texto oscuro. Un interruptor pequeño con ícono en la esquina de la hoja alterna entre ambos y guarda la elección en el navegador. Por defecto sigue el tema general. Contraste AA.
- **Componente compartido** con Ejercicios (Fase 5): Lecciones y Ejercicios se ven como el mismo cuaderno.

**Contenido como documento continuo.**

- Encabezado: título, una línea de contexto (duración y nivel) y nada más. Quitar «EN CURSO» y la línea decorativa.
- Cuerpo dividido en **secciones con subtítulos** (la lección tiene subpartes) que se leen **solo haciendo scroll**. Un índice lateral discreto o una barra de progreso de lectura indica en qué subparte va el lector.
- **Sin tarjetas con marco ni esquinas decorativas dentro de la explicación y sin botones de «siguiente paso».** Los bloques se separan con espacio y tipografía.
- Bloques permitidos: párrafo, lista, definición en línea, figura animada, ecuación y nota. La nota amarilla de advertencia («Según el autor…») pasa a ser una nota en línea dentro de su sección.
- Al final de la lección, un único control discreto: «Marcar como completada» (desmarcable) y acceso a la siguiente lección. Es navegación de la lección, no un botón dentro de la explicación.
- **Modelo de contenido:** los bloques actuales con nombres como «idea» o «concepto» se mapean a los bloques permitidos sin perder contenido. Reportar las lecciones que no puedan mapearse automáticamente.

**Animaciones por scroll.** Texto, imágenes, gráficos e ilustraciones en movimiento; **todo debe tener animación**.

- Cada figura se anima al entrar en pantalla (`IntersectionObserver`) con SVG o CSS (canvas ligero solo si hace falta): aparición progresiva, trazado de líneas, resaltado paso a paso, secuencias.
- Inventariar las figuras estáticas existentes (por ejemplo la ilustración de Doña Marta con su hoja de requisitos) y convertirlas a animadas por orden de importancia. Estilo de ilustración simple y coherente, con los tokens de color y el color de la competencia.
- Pausar las animaciones fuera de pantalla. `prefers-reduced-motion` muestra el estado final.

### 4.3 Mi progreso

**Defecto actual.** El panel se renderiza roto: un óvalo enorme cubre la pantalla y desborda los bordes, los textos están cortados («Números e…», «0 medallas» truncado) y hay scroll horizontal. **Reproducirlo y reportar la causa raíz** (probables: un `border-radius` o `clip-path` aplicado al contenedor equivocado, alturas fijas, `overflow` mal resuelto, un elemento decorativo sin contención).

**Modelo.** Una lección se marca como completada de forma explícita por el aprendiz (y se puede desmarcar). Progreso de un tema = completadas / totales. Progreso de una competencia = suma de completadas / suma de totales de sus temas. Estrellas del Laboratorio, medallas y racha son datos secundarios y no entran en el porcentaje. **Una sola función pura** calcula el progreso y la usan las tarjetas de tema, la vista de lección y este panel, con persistencia en el almacenamiento del navegador ya existente.

**Diseño.**

1. Drawer lateral desde la derecha en escritorio y bottom sheet en móvil, con botón de cierre, `Esc` y foco gestionado.
2. **Resumen:** un anillo grande con el porcentaje total; al lado, «X de Y lecciones» y la racha; estrellas y medallas como dos chips pequeños.
3. **Por competencia:** una tarjeta por competencia con su color, nombre, barra de progreso y porcentaje, principales primero.
4. **Por tema:** al desplegar una competencia (acordeón), sus temas aparecen como filas compactas con nombre, «N/M lecciones» y una barra. Cada fila es un enlace al tema; botón opcional «Continuar» a la siguiente lección pendiente.
5. Competencias sin temas: atenuadas con «Próximamente». Estado vacío (0 %): mensaje corto y amable con botón a la primera lección, sin listas de ceros.
6. `role="progressbar"` con `aria-valuenow` y etiqueta; `prefers-reduced-motion` en las barras.

### 4.4 Pasos de ejecución

1. Navegación y limpieza de la lista de temas (4.1).
2. Panel izquierdo simplificado y modelo de bloques de contenido.
3. Hoja cuadriculada con interruptor claro/oscuro.
4. Animaciones por scroll de las figuras existentes.
5. Marcado manual de lecciones y función de progreso.
6. Panel Mi progreso (incluye la corrección del defecto).

### 4.5 Criterios de aceptación

- Competencia → tema → lecciones en tres pasos con «Atrás», sin pestañas internas ni miga duplicada.
- Entre cualquier título de competencia y su grilla hay el mismo espacio; entre secciones hay un espacio claramente mayor; nada pegado ni solapado a 390 y a 1920 px.
- Todas las tarjetas de una grilla tienen el mismo tamaño y estructura.
- La lección es un documento continuo con subpartes, sin botones de siguiente paso dentro ni tarjetas con marco.
- El interruptor alterna cuadrícula blanca con texto blanco y cuadrícula negra con texto negro, y recuerda la elección.
- Cada figura migrada se anima al entrar en pantalla y respeta `prefers-reduced-motion`.
- Completar todas las lecciones de un tema lo lleva a 100 %; la mitad, a 50 %; se refleja a la vez en tarjetas, lección y panel. El porcentaje de competencia coincide con completadas/totales de sus temas.
- Mi progreso no tiene óvalos, recortes ni scroll horizontal a 390 y a 1920 px.
- Pruebas Node y E2E existentes en verde (actualizar las que dependían de las pestañas internas y del filtro de dificultad); nuevas: flujo de tres pasos, interruptor de cuadrícula, ausencia de botones en la explicación, cálculo de progreso y ausencia de desborde en Mi progreso.

## Fase 5. Ejercicios y Laboratorio por competencia y tema

**Objetivo.** Que Ejercicios, Simulador y Laboratorio se entren igual que Lecciones (competencia → tema) y que cada ejercicio se explique y resuelva en una hoja cuadriculada bien diseñada. Parte del catálogo de ejercicios aprobado en la Fase 3.

### 5.1 Ejercicios

**Inventario previo.** La vista actual de Ejercicios y `src/content/exercise-adapter.js`, `math-lessons.js`, `sources-lessons.js` y `temas.js`. Qué significan hoy «Banco», «Tema matemático», «Ejercicios de clase» y «Generar reto con semilla»; cómo se guarda la solución de cada ejercicio (¿solo enunciado y respuesta, o pasos y explicación?). Informar qué campos faltan para el contenido pedido.

**Nivel 1: selección por tarjetas.** Al entrar, solo competencias con sus temas como tarjetas (mismo componente que Lecciones). Cada tarjeta de tema muestra ícono, nombre, cantidad de ejercicios y avance resuelto/total. **Ningún filtro ni lista de ejercicios** hasta elegir un tema. «Banco» desaparece como concepto visible (si hay varios bancos por tema, se unifican en la lista del tema). Misma miga única y «Atrás» que en Lecciones.

**Nivel 2: vista del tema.**

- **Panel izquierdo (280 a 320 px):** lista numerada de ejercicios del tema en orden de dificultad creciente, con estado (pendiente, visto, resuelto). Buscador pequeño solo si el tema tiene más de unos 15 ejercicios. Dificultad como chips con **texto** (propuesta: Básico, Intermedio, Avanzado, Reto; confirmar), no cuatro botones de segmentos sin etiqueta. Si el tema tiene subtemas (Matemáticas), se agrupan como encabezados dentro de la lista; «Tema matemático» deja de ser un filtro de página. «Ejercicios de clase» pasa a ser un chip por ejercicio, filtrable desde el mismo panel.
- **Estado inicial:** se abre el primer ejercicio no resuelto, nunca un panel vacío con «Elige un reto para empezar».
- **«Generar reto con semilla»:** decidir tras el inventario. Si es útil (ejercicios generados), pasa a un botón compacto con ícono en el panel izquierdo y su resultado se muestra en la misma hoja; si no se usa, se retira de la interfaz.
- Quitar el alternador cuadrícula/lista, que la lista lateral reemplaza.

**Hoja derecha (70 % a 80 %).** Reutiliza el componente de hoja cuadriculada con interruptor de la Fase 4, así Lecciones y Ejercicios son el mismo cuaderno. Documento continuo con scroll, sin tarjetas con marco:

1. **Enunciado** completo (sin truncar) y dificultad.
2. **Conceptos que se usan**, como chips que enlazan a la lección correspondiente.
3. **Qué se pide** y **por qué se resuelve así**.
4. **Para qué sirve** y **cuándo se usa**.
5. **Solución paso a paso**, con figuras animadas por scroll (trazado, resaltado, secuencia).
6. Un único botón de acción primaria: **«Ver en el simulador»**, que abre ese ejercicio en el Simulador; si el ejercicio se practica en el Laboratorio, un enlace secundario discreto «Practicar en el laboratorio».
7. Control discreto al final: «Marcar como resuelto» (manual y desmarcable, coherente con las lecciones).

Si un ejercicio carece de algún apartado, **omitirlo, no mostrar vacíos**, e informar qué ejercicios no tienen contenido suficiente. Cambiar de ejercicio actualiza la hoja sin recargar y recuerda la posición de scroll por ejercicio. En móvil el panel izquierdo es un selector colapsable sobre la hoja.

### 5.2 Laboratorio

**Inventario previo.** `src/ui/lab.js` y los catálogos de mecánicas (el informe citaba 34, incluidas las de matemáticas y fuentes). Informar: a qué tema y competencia pertenece cada mecánica; cuáles son transversales; qué significan «Observa», «Construye», «Investiga» y «Concepto» en el modelo; cómo se calculan y guardan estrellas y medallas.

**Problema actual.** La pantalla presenta todos los retos de diagramas de flujo como si fueran el laboratorio entero, y no hay forma de llegar a los retos de otras competencias o temas.

1. **Nivel 1:** competencias → temas con el mismo componente. Cada tarjeta de tema: ícono, nombre, cantidad de retos y avance (estrellas obtenidas / posibles). Temas sin laboratorio: «Próximamente», atenuados.
2. **Mapeo mecánica → tema.** Las transversales aparecen en todos los temas a los que apliquen, **por referencia, sin duplicar código**. Informar de las mecánicas que no puedan asignarse con certeza para que las decida el usuario.
3. **Vista del tema:** una miga y «Atrás». Selector de modo compacto con texto (Observa, Construye, Investiga o los que existan) como pestañas pequeñas, no como secciones gigantes. Filtro de concepto solo con los conceptos del tema (oculto si hay menos de \~4). Dificultad con chips de texto, con los mismos nombres que Ejercicios.
4. **Tarjetas de reto compactas:** grilla `auto-fill` (mínimo \~240 px), ícono con el color de la competencia, título, una línea de descripción, duración y estrellas, altura uniforme. Quitar la ilustración dorada genérica o sustituirla por un ícono propio del reto.
5. Al abrir un reto se usa la misma ejecución del Simulador, **sin cambiar su lógica**. Volver devuelve al tema con los filtros intactos.
6. Conservar estrellas y medallas: la reorganización no puede perder progreso.

### 5.3 Simulador

Entra igual que las demás: competencia → tema → ejercicio, con la tira de ejercicios definida en la Fase 1. Para los temas cuyas simulaciones aún no se hayan migrado a la plantilla común (fuentes y matemáticas, Fase 8), se conserva el simulador existente; **ningún ejercicio simulable queda inalcanzable** durante la transición (E2E que recorra el catálogo).

### 5.4 Pasos de ejecución

1. Inventario y modelo de contenido de la hoja de solución.
2. Selección por tarjetas en Ejercicios.
3. Panel izquierdo de ejercicios.
4. Hoja con apartados y botón al simulador.
5. Animaciones de las figuras de solución.
6. Laboratorio: mapeo, selección y vista del tema.
7. Simulador: entrada competencia → tema → ejercicio.

### 5.5 Criterios de aceptación

- Entrar a Ejercicios o Laboratorio muestra solo competencia → tema; ningún reto, ejercicio ni filtro técnico hasta elegir un tema.
- Cada ejercicio y cada reto existente es alcanzable desde su tema (E2E que recorre el catálogo); ninguno queda huérfano.
- La hoja muestra enunciado completo, conceptos, solución y un solo botón «Ver en el simulador», sin tarjetas con marco ni botones extra dentro.
- El interruptor claro/oscuro de la hoja es el mismo que en Lecciones y su elección se comparte.
- Los filtros de concepto del Laboratorio reflejan solo el tema activo; estrellas y medallas se conservan.
- Sin scroll horizontal a 1920 y a 390 px.
- Pruebas Node y E2E existentes en verde; nuevas: flujo competencia → tema → ejercicio, botón al simulador, ausencia de filtros en el nivel 1, mapeo mecánica → tema y cobertura del catálogo.

## Fase 6. Datos compartidos, API de lectura y Mi ficha

**Objetivo.** Dejar el modelo de datos listo para varias fichas, una capa de acceso que desacople las vistas del origen de los datos, y rediseñar Mi ficha completa: Centro de control, Clases, Actividades y Biblioteca. Primero se construyen las vistas sobre datos de demostración mediante la capa de acceso; la API de lectura se conecta después.

**Inventario previo.** Qué datos de Mi ficha existen hoy, dónde están y en qué formato (datos de demostración, claves de `localStorage`); qué parte de «Actividades» ya está construida y por qué no es accesible desde la navegación; qué campos tienen hoy clase, evidencia, documento, competencia e instructor; cómo se despliega el proyecto (workflows, Worker, activos estáticos). Verificar en la documentación vigente de Cloudflare los límites actuales del plan gratuito de Workers y D1 y reportarlos.

### 6.1 Modelo de datos (multi-ficha)

Todo dato compartido lleva `ficha_id`. Campos comunes: `id`, `creado`, `actualizado`, `estado` (`borrador` o `publicado`) y borrado lógico. Usar ids estables, nunca nombres.

| Entidad | Campos principales |
| --- | --- |
| `fichas` | código (por ejemplo el número de ficha), nombre, programa, activa, configuración |
| `competencias` | nombre, `tipo` (principal o transversal), color, orden, activa. Se editan por ficha |
| `instructores` | nombre, competencias que dicta, contacto opcional (correo, teléfono, foto) con indicador `contacto_publico`, **falso por defecto** |
| `horario_bloques` | día, inicio, fin, `competencia_id`, `instructor_id`, confirmada o por confirmar, vigencia |
| `clases` | fecha, `competencia_id`, `instructor_id`, estado (`se_dicto`, `no_hubo`, `por_venir`, `por_confirmar`), título del tema, temas vistos (lista) |
| `documentos` | título, tipo, enlace, `competencia_id`, `instructor_id`, fecha, `clase_id` y `evidencia_id` opcionales, origen (`material` o `evidencia`) |
| `evidencias` | título, descripción corta, fecha límite, `competencia_id`, `clase_id`, tema o resultado de aprendizaje (texto secundario), documentos adjuntos |
| `comunicados` | título, texto, fecha, fijado, autor |

Notas: la «materia» del horario se trata como la competencia del bloque, salvo que el inventario demuestre que hace falta una entidad distinta. Una evidencia puede tener uno o varios documentos adjuntos, distintos del material de apoyo de la clase. Quitar o desactivar una competencia no deja evidencias ni clases huérfanas: la desactivación las conserva y las muestra con un estilo neutro.

**Estado personal en el navegador, separado de los datos compartidos:** evidencia marcada como hecha, lecciones y ejercicios completados, favoritos de la Biblioteca y preferencias de interfaz.

### 6.2 Capa de acceso y API de lectura

1. **Capa `repositorio`.** Las vistas no conocen la API ni el almacenamiento: solo el repositorio. Implementaciones intercambiables: demostración (datos de ejemplo claramente marcados), local y remota. Con respaldo local si la API falla. Cambiar de origen no toca las vistas.
2. **API de lectura** en el Worker existente con D1: una consulta de instantánea publicada por ficha y una marca de versión barata. Identificar la ficha por la dirección (código de ficha en la ruta, con ADSO como valor por defecto).
3. **Migraciones de D1** en archivos SQL versionados en el repo.
4. **Cómo llegan los cambios al aprendiz:** al abrir la app o al recuperar el foco se consulta la marca de versión y solo se refresca lo nuevo; indicador «Actualizado hoy a las 18:05» e insignia «Nuevo» en lo reciente; copia local para funcionar sin conexión (service worker). Con la API caída, mostrar la última copia y avisar.
5. **Cuidar el límite gratuito:** la caché y la consulta mínima de versión mantienen las lecturas muy por debajo del tope diario; añadir un aviso en el panel de administración si el uso se acerca al límite.
6. Datos reales: mientras no estén cargados, la etiqueta «Datos de demostración» sigue visible; al publicar datos reales de la ficha desaparece.

### 6.3 Centro de control

**Estructura general.** Dos «pantallas» verticales a altura completa (`100dvh` menos la cabecera): la primera con **Horario** y **Evidencias pendientes**; la segunda con **Instructores** y **Comunicados**. Todo lo existente en esos paneles se conserva; se reorganiza y se rediseña.

**Encabezado de página compacto.** Una sola franja horizontal: a la izquierda la etiqueta «Mi ficha · Centro de control», «Martes, 17 de noviembre» (mayúscula de oración) y el resumen en una línea («4 evidencias por entregar · clase hoy a las 18:00»); a la derecha, la píldora «Datos de demostración» mientras aplique. Alto de una o dos líneas más padding; se acabó el apilado vertical que empuja el contenido.

**Primera pantalla, sin recortes.**

- Horario y Evidencias se ven **completos** al entrar, a 1920×1080 y sin scroll de página: ningún panel se corta contra el borde inferior.
- **Horario:** cuadrícula de 3 columnas × 2 filas (Lunes a Sábado), tarjetas que se reparten el alto, «Ver clases» visible dentro del panel. Tipografía y padding ajustados para que entren las dos filas completas, incluido el sábado con dos clases.
- **Evidencias pendientes:** el título del panel queda fijo; solo la lista tiene scroll interno. Tarjetas compactadas (menos padding, descripción de máximo 2 líneas) para que quepan al menos 3 a 1080 px de alto.

**Segunda pantalla.** Instructores y Comunicados lado a lado, mismo alto y estructura de columnas que la primera. Solo se reubican; no se altera su contenido.

**Desplazamiento tipo película.**

1. Contenedor con scroll vertical y `scroll-snap-type: y mandatory`; cada pantalla es un punto de anclaje de alto completo.
2. **Un solo gesto de rueda o deslizamiento mueve la vista completa** a la otra pantalla, con transición suave de 500 a 700 ms con curva de aceleración, como una tira que se desplaza en bloque; nunca queda a medias.
3. Si el snap nativo no logra ese efecto en todos los navegadores, manejar `wheel` y táctil para mover exactamente una pantalla por gesto, con bloqueo breve contra saltos múltiples.
4. Teclado (flechas, RePág y AvPág, `Tab`) y un indicador discreto de posición con dos puntos clicables. `prefers-reduced-motion`: cambio directo sin animación.
5. En ventanas bajas o móvil, si una pantalla excede el alto, permitir scroll normal en lugar de snap forzado para no ocultar información.

**Color por competencia (con el sistema de la Fase 2).**

- **Tarjeta de día en el Horario:** tinte translúcido y sutil del color de la competencia (degradado, entre 8 % y 14 % de opacidad) en toda la tarjeta, no solo en la píldora de hora, manteniendo el contraste del texto. En días con varias clases (sábado): marca de color por cada clase y tinte del color de la primera confirmada.
- **Tarjeta de «Hoy»:** conserva el borde verde de énfasis y suma el tinte, sin perder la diferencia con los demás días.
- **Tarjetas de evidencias:** borde izquierdo, ícono y nombre de competencia en el color de la competencia a la que pertenecen, más un tinte igual de sutil. Reemplaza el verde uniforme actual, de modo que se vea de un vistazo qué evidencia es de qué competencia.
- Los chips de estado («venció ayer», «vence mañana», «vence en 4 días») usan colores y formas propios, distintos de los de competencia. Evidencia sin competencia identificable: color neutro.
- Conservar la regla de color por género si existe (ver decisión abierta 4).

### 6.4 Clases

**Propósito.** Que el aprendiz seleccione un día y vea, en una sola página, tres cosas: lo que se vio, los documentos que el instructor compartió ese día y las evidencias que pidió (con su documento propio si lo hay, distinto del material de apoyo).

1. **Encabezado:** etiqueta «Mi ficha · Clases», título «Clases», subtítulo «Semana del 16 al 21 de noviembre» (corregir la capitalización actual) y, a la derecha, el selector Diaria / Semana / Mes.
2. **Tira de días a todo el ancho:** las seis tarjetas se reparten uniformemente el ancho disponible (hoy ocupan menos de la mitad). La insignia numérica gana significado explícito: ícono de evidencias más cantidad, con tooltip. Estados admitidos: **Se dictó**, **No hubo clase**, **Por venir**, **Por confirmar**, cada uno con ícono y color propio, además del color de la competencia.
3. **Detalle del día**, en cuadrícula que use el ancho completo y entre en la ventana sin scroll a 1080 px de alto cuando sea posible. Encabezado: «Martes, 17 de noviembre de 2026», chip de estado y el tema de la clase con el color de su competencia. Tres bloques:
   - **Lo que se vio:** lista de temas.
   - **Material del instructor:** tarjetas de documento (ícono por tipo, nombre, botón de abrir).
   - **Evidencias pedidas:** una tarjeta por evidencia con título, fecha límite, estado (abierta, vencida, entregada) y, si existe, su **documento adjunto propio**, marcado de forma distinta al material de apoyo.
4. **Estados vacíos** por bloque («Sin material compartido este día»).
5. **Semana y Mes:** cada día muestra un resumen compacto (estado y cantidad de evidencias); el clic abre el detalle del día.
6. **Enlaces cruzados:** desde un documento, abrirlo en la Biblioteca; desde una evidencia, ir a Actividades.

### 6.5 Actividades (subsección nueva en la barra)

Añadir «Actividades» a la barra de Mi ficha (Centro de control, Clases, **Actividades**, Biblioteca). Enlazar a la vista ya construida si existe (ver inventario) o crearla. Propósito: que el aprendiz sepa **qué evidencias ya debería haber entregado y cuáles siguen abiertas**, algo que el Drive actual no le dice.

1. **Panel «Pendientes» (arriba, acceso rápido).** Filtros por periodo (Hoy, Mañana, Semana, Mes) y por competencia. Tarjetas con título, competencia (color), fecha límite con chip de estado, casilla «Marcar como hecha» y enlace a la clase de origen. Orden por fecha límite ascendente. Estado vacío: «Nada pendiente».
2. **Panel «Por competencia» (abajo).** Fila de tarjetas, una por competencia, con su color y tres contadores: **vencidas sin entregar**, **abiertas** y **entregadas**. Al hacer clic en una, se despliega su lista de evidencias pedidas hasta la fecha actual, agrupada en «Debería estar entregada» (plazo vencido sin marcar como hecha) y «Abiertas», con «Entregadas» colapsada.
3. **Un único componente de tarjeta de evidencia**, reutilizado en Centro de control, Clases y Actividades, con el color de su competencia.
4. «Hecha» se guarda en el navegador y **las tres vistas leen el mismo estado**: marcar en una se refleja en las otras.
5. Diseño: tarjetas limpias, poco texto, jerarquía clara, temas claro y oscuro, móvil sin desbordes.

### 6.6 Biblioteca

**Diagnóstico.** Hoy es una pantalla de ocho filtros con una lista vacía: pensada como buscador, aunque el aprendiz suele recordar «el documento de matemáticas de la clase de ayer». Debe ser el acceso rápido a todos los documentos compartidos y con el mismo lenguaje visual del resto.

1. **Fuente única de documentos.** Los documentos que aparecen en Clases y en las evidencias salen de esta misma colección. Si hoy están duplicados o separados, unificarlos sin perder datos.
2. **Encabezado compacto:** título y contador en una línea; eliminar el subtítulo o dejarlo en una línea de apoyo.
3. **Fila de competencias:** tarjetas con color, ícono, nombre y conteo; selección única más «Todas»; `aria-pressed`. Es la misma esencia que el panel «Por competencia» de Actividades.
4. **Buscador, chips de tipo y orden en una sola franja.** Tipos: PDF, Documento, Presentación, Enlace, Imagen, Otro. Tema, instructor y rango de fechas pasan a «Más filtros», colapsado por defecto, con contador de filtros activos y «Limpiar».
5. **Tarjetas de documento** en grilla `auto-fill` (mínimo \~240 px): ícono por tipo, título (máximo 2 líneas), chip de competencia, instructor, fecha relativa, insignia de origen («Material de clase» o «Para evidencia») y botón «Abrir» en pestaña nueva con `rel="noopener noreferrer"`. Tinte sutil del color de la competencia.
6. **Enlaces cruzados:** «Ver clase» lleva a Clases con el día seleccionado; «Ver evidencia» lleva a Actividades; desde el detalle de clase, abrir un documento lleva a su tarjeta resaltada en la Biblioteca.
7. Sección «Recientes» (hasta 5) cuando no hay filtros activos.
8. **Estados vacíos útiles:** sin documentos (mensaje claro y, solo en modo moderador, botón «Agregar documento»); sin resultados («Limpiar filtros»).
9. **Alcance de esta etapa:** los documentos son **enlaces** (Drive u otros). La subida real de archivos queda fuera.
10. Datos de demostración: incluir unos pocos documentos de ejemplo claramente marcados para validar el diseño.

### 6.7 Pasos de ejecución

1. Inventario, modelo de datos y capa `repositorio` con datos de demostración.
2. Migraciones de D1, API de lectura, marca de versión, caché y funcionamiento sin conexión.
3. Centro de control: encabezado compacto y primera pantalla sin recortes.
4. Centro de control: segunda pantalla y desplazamiento tipo película.
5. Color por competencia en Horario y Evidencias.
6. Clases.
7. Actividades.
8. Biblioteca.

### 6.8 Criterios de aceptación

- A 1920×1080 se ven completos Horario y Evidencias sin recortes y sin scroll de página; un solo gesto de scroll lleva a Instructores y Comunicados con transición suave, y de vuelta; nunca queda a medias.
- Cada día del Horario muestra el tinte de su competencia y cada evidencia el mismo color de su competencia (verificable con el mapa único de la Fase 2).
- Seleccionar un día en Clases muestra temas, material y evidencias (con su documento adjunto) en una sola vista.
- Actividades es accesible desde la barra; Pendientes filtra por periodo y competencia; Por competencia separa vencidas de abiertas; marcar «hecha» se refleja en Centro de control, Clases y Actividades.
- Un documento registrado en una clase aparece en la Biblioteca y viceversa, sin duplicar datos; con dos clics se llega a un documento (competencia → tarjeta).
- Funciona con `prefers-reduced-motion`, con teclado y en móvil sin pérdida de contenido.
- Con la API caída, la app muestra la última copia y avisa.
- Pruebas Node y E2E existentes en verde; nuevas: ausencia de recortes en la primera pantalla, snap entre pantallas, coincidencia de color competencia ↔ evidencia, repositorio de datos, filtros de Actividades y filtrado combinado de la Biblioteca.

## Fase 7. Panel de moderador y autenticación

**Objetivo.** Que el moderador (inicialmente el propio usuario) actualice la plataforma todos los días con un formulario, de forma profesional y sin tocar código, y que los cambios lleguen a todos los aprendices. **Prohibido** el esquema de actualizar con commits o archivos estáticos.

**Arquitectura (plan gratuito de Cloudflare).** El Worker existente expone la API; D1 guarda los datos; Cloudflare Access protege el panel y las rutas de escritura. **Antes de comprometer la solución, verificar en la documentación vigente los límites del plan gratuito** de Workers, D1 y Access (referencia a la fecha de este documento: 100.000 peticiones diarias de Workers; 5 millones de lecturas y 100.000 escrituras de filas por día y 5 GB en D1; hasta 50 usuarios en Access) y reportar cualquier diferencia. Con el plan gratuito, al superar el tope diario las consultas a D1 fallan hasta el reinicio del día; el diseño de caché de la Fase 6 lo previene.

### 7.1 Autenticación

1. Cloudflare Access protege la ruta del panel y las rutas de escritura de la API, con una lista de correos permitidos.
2. **El Worker valida el token de Access en el servidor** en cada escritura. No confiar solo en que la ruta esté protegida. Ningún secreto ni contraseña en el código del cliente.
3. Permisos por ficha: un moderador solo edita datos de su `ficha_id`. Diseñar el esquema de permisos para incorporar luego a los instructores con alcance acotado (solo sus clases y evidencias) sin rehacer nada.
4. Documentar que el tope gratuito de 50 usuarios de Access se comparte entre todas las fichas y qué hacer al acercarse.

### 7.2 API de escritura

Creación, edición y borrado lógico con **validación de esquema en el servidor**; estados borrador y publicado; al publicar, se incrementa la marca de versión global; registro de auditoría (quién, cuándo y qué cambió); deshacer la última publicación; CORS restringido; entradas saneadas; enlaces de documentos validados (https). Límite de frecuencia simple.

### 7.3 Panel «Administrar» (usable desde el celular)

Misma calidad de interfaz que el resto (sección 4): tokens, una acción primaria por vista, objetivos táctiles de 44 px, borrador visible y confirmaciones discretas.

1. **Registro rápido del día.** Fecha por defecto hoy; «¿Hubo clase?»; competencia e instructor preseleccionados según el horario; temas vistos (campo multilínea que se convierte en lista); documentos (nombre y enlace, con el tipo detectado por extensión o dominio); evidencias (título, descripción corta, fecha límite, competencia heredada de la clase, documento opcional). Precarga desde la clase anterior de la misma competencia, duplicar evidencia, guardado automático de borrador, `Ctrl+Enter` para guardar y un botón «Publicar».
2. **Gestión** con formularios simples de: competencias (añadir, quitar, desactivar, renombrar, tipo y color), horario semanal, instructores (nombre; contacto opcional solo con consentimiento; foto como enlace o imagen redimensionada) y comunicados (título, texto, fecha, fijado).
3. **Vista previa** «como la ve el aprendiz», historial de cambios recientes y **deshacer** la última publicación.
4. **Exportar e importar** un respaldo completo en JSON.
5. Validaciones: fechas coherentes, campos obligatorios mínimos y confirmación antes de borrar.

### 7.4 Qué hace el usuario y qué hace Codex

- **Usuario:** crear la base de datos D1 en su cuenta de Cloudflare, activar Access con su correo y aprobar el despliegue. Codex entrega los pasos exactos, comandos incluidos.
- **Codex:** esquema y migraciones, API, panel, pruebas de permisos y esquema, caché y documentación.

### 7.5 Fuera de alcance

Cuentas de aprendices, sincronización del estado personal entre dispositivos, subida real de archivos (solo enlaces), notificaciones push.

### 7.6 Pasos y criterios

**Pasos:** (1) esquema y autenticación; (2) API de escritura con validación y permisos; (3) registro rápido del día; (4) gestión de competencias, horario, instructores y comunicados; (5) vista previa, historial, deshacer y respaldo.

**Criterios de aceptación.**

- Un cambio publicado desde el panel aparece en otro dispositivo al abrir la app o al volver a ella, sin desplegar código.
- Quitar o desactivar una competencia no deja evidencias ni clases huérfanas ni rompe vistas.
- Solo el moderador autenticado puede escribir: las peticiones de escritura sin sesión o con token inválido devuelven error (prueba automatizada), y un moderador no puede editar otra ficha.
- Exportar e importar JSON reproduce el mismo estado.
- Se puede registrar una clase completa en pocos pasos desde el celular.

## Fase 8. Migración de las simulaciones de fuentes y matemáticas

**Objetivo.** Que las simulaciones de Fuentes de información y de Matemáticas usen la carcasa común de la Fase 1, con plantillas y escenas propias de su contenido, sin perder ningún ejercicio.

**Inventario previo.** `src/ui/source-simulator.js` y las mecánicas de matemáticas: qué datos por paso generan, qué visualizaciones tienen y qué comparten con la carcasa.

**Plantillas propuestas** (a refinar con el usuario antes de programar):

- **`clasificacion`** (fuentes de información): lienzo con tabla o zonas de clasificación (primaria, secundaria, terciaria); escenas como Clasificar, Relacionar técnica con tipo de fuente y Comparar fuentes; estado: evidencias recolectadas.
- **`calculo`** (matemáticas): lienzo con recta numérica, balanza o cuadrícula de fracciones según el tema; escenas como Operar, Ubicar en la recta, Simplificar, Convertir porcentaje y Regla de tres; estado: resultado parcial.

**Pasos.**

1. Informe de inventario y de brecha frente al contrato de paso.
2. **Documento de diseño de escenas por plantilla**, con ejemplos que aporte el usuario (por ejemplo cómo imagina clasificar fuentes o resolver una operación con fracciones). **Aprobación del usuario antes de implementar.**
3. Migrar `clasificacion`, luego `calculo`.
4. Retirar el código del simulador antiguo solo cuando no queden usos.

**Criterios de aceptación.** La carcasa no cambia; cada ejercicio simulable existente sigue alcanzable y se comporta igual o mejor; los temas nuevos futuros de TICs y Comunicación pueden elegir una plantilla existente o crear una nueva siguiendo la guía «Cómo agregar un tema nuevo»; pruebas Node y E2E en verde.

## Anexo A. Definición de «terminado» para cada step

1. Hace lo pedido y nada fuera de alcance; `reference/` intacto.
2. Pruebas existentes en verde y pruebas nuevas añadidas.
3. Checklist de UI de la sección 4.8 completo, con capturas en 4 tamaños y 2 temas.
4. Sin scroll horizontal, sin texto cortado ni solapado, sin tarjetas anidadas.
5. Estados de cargando, vacío y error cubiertos.
6. Reporte del step: cambios, archivos, pruebas, capturas, riesgos y pendientes.
7. Documentación actualizada cuando cambian capacidades o conteos (README, mapa del repositorio y estado de implementación, hoy desfasados).

## Anexo B. Entregables por fase

| Fase | Entregables |
| --- | --- |
| 0 | Cabecera unificada; modo enfoque; helper de pruebas de UI |
| 1 | Informe de inventario; carcasa y contrato documentados; simulador de diagramas de flujo; documento de escenas aprobado; guía «Cómo agregar un tema nuevo» |
| 2 | Mapa único de competencias; tokens y pruebas de contraste; documento «Cómo agregar o modificar una competencia» |
| 3 | `docs/auditoria-ejercicios.md` y CSV; propuesta de esquema único |
| 4 | Aprende con navegación nueva; Lecciones con hoja cuadriculada y animaciones; Mi progreso |
| 5 | Ejercicios, Laboratorio y Simulador organizados por competencia y tema |
| 6 | Modelo multi-ficha; `repositorio`; API de lectura; Mi ficha completa |
| 7 | Panel de moderador; autenticación; API de escritura; respaldo |
| 8 | Plantillas `clasificacion` y `calculo` sobre la carcasa común |

## Anexo C. Lo que Codex debe preguntar al usuario (no asumir)

1. **Archivo de referencia** del simulador, si no está en el repo (Fase 1).
2. **Contactos de instructores:** públicos, restringidos u opcionales con consentimiento.
3. **Contenido de aprendizaje entre fichas:** catálogo común con activación por ficha, o propio por ficha.
4. **Etiqueta «Lógica de programación»** en las evidencias y si existe una competencia propia de programación.
5. **Regla de color por género** del instructor en el horario: si se mantiene.
6. **Nombres de los niveles de dificultad** (Básico, Intermedio, Avanzado, Reto).
7. **Mecánicas transversales del Laboratorio:** repetir por tema o asignar a uno.
8. **«Generar reto con semilla»:** conservar o retirar.
9. **Sábado con dos clases:** tinte del color de la primera o banda dividida (propuesta por defecto en 6.3: marca por clase y tinte de la primera).
10. **Contenido de las soluciones de ejercicios:** que Codex redacte borradores por tema (piloto en diagramas de flujo) para aprobación del usuario.

## Anexo D. Glosario

- **Ficha:** grupo de formación del SENA (por ejemplo, la ficha de ADSO).
- **Competencia principal / transversal:** las principales definen el eje del programa; las transversales (Comunicación, Matemáticas, TICs) lo acompañan.
- **Evidencia:** entregable que el instructor pide al aprendiz.
- **Moderador:** persona que actualiza los datos compartidos de una ficha.
- **Escena:** mini-animación del panel «En escena» que explica visualmente un paso del simulador.
- **Contrato de paso:** formato de datos que cualquier tema entrega a la carcasa del simulador.
- **Hoja cuadriculada:** fondo de cuaderno con cuadrícula, en modo claro u oscuro, donde se leen lecciones y soluciones.
