# Módulo 5 v4 · Núcleo y persistencia de Mi ficha

**Estado:** núcleo base integrado en `main`; el cierre de seguridad, respaldo versionado y recuperación validada se incorpora en la PR #25; esquema v1.

## Alcance implementado

- Datos personales versionados en `senapsis:v4:ficha`: actividades, checklist, intentos, favoritos y elementos guardados.
- Validación de estructura, estados, fechas civiles, intentos y listas sin duplicados.
- Lectura estricta que distingue almacenamiento vacío, inaccesible, JSON corrupto, versión desconocida y estructura inválida.
- Escritura protegida: los cambios normales no sobrescriben datos corruptos ni esquemas futuros.
- Respaldo JSON versionado `senapsis-ficha-personal-backup`, validación previa y recuperación explícita desde un respaldo íntegro.
- Estados controlados: el aprendiz no puede aprobarse a sí mismo; Aprobada y Por corregir requieren un resultado registrado como tal. Atrasada es derivada.
- Contrato editorial de documentos por sección (`clases`, `actividades`, `biblioteca`), con borrador/publicado, URL HTTPS sin credenciales o ruta local sin traversal, metadatos y asociaciones a clase o actividad. La vista filtra documentos inválidos antes de publicarlos.
- Horario oficial versionado en `src/content/ficha.js`; no se duplica en almacenamiento personal.

## Límites deliberados

- Los datos personales se guardan en el navegador; no se sincronizan entre dispositivos.
- Los respaldos contienen datos personales y deben guardarse de forma privada.
- El contrato de documentos conserva metadata y URL, no archivos binarios. La versión estática no tiene autenticación, roles ni almacenamiento compartido. Por ello, la publicación oficial se gestiona mediante cambios versionados del manifiesto y revisión del repositorio; no se presenta como panel seguro de carga.
- Un registro local de resultado de instructor no acredita identidad ni constituye una calificación institucional.
- Cualquier migración futura debe ser explícita y probada; nunca se normaliza silenciosamente un esquema desconocido.

## API

En `src/ficha/store.js`: `crearFichaInicial`, `validarFichaPersonal`, `leerFichaEstricto`, `leerFicha`, `guardarFicha`, `borrarFicha`, `crearRespaldoFicha`, `validarRespaldoFicha`, `importarRespaldoFicha`.

En `src/ficha/documentos.js`: `validarDocumentoOficial`, `documentosPublicados`, `SECCIONES_DOCUMENTO`.

## Validación

`tests/ficha.test.js` cubre estructura oficial, relaciones curriculares, horario, fechas, estados, filtros, documentos, lectura estricta, protección contra sobrescritura y recuperación mediante respaldo validado.
