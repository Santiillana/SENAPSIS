# ESTADO · Traza · 19 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0–4 | completas | commits previos de la rama |
| 5 | completa, pasos 1–7 | `007d18d` (paso 7) |
| 6 | excluida temporalmente; no implementar multi-ficha | — |
| 7 | implementación steps 1–6 completa; configuración de cuenta pendiente | `5f0fd6e` (paso 6) |
| 8 | steps 1–4 completos; cierre responsive pendiente | siguiente: step 5 |

## Arquitectura y decisiones

- `src/content/` y `src/math/` son fuente de verdad. Los bancos actuales contienen 108 ejercicios; `exercise-adapter.js` adapta y valida sin mutar los catálogos.
- Fase 3b espera aprobación expresa del informe antes de redactar o reescribir contenido. `MAT-ENT-15` requiere confirmar transcripción. `reference/` está protegida.
- Aprende ofrece competencias → temas → ejercicios, lista ordenada, filtros, estado local y hoja de lectura con apartados disponibles, tema compartido, enlaces, pseudocódigo opcional, simulador, resolución y scroll restaurado.
- Laboratorio agrupa 34 mecánicas por competencia/tema, conserva estrellas y medallas; el Simulador permite competencia → tema → ejercicio y mantiene accesos directos desde Aprende.
- Fuentes y Matemáticas usan `createSimulatorShell` con plantillas `clasificacion` y `calculo` y renderers de dominio; conservan controles y visualizaciones. No se mutan catálogos.
- La auditoría del step 4 confirmó que los controladores de ambos reproductores siguen importados por `src/app.js`; sus adaptadores, renderer y controladores se conservan porque tienen uso activo.
- Fase 7 implementa Worker, D1 singleton, Access JWT, lectura con caché y respaldo offline, escritura versionada con auditoría y `/administrar.html`; incluye gestión, vista previa real, historial y respaldo JSON validado. Guía Cloudflare en `docs/CONFIGURAR_CLOUDFLARE.md`. Multi-ficha y sincronización de estado personal quedan fuera.
- El panel incluye registro diario y, al completar step 5, gestión de competencias, horarios, instructores, comunicados y metadatos; contactos públicos requieren consentimiento y los borrados son lógicos.
- No desplegar ni cambiar la cuenta de Cloudflare. Pasos preparados en `docs/CONFIGURAR_CLOUDFLARE.md`; el usuario crea D1, configura Access/rutas y aprueba.
- Cambios ajenos ya presentes en el árbol: README, mapa, progreso, simulador, prueba de contrato de teclado y archivos de `mejoras imp/`. Mantenerlos fuera de commits salvo necesidad clara y origen identificable.

## Próximos pasos
- Fase 7 step 6: vista previa, historial, deshacer y exportar/importar JSON.
- Documentar pasos Cloudflare y detenerse antes de cualquier despliegue o cambio de cuenta.
- Fase 8 steps 2–4: migrar Fuentes y Matemáticas, retirar código viejo solo sin usos; step 5: barrido responsive en 390/768/1366, tema claro, README y mapa.
- Ejecutar validaciones focalizadas y la suite Node/E2E al cierre; separar cada step en su propio commit.

## Validación reciente

- Fase 5 step 4: hoja y persistencia; ejercicio-solution 1/1, módulos 4 E2E 11/11.
- Fase 5 step 5: animación accesible y movimiento reducido; módulos 4 E2E 11/11.
- Fase 5 step 6: Laboratorio 4/4 y E2E 17/17; step 7: entrada Simulador 2/2 y módulos 4 11/11.
- Fase 7 steps 1–3: validación API/Access, migraciones SQLite y pruebas de servidor completas; steps 2 E2E 2/2.
- Fase 7 step 4: registro diario E2E 1/1 en 390 px; valida borrador, publicación y deshacer.
- Fase 7 steps 5–6: gestión, vista previa, historial y respaldos; E2E de Administración 3/3 y validación Worker 3/3.
- Fase 8 steps 2–3: plantillas de clasificación/cálculo 4 tests; E2E de Fuentes 6/6 y Matemáticas/entrada 13/13; renderers estáticos respetan movimiento reducido.
