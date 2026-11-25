# Senapsis · plataforma colaborativa para una ficha de formación

Senapsis reúne en un espacio compartido la información importante de una ficha de formación. Los aprendices pueden consultar sus clases, horarios, actividades y materiales; los instructores y moderadores autorizados pueden mantener actualizada la información de la ficha. **Aprende** complementa ese espacio con lecciones, ejercicios y simuladores para repasar las competencias que cursa el aprendiz.

Esta versión administra una ficha compartida. La configuración para varias fichas y las cuentas individuales de aprendices están fuera del alcance actual. Los permisos de administración aún no se separan por instructor: las personas autorizadas pueden gestionar la ficha completa. El panel se protege con Cloudflare Access cuando se configura y despliega el Worker; las marcas personales de actividades y el progreso de Lecciones se guardan en el navegador de cada aprendiz.

## Contenido disponible

La aplicación reúne **5 temas activos y 40 lecciones**: 17 de diagramas de flujo, 8 de recolección de información y 15 de matemáticas. El catálogo contiene **108 ejercicios**: 45 de algoritmos, 24 de fuentes y 39 de matemáticas. TICs y Comunicación se muestran como competencias próximas, sin temas vacíos.

## Espacios

### Inicio
Presenta la ficha como espacio central y da acceso a **Mi ficha** y a **Aprende**, que sirve de apoyo para repasar. Recuerda el último espacio visitado.

### Mi ficha
Espacio compartido de la ficha para consultar **Centro de control, Clases, Actividades y Biblioteca**. Clases ofrece vistas diaria, semanal y mensual. Los aprendices encuentran aquí la agenda, lo visto en clase, las actividades y los recursos publicados. Las personas autorizadas actualizan la información compartida en `/administrar.html`; el checklist personal, las notas y las devoluciones se conservan en el navegador de cada aprendiz. Los datos actuales son de demostración y deben confirmarse antes de usarse como información oficial.

### Aprende
Complemento de estudio para repasar contenidos relacionados con las competencias de la ficha. Incluye **Lecciones, Ejercicios y Simulador**.

- **Lecciones:** 40 lecciones por tema, con explicación intuitiva y técnica, escenas, ejemplos, errores frecuentes y comprobación. El progreso se conserva localmente.
- **Ejercicios:** catálogo de 108 retos (45 algoritmos, 24 fuentes y 39 matemáticas), con búsqueda, filtros y ficha de solución.
- **Simulador:** parser e intérprete restringidos para pseudocódigo educativo. Antes de mostrar la solución, «Intenta primero» presenta una guía breve para entender entradas y resultados, ordenar instrucciones, seguir variables y comprobar la respuesta. Una traza determinista alimenta el diagrama SVG, el pseudocódigo activo, En escena, Variables, Pantalla, Historial y la línea de tiempo. La guía flotante explica cada paso en palabras sencillas; las ilustraciones muestran los datos, la operación y el resultado, mientras la memoria destaca y anuncia los cambios de variables. La cámara automática conserva figuras cercanas y la navegación con flechas sigue el algoritmo sin cambiar de pestaña. Incluye avance, retroceso, reproducción, predicción, zoom, ajuste, cámara, pantalla completa, tema, tamaño de texto y movimiento reducido.

## Arquitectura

HTML, CSS y JavaScript ES nativo, sin dependencias de runtime. El único paquete de desarrollo es Playwright para pruebas de navegador. El pseudocódigo educativo no se ejecuta como JavaScript: el motor no utiliza `eval` ni `new Function`.

La referencia original se conserva sin modificar en `reference/diagramas_de_flujo_original.html`.

## Ejecutar en local

Requiere Node.js 22 o superior y Python 3 para servir los módulos ES.

```bash
npm install
npm run dev
```

Abre http://localhost:8000. El servidor sirve los módulos estáticos y se detiene con `Ctrl+C`.

## Pruebas

```bash
npm test
npx playwright install chromium
npm run test:browser
```

La suite incluye pruebas del parser e intérprete, ejecución de todos los métodos y escenarios de los ejercicios, un oráculo matemático independiente, rendimiento de ciclos, accesibilidad de contraste, navegación y aceptación visual con Chromium.

## CI y capturas

El workflow `.github/workflows/quality.yml` ejecuta las pruebas Node y Playwright en cada push a `main` y en cada pull request hacia `main`. Sube las capturas automatizadas como artefacto de GitHub Actions.

## Publicación

La aplicación es estática. El workflow `.github/workflows/pages.yml` permite una publicación manual de respaldo en GitHub Pages. La verificación de producción está separada en `.github/workflows/post-deploy.yml`: requiere el origen HTTPS real y comprueba que la versión publicada coincida con la marca de release antes de ejecutar el smoke test.

**No se afirma que el sitio esté publicado** mientras no se complete ese flujo contra una URL real. La configuración del proveedor de hosting y cualquier prueba en dispositivos físicos son verificaciones externas a la CI de Chromium.

## Documentación

- Especificación V5: `docs/MASTER_SPEC.md`
- Estado del proyecto: `docs/IMPLEMENTATION_STATUS.md`
- Informe de mejoras v2: `docs/INFORME_MEJORAS.md`
- Informe M5: `docs/MODULE_5_RELEASE_AUDIT.md`
- Informe M6: `docs/MODULE_6_HOME_BUILDER.md`
- Contrato para añadir temas: `docs/CONTRATO_TEMA.md`
- Mapa del repositorio y conteos: `docs/MAPA_DEL_REPO.md`
- Decisiones técnicas: `docs/DECISIONS.md`
- Auditoría de equivalencia original: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Aceptación y limitaciones: `docs/FINAL_ACCEPTANCE.md`
- Plan y estado de las diez mejoras visuales y pedagógicas del Simulador: `docs/SIMULATOR_VISUAL_REFINEMENT.md`
- Administración de la ficha, publicación y límites actuales: `docs/MODERATION_WORKFLOW.md`


## Mi ficha · Actividades

La vista Actividades reúne consignas, instrucciones, entregables y documentos publicados; permite buscar y filtrar, registrar el checklist, notas y devoluciones transcritas. El seguimiento personal permanece en el navegador. El contenido oficial se publica mediante cambios versionados revisados; la carga autenticada de archivos requiere un backend.

## Plantillas de simulación

Fuentes y Matemáticas comparten `createSimulatorShell` y el contrato de pasos. La plantilla `clasificacion` presenta la ruta de una fuente, sus aportes y la cobertura de requisitos; `calculo` adapta cada operación a tablas, áreas constantes, barras de fracciones o árboles de operación. Los catálogos conservan sus ejercicios y valores actuales, incluido el ejercicio de Enteros pendiente de confirmar con el original.
