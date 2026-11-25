# Configuración de Cloudflare para publicar la ficha

La aplicación y el Worker están preparados, pero no se ha accedido a la cuenta ni se ha desplegado nada. La fase 6 multi-ficha sigue excluida: esta configuración crea una sola ficha.

## Valores que debes reunir en tu cuenta

- Dominio público de Senapsis, con DNS proxied por Cloudflare.
- Correo autorizado para administrar.
- Team domain de Access (`<equipo>.cloudflareaccess.com`) y Audience tag de la aplicación Access.
- ID de la base D1 que crearás en el paso siguiente.

## Crear y enlazar D1

Desde la raíz del repositorio, inicia sesión con Wrangler en la cuenta correcta y crea la base:

```sh
npx wrangler login
npx wrangler d1 create senapsis-content
```

Copia el `database_id` que devuelve Wrangler en `wrangler.jsonc`, reemplazando `REPLACE_WITH_D1_DATABASE_ID`. Completa las cuatro variables `REPLACE_WITH_…` con el Team domain, Audience tag, correo autorizado y origen público exacto (por ejemplo `https://senapsis.example.edu`). No añadas barra final al origen. No pongas secretos en el navegador.

Aplica las migraciones remotas después de revisar cuenta, base y configuración:

```sh
npx wrangler d1 migrations apply senapsis-content --remote
```

## Proteger rutas y conectar el Worker

En Cloudflare Zero Trust, crea una aplicación Self-hosted con política Allow para el correo autorizado. Protege el host y estas rutas:

- `/administrar.html`
- `/api/v1/admin/*`

El Worker también verifica firma, audiencia, emisor y correo permitido en cada operación administrativa. No dependas solo de la política de Access.

En Workers & Pages, añade una ruta del Worker `senapsis-content-api` para `<tu-dominio>/api/v1/*`, manteniendo la zona proxied. La lectura pública (`/api/v1/state` y `/api/v1/version`) queda pública; Access se limita al panel y rutas administrativas. La ruta debe apuntar al mismo Worker y al binding D1 `DB` definido en `wrangler.jsonc`.

## Revisión y despliegue

Antes de desplegar, confirma en el panel que la cuenta, zona, dominio y política Allow son los esperados; revisa que `wrangler.jsonc` ya no contenga marcadores `REPLACE_WITH_…`. Luego, y solo tras tu aprobación expresa, ejecuta:

```sh
npx wrangler deploy
```

Verifica con una petición GET a `https://<tu-dominio>/api/v1/health`, después a `/api/v1/version`. Abre `/administrar.html`: sin sesión debe denegar acceso; con el correo permitido debe mostrar la ficha. No publiques datos reales hasta probar borrador, publicación, deshacer y recuperación desde otro navegador.

Si Access muestra límites o pantallas distintas a las del plan, anota el valor vigente en `docs/ESTADO.md` antes de activar usuarios. La operación de cuenta, migración remota y despliegue queda a cargo del usuario; no se ejecutan desde este repositorio.
