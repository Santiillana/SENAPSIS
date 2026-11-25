# Informe de aceptación · Módulo 5 · Senapsis

**Fecha:** 16 de noviembre de 2026
**Repositorio:** `Santiillana/Senapsis`
**PR:** [#20](https://github.com/Santiillana/Senapsis/pull/20), abierta y sin fusionar.
**SHA validado:** `ee804803354a8ea5cf60d17c37405ac90792faa0`.

## Dictamen

<badge>Validación CI aprobada</badge>

La auditoría técnica del Módulo 5 pasó completamente en GitHub Actions. La aceptación del código y de las pruebas de navegador está aprobada para el SHA indicado. **La publicación pública no está aceptada todavía**, porque falta ejecutar la verificación posterior al despliegue con el origen HTTPS real.

## Evidencia de CI

[GitHub Actions run 43954434334](https://github.com/Santiillana/Senapsis/actions/runs/43954434334)

- Node: **267/267**, cero fallos.
- Playwright/Chromium: **99/99**, cero fallos.
- Instalación CI con Node 22; npm informó cero vulnerabilidades en los cuatro paquetes auditados.
- Capturas visuales: 18 PNG cargados correctamente en `ui-audit-29b2188dc0b27d9a41da525ea8b589d40b83d1df`, artefacto ID `14271616094`.

### Cobertura comprobada

- Los 45 ejercicios, todos sus métodos y escenarios disponibles se ejecutan con el intérprete; los resultados se contrastan también con un oráculo independiente.
- Se prueban retos expertos, expresiones, parser, ciclos, errores de entrada y límites de ejecución.
- Rendimiento funcional: ciclo de 200 iteraciones con traza acotada, ciclos anidados con contexto correcto y navegación de snapshots sin mutación.
- Accesibilidad: contraste WCAG AA, navegación por teclado y movimiento reducido.
- Navegador: simulador, escenas, variables, historial, cámara, zoom, fullscreen, constructor, catálogo, diez vistas, navegación responsive y tolerancia a localStorage bloqueado.
- Las diez vistas se recorren a 390, 768, 1024 y 1440 px sin overflow horizontal ni errores de recursos/JavaScript.
- El primer recorrido detectó una superposición táctil en la cabecera móvil; se corrigió el contexto de posicionamiento de la navegación fija y la segunda ejecución pasó.

## Criterios y limitaciones abiertas

| Criterio | Resultado |
|---|---|
| CI Node y Chromium del SHA final | Aprobado |
| Capturas de auditoría generadas | Aprobado; 18 PNG en artefacto CI |
| Navegación y responsive automatizados | Aprobado en Chromium emulado |
| Contraste WCAG AA y teclado | Aprobado por las suites existentes y nuevas |
| Constructor de diagramas | Funciona en modelo estructurado; conexiones libres arbitrarias entre puertos no implementadas |
| Prueba en hardware físico | No realizada |
| Deployment público | **Pendiente** |
| Smoke test de producción | **Pendiente** |

## Publicación

El workflow `.github/workflows/pages.yml` es manual y de respaldo. Su comentario indica Cloudflare Workers como hosting primario, pero no hay una URL de producción visible ni una prueba automática de ese proveedor en el repositorio.

El workflow `.github/workflows/post-deploy.yml` requiere un origen HTTPS real. Antes de declarar release completo debe:
1. comprobar que la portada publicada expone exactamente la marca `senapsis-release` del commit esperado;
2. ejecutar `e2e/production-smoke.spec.js` contra ese origen;
3. guardar el artefacto de capturas de producción y registrar su run.

No se inventa una URL ni se usa la aprobación de CI de PR como sustituto de un deployment real.

## Conclusión

**M5 aprobado a nivel de código, documentación y CI automatizada.** El cierre del release público permanece condicionado al acceso/configuración del hosting y a la ejecución del smoke test real. La PR #20 sigue separada de `main`; la rama principal no se modificó con esta auditoría.
