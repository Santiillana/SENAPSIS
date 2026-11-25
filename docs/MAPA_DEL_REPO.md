# Mapa del repositorio · Senapsis (código Traza)

Senapsis organiza la información compartida de una ficha para aprendices e instructores autorizados; **Mi ficha** es el espacio central y **Aprende** complementa la formación con material de repaso. Esta instalación administra una ficha. Conteos derivados de los catálogos actuales: **5 temas, 40 lecciones, 108 ejercicios y 4 actividades de Mi ficha**. Detalle: 17/45 en diagramas, 8/24 en fuentes y 15/39 en matemáticas. TICs y Comunicación permanecen como competencias próximas sin temas vacíos.

| Ruta | Responsabilidad | Pruebas principales |
|---|---|---|
| `index.html` | Shell semántico, cabecera común y navegación de los ocho espacios | `architecture`, `shared-navigation-header`, E2E |
| `administrar.html`, `src/admin.js` | Panel protegido para actualizar la ficha, revisar borradores, publicar y consultar historial | `admin-*`, `worker-api`, E2E |
| `worker/`, `migrations/`, `wrangler.jsonc` | API de estado compartido, autenticación de administración con Access y persistencia D1 | `access`, `state-api`, `write-auth` |
| `src/ficha/repository.js` | Recuperar la ficha publicada, anunciar cambios y conservar una copia para uso sin conexión | `ficha-sync`, `state-api`, E2E |
| `src/assets/senapsis-symbol.png`, `senapsis-wordmark.png`, `senapsis-tagline.png` | Piezas recortadas de la marca Senapsis | Revisión visual |
| `src/ui/brand-splash.js`, `src/styles/brand.css` | Bienvenida interactiva, composición animada y adaptación de identidad | Revisión visual |
| `src/app.js` | Inicialización de vistas y módulos | `ui-modules`, E2E |
| `src/content/temas.js` | Registro de temas y competencias activas | `content`, `source-requirements` |
| `src/content/lessons.js`, `sources-lessons.js`, `math-lessons.js` | Lecciones por tema | `content`, `lesson-programs`, `math-lessons` |
| `src/content/exercises.js`, `source-exercises.js`, `src/math/exercises.js` | Bancos de ejercicios y oráculos | `exercise-execution`, `source-requirements`, `math-engine` |
| `src/content/source-scenarios.js` | Escenarios y cobertura del simulador de fuentes | `source-requirements` |
| `src/core/` | Parser, expresiones e intérprete seguro | `parser`, `expression`, `interpreter` |
| `src/diagram/` | Geometría, render SVG y resaltado | `diagram-layout`, `e2e` |
| `src/math/` | Aritmética exacta, ejercicios y generadores matemáticos | `math-engine`, `math-lessons` |
| `src/ui/content-view.js` | Catálogo, lecciones y progreso | `content`, E2E |
| `src/ui/source-simulator.js` | Simulador de recolección de fuentes | `source-requirements`, E2E de fuentes |
| `src/ui/simulator-shell.js`, `src/ui/flow-step-contract.js` | Navegación genérica y validación de pasos para plantillas de simulador | `simulator-shell`, `flow-step-contract` |
| `src/ui/simulator.js`, `src/ui/simulator-intro.js` | Traza, cámara, apoyo sencillo por paso y preferencias de introducción | E2E de Simulador |
| `src/styles/` | Tokens, vistas, componentes y responsive | `contrast`, E2E |
| `tests/` | Contratos, contenido, motor, accesibilidad y regresiones | `npm test` |
| `e2e/navigation.js`, `e2e/ui-layout.js` | Navegación de aceptación y detección de desbordamiento/solapamiento en las ocho rutas principales | `shared-navigation-header`, E2E |
| `e2e/` | Recorridos de aceptación en navegador; el total se actualiza al regenerar el inventario | `npm run test:browser -- --workers=2` |
| `docs/CONTRATO_TEMA.md` | Proceso para añadir un tema completo | Revisión del contrato en cada tema |
| `docs/contrato-paso.md`, `docs/como-agregar-tema.md` | Contrato de pasos y guía corta para registrar plantillas y temas | Revisión del contrato en cada tema |
| `reference/` | Prototipo original preservado como referencia | Solo lectura; hash protegido |

## Fase 8 · plantillas de simulación

| Ruta | Responsabilidad | Pruebas principales |
|---|---|---|
| `src/ui/templates/classification.js`, `src/ui/scenes/classification.js` | Adaptar escenarios de Fuentes al contrato común y representar ruta y aportes | `classification-template`, E2E de Fuentes |
| `src/ui/templates/calculation.js`, `src/ui/scenes/calculation.js` | Construir y dibujar pasos exactos para Enteros, Racionales y Regla de tres | `calculation-template`, E2E matemáticos |
| `src/ui/simulator-shell.js` | Mantener el cursor y validar pasos compartidos por Flujo, Fuentes y Matemáticas | `simulator-shell`, `flow-step-contract` |

La suite de navegador contiene **170 pruebas en 38 archivos**, incluyendo las regresiones de Administración y ambas plantillas.
