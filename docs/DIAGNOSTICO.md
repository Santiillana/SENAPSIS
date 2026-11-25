# Diagnóstico del simulador Senapsis

Fecha de inspección: 15 de noviembre de 2026
Rama inspeccionada: iteración histórica de mejoras del Simulador v2
HEAD inspeccionado: `b126f8eaa491a6e108c938e0cee634c78983b4ae`
Referencia original: `reference/diagramas_de_flujo_original.html` (blob `9f7f5a3d68d10b004e2ea306df1109906f13bc33`).

## Resumen ejecutivo

El simulador actual conserva el motor determinista, el SVG generado desde pseudocódigo, las escenas didácticas y la sincronización por snapshots. Sin embargo, la experiencia visual inmersiva de la referencia no se migró: la vista sigue organizada como tarjetas en una cuadrícula, con el diagrama dentro de una tarjeta con scroll. La diferencia es estructural, no un problema de despliegue únicamente.

## 1. Diferencia estructural

En la aplicación modular, `index.html:95-163` define `.simulator-grid` con cinco zonas: Problema, Diagrama, Inspector, Historial y dock. `src/styles/simulator.css:2` fija tres columnas y filas separadas; `src/styles/simulator.css:24` da al escenario una altura mínima de 505 px y originalmente permite scroll interno. Aunque reglas posteriores limitan el desbordamiento, el contenedor sigue siendo una tarjeta de la cuadrícula.

La referencia utiliza otra composición:
- `reference/diagramas_de_flujo_original.html:61-65`: `#hd` fijo de 54 px y `#wrap` fijo desde el píxel 54 hasta el fondo, sin borde ni radio.
- `reference/diagramas_de_flujo_original.html:66-70`: paneles de vidrio fijos y dock inferior flotante.
- `reference/diagramas_de_flujo_original.html:101-106`: columna derecha `#RC`, con `#PV` y `#PR`.
- `reference/diagramas_de_flujo_original.html:86-100`: tamaño base `--fs:17`, panel izquierdo de 21 em y dock de 920 px.
- `reference/diagramas_de_flujo_original.html:143-145`: dimensión de la zona derecha basada en el tamaño de texto.

Por tanto, la aplicación actual sí tiene una cuadrícula CSS de columnas para el simulador; la referencia coloca el lienzo como escenario a pantalla completa y ventanas superpuestas en los bordes.

## 2. Inventario de elementos de la referencia

| Elemento | ¿Existe en el repositorio? | Evidencia |
|---|---|---|
| Posicionamiento fijo para el escenario/ventanas | Parcial: hay elementos flotantes, pero no el escenario inmersivo ni sus tres ventanas | `src/styles/layout.css:8` (cabecera sticky); `src/styles/simulator.css:196` (salida de fullscreen absoluta) |
| `backdrop-filter` | Sí, en la cabecera global; no en las ventanas del simulador | `src/styles/layout.css:8` |
| `color-mix()` | Sí, utilizado en estados del diagrama, escenas y resaltados | `src/styles/simulator.css:38,63,126` |
| `--fs` | No como token del simulador | Referencia: `reference/diagramas_de_flujo_original.html:86`; el repositorio usa `--pseudocode-font-size` en `src/ui/simulator.js:376-380` |
| `--dk` | No como cálculo de altura del dock del simulador | Referencia: `reference/diagramas_de_flujo_original.html:86,426-429` |
| `--k` | No como factor común de velocidad de animación | Referencia: `reference/diagramas_de_flujo_original.html:86,117,479`; velocidad actual en `src/ui/simulator.js:346-354` |
| `.pn` | No; los paneles usan clases específicas `.panel` y `.problem-panel` | `index.html:100-163`; `src/styles/simulator.css:2-4` |
| `.chip` de vuelo | No; el token actual es un círculo SVG dentro del diagrama | Referencia: `reference/diagramas_de_flujo_original.html:76`; repositorio: `src/diagram/renderer.js:57-60,83-111` |
| `#dock` | Existe como concepto/clase, pero no con el identificador de la referencia ni como ventana fija | `index.html:150-162`; `src/styles/simulator.css:67-72` |
| Grafo de rutas / Dijkstra | No en el simulador modular | Referencia: `reference/diagramas_de_flujo_original.html:387-400`; `src/ui/simulator.js:252-290` actualiza snapshots y resaltados |
| Vuelo de chips `fly()` | No | Referencia: `reference/diagramas_de_flujo_original.html:340-375`; sin equivalente en `src/ui/simulator.js` |
| Ventana contextual `showVF()` | No | Referencia: `reference/diagramas_de_flujo_original.html:487-506`; la auditoría clasifica el panel persistente como sustitución de UI en `docs/ORIGINAL_FEATURE_AUDIT.md` |
| Rastro del token | No como polilínea animada por el grafo | Referencia: `reference/diagramas_de_flujo_original.html:385-424`; repositorio: `src/diagram/renderer.js:83-111` |
| Cámara con `requestAnimationFrame` | Parcial: hay RAF para encuadre y redimensionado, no para la interpolación completa por rutas | Referencia: `reference/diagramas_de_flujo_original.html:405-414`; repositorio: `src/ui/simulator.js:73,204-215,422,554` |

