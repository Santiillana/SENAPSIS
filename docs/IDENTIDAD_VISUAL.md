# Identidad visual · Senapsis

- Nombre visible: **Senapsis**.
- Lema: **Conecta. Comprende. Transforma.**
- Colores de marca tomados de la lámina entregada: verde bosque `#0B3D2E` y marfil `#F7F1E3`.
- El isotipo, el wordmark y el lema se recortaron de la imagen original entregada en `Descargas/logo .jpeg`. El símbolo conserva su forma y sus tonos; el fondo del recorte del isotipo se hizo transparente para integrarlo sin un marco cuadrado.
- `src/assets/senapsis-symbol.png`, `senapsis-wordmark.png` y `senapsis-tagline.png` son las tres piezas visuales de la marca.
- La composición se reconstruye en HTML/CSS para animar por separado la entrada del símbolo, el divisor, la revelación del nombre y el lema.
- La bienvenida usa una cuadrícula verde tenue sobre marfil y permanece hasta que se pulse **Ingresar**. El botón abre la plataforma actual sin pedir credenciales; el acceso de usuarios se incorporará después en este paso.
- La transición respeta `prefers-reduced-motion`; en ese modo el contenido aparece estático y el botón continúa disponible.

El repositorio conserva el nombre técnico Traza en rutas, claves locales y contratos internos para no invalidar datos ni integraciones existentes.
