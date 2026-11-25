# Administración y publicación de Mi ficha

Senapsis usa **Mi ficha** como espacio compartido para la información académica de una ficha de formación. Los aprendices consultan allí sus clases, actividades y recursos. Las personas autorizadas actualizan los datos comunes desde la administración.

## Acceso y alcance

- La consulta de la ficha es pública. La aplicación recupera la última versión publicada desde el Worker y conserva una copia local para consultar la información si no hay conexión.
- La administración está en `/administrar.html`. El Worker valida el JWT de Cloudflare Access y limita el acceso a los correos configurados en `ACCESS_ALLOWED_EMAILS`.
- El acceso autorizado administra la ficha completa; todavía no hay cuentas individuales para aprendices ni permisos limitados por instructor.
- Esta instalación administra una ficha. La configuración multi-ficha está excluida.
- `src/content/ficha.js` aporta los datos iniciales y de demostración. Los datos actuales están marcados como demostración y deben confirmarse antes de presentarlos como información oficial.

## Qué puede actualizarse

En el panel de administración se puede:

- Registrar una clase o indicar que no hubo clase; agregar los temas vistos, enlaces compartidos y una evidencia con su fecha límite.
- Gestionar competencias, horarios, instructores, comunicados y metadatos de la ficha.
- Guardar borradores, revisar la ficha como aprendiz, consultar el historial, deshacer la última publicación y exportar o importar un respaldo JSON.

Los cambios guardados como borrador no se muestran a los aprendices. Al publicar, el Worker guarda una nueva versión compartida en D1. La aplicación de consulta detecta la versión nueva y actualiza su copia local.

Los documentos se registran como enlaces HTTPS; el panel no carga archivos binarios. Los archivos deben estar alojados en un servicio autorizado y accesible para la ficha.

## Seguimiento personal del aprendiz

Los datos compartidos de horario, clases, actividades y recursos provienen de la ficha publicada. En cambio, el checklist, las notas, las devoluciones transcritas y el progreso de Lecciones se guardan en el navegador de cada aprendiz; no se sincronizan entre dispositivos.

## Preparar la administración

La infraestructura está implementada en `worker/`, las migraciones están en `migrations/` y la configuración inicial está en `wrangler.jsonc`. Para conectar la cuenta, proteger `/administrar.html` y `/api/v1/admin/*`, aplicar D1 y desplegar, sigue [`CONFIGURAR_CLOUDFLARE.md`](CONFIGURAR_CLOUDFLARE.md). No se debe anunciar la administración como disponible en un sitio hasta configurar y verificar esa infraestructura.

## Antes de publicar información oficial

1. Confirma los datos de la ficha, horarios, competencias e instructores con su fuente.
2. Comprueba que las actividades y documentos correspondan a la ficha y que los enlaces sean HTTPS y estén autorizados.
3. Revisa el borrador en la vista previa como aprendiz.
4. Publica y verifica que la versión compartida se actualice.
5. Cambia `meta.esDemostracion` a `false` solo cuando los datos de demostración hayan sido reemplazados y confirmados.