El repositorio conserva SVG y una ficha móvil del nodo activo; no conserva el grafo geométrico, el rastro ni las animaciones de transferencia de la referencia.

## 3. Especificación anterior, implementación e historial

`docs/MASTER_SPEC.md:124-140` pide tres áreas conceptuales (problema a la izquierda, diagrama central, inspector a la derecha) y un dock inferior. También pide que los paneles no tapen el diagrama, que se puedan contraer o adaptar y que la cámara evite los nodos. No exige que el diagrama permanezca dentro de una tarjeta ni que haya scroll interno. Por ello, el diseño de tarjetas no es una obligación inequívoca de MASTER_SPEC; es la composición elegida durante la migración.

`docs/ORIGINAL_FEATURE_AUDIT.md` declara el panel flotante original `#vf` como “Sustitución intencional de UI”: la función educativa se trasladó a “En escena”, pero se descartó la ventana junto al nodo. La sustitución explica una parte visible de la diferencia.

Historial comprobado por archivo:
- `index.html`: commits de módulos `19c1efb826` (M1), `b15acd5bdd` (M2), `fd7d574abd` (M3), `fc77b2d68a` (M4) y `e510f53404` (M5); cambios posteriores del inicio y el constructor incluyen `716f9b8cc2`.
- `src/ui/simulator.js`: `fd7d574abd` (M3), `e510f53404` (M5), `f7059ac09b` (escenas compartidas), `99ff6af59f` (narración de decisiones/ciclos), `2e38ec0fba` (tamaño de pseudocódigo).
- `src/styles/simulator.css`: `fd7d574abd`, `e510f53404`, `6b683ea3d8`, `51caacd465`, `26c8b80ae4`, `b997bd690c`.

Conclusión causal:
1. **(a) No se implementó la paridad estructural**: nunca se reemplazó la cuadrícula de tarjetas por el escenario fijo de la referencia.
2. **(c) Se implementó parcialmente**: se migraron el SVG, la traza, la cámara básica, escenas, variables, historial y laboratorio didáctico; no se migraron la ruta geométrica de Dijkstra, los vuelos ni la ventana flotante contextual.
3. **(b) Hubo decisiones visuales internas que consolidaron la diferencia**: el panel flotante se documentó como sustitución intencional; el dock se decidió como fila del grid en `docs/DECISIONS.md` (D-005).
4. **(d) El despliegue no es la causa principal del aspecto de la rama**: la rama no está en producción, pero su propio `index.html` conserva la composición de tarjetas.

## 4. Qué versión sirve cada entorno

Git informa que `main` apunta a `d63acf146860209b2866460fbe34294b7c2d28ae`; la PR #7 tiene como cabeza `b126f8eaa491a6e108c938e0cee634c78983b4ae` y sigue abierta contra `main`. La diferencia de ramas está verificada por la metadata de GitHub. El repositorio no contiene un archivo de configuración de Cloudflare Worker que permita verificar de manera independiente el commit publicado por el Worker. Según la configuración de despliegue descrita en la solicitud (Worker compila solo `main`), producción tomaría `main`, no la cabeza de la PR. La URL activa y el commit exacto servido no se han consultado desde el dashboard de Cloudflare.

## 5. Causas ordenadas y plan correctivo

1. **Jerarquía y posicionamiento incorrectos:** mover la vista del simulador a una composición de escenario de viewport, cabecera compacta, dos ventanas laterales y dock flotante; mantener intacta la navegación 01–05.
2. **Paneles que consumen el centro:** limitar izquierda y derecha a 21 em y min(30 em, 34 vw), y calcular el área libre para cámara.
3. **Geometría distinta:** acercar anchura y alturas de las figuras a la referencia y mantener las ramas V/F sin cruces.
4. **Cámara y navegación incompletas:** sustituir scroll por una transformación única, zoom bajo el cursor, pan capturado y minimapa.
5. **Coreografía y contexto ausentes:** construir rutas sobre conectores reales, ventanita no intrusiva y transferencias cancelables.
6. **Aceptación no específica:** añadir pruebas geométricas que midan el prototipo original en runtime y comparen el simulador a 1920×1080; ampliar la batería con móvil, navegación y accesibilidad.

No se modificó `main`, el intérprete, los contenidos ni los otros espacios durante este diagnóstico.
