# Módulo 7 · Actividades y detalle

**Estado:** interfaz funcional sobre el núcleo M5 y las vistas M6 ya integradas en `main`.

## Implementado
- Catálogo oficial desde `FICHA.actividades`, con aviso visible cuando el contenido sigue siendo demostrativo.
- Búsqueda, filtros por estado y competencia, y orden por fecha límite.
- Detalle de consigna, propósito, instrucciones, entregables, competencia y fechas.
- Documentos publicados asociados a la sección `actividades` y a su `actividadId`.
- Seguimiento personal en `senapsis:v4:ficha`: checklist, notas y resultados transcritos.
- Confirmar el checklist marca la entrega; los resultados transcritos conservan intentos y correcciones.
- Una aprobación se identifica como transcripción del estudiante, nunca como verificación institucional.
- La vista bloquea cambios si la lectura estricta detecta almacenamiento dañado o versión desconocida.

## Moderación y documentos
El moderador mantiene `src/content/ficha.js` y `FICHA.documentos`. Para publicar un documento binario debe alojarlo primero en almacenamiento compartido autorizado, obtener una URL HTTPS estable y registrar metadata, sección, actividad asociada, MIME, tamaño, fecha y estado `publicado`. La aplicación estática no tiene autenticación, roles ni API de carga; no se presenta un botón de subida inseguro. La carga desde la aplicación requiere backend y permisos aplicados en servidor.

## Límites
- Notas, checklist y resultados transcritos son locales al navegador.
- No hay sincronización entre dispositivos.
- Los ejemplos siguen marcados como demostración hasta que se reemplacen por contenido confirmado.

## Pruebas
`tests/ficha-activities.test.js` cubre checklist, entrega, bloqueo tras aprobación, notas, devoluciones sucesivas, correcciones, URLs y fechas inválidas.
