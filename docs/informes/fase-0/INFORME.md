# Informe de cierre — Fase 0: cabecera unificada y compacta

**Fecha:** 17 de noviembre de 2026
**Estado:** completada
**Evidencia visual:** [índice de 72 capturas](./capturas/README.md)

## Inventario verificado

- `index.html` contiene la cabecera compartida y las nueve vistas principales: Inicio, Centro de control, Clases, Actividades, Biblioteca, Lecciones, Ejercicios, Simulador y Laboratorio.
- `src/ui/navigation.js` actualiza el espacio y la sección activa. La subsección visible «Lecciones» conserva el identificador interno `learn`; el selector principal conserva «Aprende».
- `src/styles/shell.css` define la cabecera general. `src/styles/simulator.css` conserva reglas particulares del lienzo y del modo Concentración; las pruebas verifican que no cambien la posición o altura de la cabecera normal.
- `src/ui/simulator.js` controla el modo Concentración, su salida por teclado y los controles del simulador. La cabecera permanece visible por defecto y se oculta solo mientras el usuario activa ese modo.
- El repositorio ya tenía pruebas de foco, teclado y movimiento reducido. Se amplió la comprobación de cabecera y se añadió un helper común de layout en `e2e/ui-layout.js`.

## Cambios realizados

- Se agregó «Actividades» a la navegación compartida y se unificó la etiqueta visible «Lecciones» en la subsección y su vista.
- Se comprueba que la cabecera tenga posición `sticky`, no supere 104 px y conserve la misma geometría entre espacios.
- El helper revisa ancho desplazable de `document` y `body`, elementos fuera del viewport y solapamientos entre regiones marcadas. Reconoce el contenido dentro de contenedores con desplazamiento horizontal propio; sigue comprobando que esos contenedores permanezcan dentro del viewport.
- La matriz automatizada cubre las nueve rutas, cuatro tamaños y dos temas. Para respetar el límite normal de cada prueba, se distribuyó en ocho pruebas, una por combinación de tamaño y tema.
- La matriz reveló y permitió corregir desbordamientos reales: filtros de dificultad de Ejercicios en tableta, selector de velocidad del Simulador en móvil y subnavegación del Simulador en tableta. La navegación interna puede desplazarse sin crear scroll horizontal global.
- Se corrigió el panel de práctica del Laboratorio para que aparezca al iniciar una mecánica y se restauró el seguimiento automático de cámara después de avanzar tras un paneo manual.

## Validación

- `npm test`: **345/345**.
- E2E: **144/144**, dos workers, duración 4,3 minutos. El servidor gestionado por Playwright dejó de responder durante una corrida extensa; se aisló el servidor estático y se repitió la misma suite de dos workers con `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173`. La corrida final persistente no tuvo rechazos de conexión.
- La prueba de humo de producción toma cerca de 11 s aislada y 20,7 s bajo contención. Se fijó un límite específico de 35 s para ese caso, que ejecuta cuatro recorridos y hasta 50 avances; en la corrida final terminó en 13 s.
- La referencia protegida `reference/` no se modificó. `~/Descargas/diagramas_de_flujo.html` y `reference/diagramas_de_flujo_original.html` son idénticos según `cmp`, por lo que no se creó una copia adicional.

## Clasificación del primer baseline estable (26 fallos)

El primer intento tuvo rechazos de conexión después de que el servidor local dejara de responder; se descartó como medición de fallos de producto y se repitió. En el baseline estable, 110 de 136 pruebas pasaron y los 26 fallos se clasificaron así:

| Pruebas del baseline | Clase | Causa y tratamiento |
| --- | --- | --- |
| `expert-and-builder`: catálogo experto; filtro por clase; búsqueda/paginación; tres pruebas de Constructor | (a) expectativa obsoleta | Selectores de nivel y controles ocultos cambiaron; la interfaz ya no pagina; «Arma el diagrama» se identifica por `data-lab-activity`, no por el modo común `build`. Se actualizaron selectores e interacción sin eliminar cobertura. |
| `module-2`: filtros/dificultad y solución del ejercicio; `module-3`: abrir ejercicio en Simulador | (a) expectativa obsoleta | El contador y el modal de confirmación ya no existen. Las pruebas consultan tarjetas y siguen el inicio directo vigente, manteniendo la protección del pseudocódigo. |
| Cinco pruebas de mecánicas de `module-4` | (b) regresión real | `showLabMode()` mostraba el espacio de práctica sin mostrar `#lab-task-panel`; se corrigió el estado visible del panel. |
| `module-5-release-audit`: auditoría de rutas, auditoría de ancho y almacenamiento bloqueado | (a) expectativa obsoleta | El producto tiene nueve espacios de navegación; día, semana y mes viven dentro de Clases. Se sustituyó el recuento antiguo y se mantuvieron los chequeos de rutas y anchos. |
| `module-5`: paneo de cámara y catálogo de 45 retos | (b)/(a) | El paneo manual no reactivaba la cámara al avanzar: se añadió esa transición. El catálogo ya no usa `#exercise-count`; la prueba cuenta tarjetas. |
| `module-6-home-builder`: progreso; accesos de Inicio; Constructor e historial | (a) expectativa obsoleta | Inicio ofrece dos tarjetas de espacio; el progreso de Lecciones está en su propia vista y el catálogo actual tiene 40 lecciones. Se reescribieron las expectativas y se conservaron persistencia, navegación, historial y atajos del Constructor. |
| `module-7-activities`: seguimiento personal | (a) expectativa obsoleta | El resultado «Por corregir» pasa a la lista «Culminadas». La prueba cambia de lista y vuelve a seleccionar la actividad antes de verificar el estado. |
| `shared-navigation-header`: matriz de layout | (a) expectativa del helper | Contenido desplazable interno se confundía con desbordamiento global. El helper ahora examina ancestros con `overflow-x:auto/scroll` y continúa midiendo el contenedor y el documento. |
| `simulator-canvas`: liberar y reanudar cámara | (a)/(b) | La prueba antigua había desactivado la cámara antes de arrastrar, así que no comprobaba la liberación. Se corrigió el escenario para iniciar con cámara activa; el comportamiento faltante de reanudación se implementó. |

## Checklist de UI y pendientes

- **Desbordamiento y solapamiento:** matriz E2E en 72 combinaciones; pasó.
- **Cabecera:** ≤104 px, sticky y consistente entre vistas; pasó.
- **Teclado y foco:** navegación por espacios, controles de Concentración y salida por Escape cubiertos por E2E existentes.
- **Movimiento reducido:** preferencia y `prefers-reduced-motion` cubiertos por E2E existentes.
- **Estados sin datos/error:** catálogo, almacenamiento bloqueado y almacenamiento dañado conservan cobertura de E2E existentes.
- **Pendiente de riesgo:** quedan reglas históricas específicas del Simulador en `src/styles/simulator.css`; la matriz demuestra el resultado actual, pero una futura limpieza debe retirar duplicados solo con regresión visual comparativa.

## Archivos relevantes

`index.html`, `src/ui/navigation.js`, `src/ui/lab.js`, `src/ui/simulator.js`, `src/ficha/view-actividades.js`, `src/styles/content.css`, `src/styles/shell.css`, `src/styles/simulator.css`, pruebas E2E de navegación, Ejercicios, Laboratorio, Simulador y Actividades, `tests/architecture.test.js`, `e2e/ui-layout.js`, `README.md`, `docs/MAPA_DEL_REPO.md`, `docs/PROGRESO.md`, `docs/DECISIONES_AUTONOMAS.md`, además de este informe y sus capturas.
