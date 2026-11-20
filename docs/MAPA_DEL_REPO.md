# Mapa del repositorio · Traza

Conteos derivados de los catálogos actuales: **5 temas, 40 lecciones, 108 ejercicios, 34 mecánicas de Laboratorio y 4 actividades de Mi ficha**. Detalle: 17/45 en diagramas, 8/24 en fuentes y 15/39 en matemáticas. El Laboratorio suma 10 mecánicas de diagramas, 6 de fuentes y 18 matemáticas. TICs y Comunicación permanecen como competencias próximas sin temas vacíos.

| Ruta | Responsabilidad | Pruebas principales |
|---|---|---|
| `index.html` | Shell semántico, cabecera común y navegación de los nueve espacios | `architecture`, `shared-navigation-header`, E2E |
| `src/app.js` | Inicialización de vistas y módulos | `ui-modules`, E2E |
| `src/content/temas.js` | Registro de temas y competencias activas | `content`, `source-requirements`, `source-lab` |
| `src/content/lessons.js`, `sources-lessons.js`, `math-lessons.js` | Lecciones por tema | `content`, `lesson-programs`, `math-lessons` |
| `src/content/exercises.js`, `source-exercises.js`, `src/math/exercises.js` | Bancos de ejercicios y oráculos | `exercise-execution`, `source-requirements`, `math-engine` |
| `src/content/source-scenarios.js`, `source-lab.js` | Escenarios, cobertura y retos de fuentes | `source-requirements`, `source-lab` |
| `src/core/` | Parser, expresiones, intérprete y compilación del Constructor | `parser`, `expression`, `interpreter`, `flow-compiler` |
| `src/diagram/` | Geometría, render SVG y resaltado | `diagram-layout`, `e2e` |
| `src/math/` | Aritmética exacta, ejercicios y generadores matemáticos | `math-engine`, `math-lab`, `math-lessons` |
| `src/ui/content-view.js` | Catálogo, lecciones y progreso | `content`, E2E |
| `src/ui/lab.js`, `src/ui/lab/` | Mecánicas, sesiones y persistencia del Laboratorio | `lab-generators`, `lab-progress`, `source-lab` |
| `src/ui/source-simulator.js` | Simulador de recolección de fuentes | `source-requirements`, E2E de fuentes |
| `src/ui/simulator-shell.js`, `src/ui/flow-step-contract.js` | Navegación genérica y validación de pasos para plantillas de simulador | `simulator-shell`, `flow-step-contract` |
| `src/ui/simulator.js`, `src/ui/simulator-intro.js`, `src/ui/builder.js` | Traza, cámara, apoyo sencillo por paso, preferencias de introducción y Constructor visual | E2E de Simulador y Constructor |
| `src/styles/` | Tokens, vistas, componentes y responsive | `contrast`, E2E |
| `tests/` | Contratos, contenido, motor, accesibilidad y regresiones | `npm test` |
| `e2e/navigation.js`, `e2e/ui-layout.js` | Navegación de aceptación y detección de desbordamiento/solapamiento en las nueve rutas principales | `shared-navigation-header`, E2E |
| `e2e/` | Recorridos de aceptación en navegador: 170 casos | `npm run test:browser -- --workers=2` |
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
