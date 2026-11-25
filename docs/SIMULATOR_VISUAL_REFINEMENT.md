# Mejoras visuales y pedagógicas del Simulador

Plan de diez pasos completado el 19 de noviembre de 2026. Cada paso se revisó y guardó en un commit separado.

1. **Evitar recortes:** ampliar el área útil de la ilustración y asegurar que las cajitas de Variables se vean en pantallas de portátil.
2. **Conservar el contexto:** seguir el nodo activo desde una zona segura para mantener figuras vecinas a la vista.
3. **Enseñar cómo empezar:** presentar antes de la solución una secuencia general para entender, ordenar, seguir y comprobar.
4. **Explicar cada paso:** acompañar la figura con «Qué pasa» y «Por qué» en lenguaje sencillo.
5. **Hacer claros los cambios:** mostrar valor anterior y actual, anunciar el cambio a lectores de pantalla y destacarlo visualmente.
6. **Dar más fuerza a las ilustraciones:** distinguir entradas, operación, valor guardado y salida con más espacio y jerarquía.
7. **Unificar la lectura:** usar tamaños, contraste e identidades de color coherentes entre En escena y Variables.
8. **Acompañar sin distraer:** suavizar la aparición de la guía y respetar movimiento reducido.
9. **Separar las secciones:** impedir que las pestañas de Mi ficha y Aprende se muestren juntas.
10. **Cerrar navegación y calidad:** enfocar el diagrama al entrar al Simulador, revisar flechas y tamaños, actualizar esta guía y el mapa del repositorio.

## Comprobación

- `npm test`: 351 pruebas pasan.
- Pruebas de navegador relevantes: ventanas, recorte, cámara, introducción, explicación sencilla, cambios de variables, movimiento reducido, cambio de sección y teclado.
- `npx playwright test --list`: 154 pruebas en 33 archivos.
- Para probarlo: `npm run dev` y abrir `http://localhost:8000`; entrar a **Aprende → Simulador**.

La carpeta `reference/` permanece intacta.
