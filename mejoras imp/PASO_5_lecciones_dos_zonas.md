# PASO 5: Lecciones en dos zonas (crea el componente compartido)

Dependencias: PASOS 1, 2 y 4.
Commit: `feat(aprende-paso-5): lecciones en panel izquierdo y ventana de explicacion`

## Qué hacer
1. Crea un componente de dos zonas que el PASO 6 reutilizará para Ejercicios. Módulo pequeño, JavaScript nativo.
   - Panel izquierdo: lista del tema activo. En Lecciones: cada lección con estado (pendiente, en curso, completada) y dificultad. Sin contadores innecesarios.
   - Ventana grande: la explicación del ítem seleccionado, con scroll propio y botones anterior/siguiente.
2. Móvil: el panel izquierdo pasa a ser un selector desplegable o cajón sobre la ventana grande, que ocupa todo el ancho. Define también tablet.
3. Ventana de explicación sin ventanas dentro de ventanas:
   - Es UNA superficie de lectura. Sin tarjetas con borde, marcos de figuras ni paneles anidados. Hoy hay tres niveles (panel > tarjeta "01 · IDEA" > marco del diagrama): elimínalos.
   - Las secciones se separan con título, espaciado y, como mucho, una línea fina.
   - Los gráficos se integran directamente en la superficie, a ancho de lectura, con pie explicativo.
   - Lo colorido y animado vive solo dentro de las explicaciones.
4. Animaciones lentas, continuas y pausables; con prefers-reduced-motion, alternativa estática clara. Conserva las animaciones existentes; cambia su contenedor, no su contenido.
5. Estados: vacío, cargando y error.
6. Accesibilidad: lista navegable con teclado, elemento activo marcado (aria-current), foco que pasa a la ventana al abrir un ítem.

## Cierre (verificable)
- Una lección abierta no muestra ningún borde de tarjeta ni marco dentro de la ventana de lectura.
- Seleccionar otra lección en el panel cambia la ventana sin recargar y actualiza la dirección.
- Funciona en 1366, tablet y 390 px, en claro y oscuro.
- El progreso de lecciones completadas se sigue guardando y mostrando.
- Tests y E2E del área de lecciones en verde.
