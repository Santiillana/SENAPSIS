# ESTADO · Traza

Actualizado: 19 de noviembre de 2026

## Avance

| Fase | Estado | Último commit |
| --- | --- | --- |
| 0–4 | completas | commits previos de la rama |
| 5 | completa, pasos 1–7 | `007d18d` (paso 7) |
| 6 | excluida temporalmente; no implementar multi-ficha | — |
| 7 | pasos 1–5 completos; step 6 pendiente | `dcb0970` (paso 4) |
| 8 | step 1 auditado; migraciones pendientes | `3623e52` |

## Arquitectura y decisiones

- `src/content/` y `src/math/` son fuente de verdad. Los bancos actuales contienen 108 ejercicios; `exercise-adapter.js` adapta y valida sin mutar los catálogos.
- Fase 3b espera aprobación expresa del informe antes de redactar o reescribir contenido. `MAT-ENT-15` requiere confirmar transcripción. `reference/` está protegida.
- Aprende ofrece competencias → temas → ejercicios, lista ordenada, filtros, estado local y hoja de lectura con apartados disponibles, tema compartido, enlaces, pseudocódigo opcional, simulador, resolución y scroll restaurado.
- Laboratorio agrupa 34 mecánicas por competencia/tema, conserva estrellas y medallas; el Simulador permite competencia → tema → ejercicio y mantiene accesos directos desde Aprende.
- Fuentes y Matemáticas aún usan reproductores propios. La fase 8 migrará ambos a `createSimulatorShell`, sin cambiar los catálogos; el inventario de brechas está en el historial del step 1.
- Fase 7 implementa Worker, D1 singleton, Access JWT, lectura con caché y respaldo offline, escritura versionada con auditoría y el panel `/administrar.html`. Multi-ficha y estado personal sincronizado quedan fuera.
- El panel incluye registro diario y, al completar step 5, gestión de competencias, horarios, instructores, comunicados y metadatos; contactos públicos requieren consentimiento y los borrados son lógicos.
- No desplegar ni cambiar la cuenta de Cloudflare. Antes de eso, el usuario debe crear D1, configurar Access/rutas y aprobar; entregar instrucciones exactas.
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
- Fase 7 step 5: competencias, horario, instructores, comunicados y metadatos; E2E `admin-management`/`admin-daily` 2/2, validación del Worker 2/2.
