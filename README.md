# Bubbles & Essence — Frontend (Angular)

Dos mundos en una sola app, cada uno con su propia sesión:

- **Panel interno** (staff: ADMIN/OPERADOR/VENDEDOR): login, catálogo,
  gestión de pedidos, y administración de seguridad (módulos, acciones,
  grupos, permisos por usuario) — todo mostrado/ocultado según los
  **accesos reales** del usuario logueado, nunca según su rol "a mano" en
  el código.
- **Tienda de cliente** (invitado o con cuenta): catálogo público, carrito,
  checkout, seguimiento de pedido por código, y "Mis Pedidos" para
  clientes logueados.

## Cómo está armado

```
src/app/
├── core/
│   ├── models/          # espejo 1:1 de los DTOs del backend
│   ├── services/         # un servicio por recurso del backend (producto,
│   │                      usuario, grupo, accion, permiso, cliente,
│   │                      pedido-cliente, carrito...)
│   ├── interceptors/
│   │   ├── auth.interceptor.ts            # agrega el token correcto a
│   │   │                                    cada request, maneja 401
│   │   └── cliente-request.context.ts     # marca qué requests usan
│   │                                        token de CLIENTE (ver abajo)
│   ├── guards/            # authGuard: bloquea rutas de staff sin sesión
│   └── directives/        # *appHasAccion: muestra/oculta por código de acción
└── features/
    ├── auth/login/                  # login de staff
    ├── layout/shell/                 # sidebar armado según módulos del usuario
    ├── productos/                    # catálogo (vista interna, con CRUD)
    ├── admin/seguimiento-interno/    # gestión de pedidos (vista interna)
    ├── seguridad/
    │   ├── acciones/                  # CRUD de acciones del sistema
    │   ├── grupos/                    # CRUD de grupos + sus acciones
    │   └── usuarios-permisos/         # permisos directos por usuario
    └── cliente/                      # TODO lo de cara al comprador:
        ├── catalogo-publico/
        ├── producto-detalle/
        ├── carrito-cliente/
        ├── checkout-cliente/
        ├── seguimiento-pedido/        # público, por código + documento
        ├── cliente-login/ cliente-registro/
        ├── mis-pedidos/               # requiere sesión de cliente
        └── cliente-layout/ cliente-navbar/
```

## Autenticación: dos sesiones independientes, a la vez

Un mismo navegador puede tener **sesión de staff y sesión de cliente al
mismo tiempo** (ej. probando como admin y como comprador en la misma
máquina). Cada una vive en su propia llave de `localStorage`:

| Sesión | Llave en `localStorage` | Para qué rutas |
|---|---|---|
| Staff | `be_session` | Panel interno (productos, pedidos, seguridad) |
| Cliente | `be_session_cliente` | Tienda (carrito, checkout, mis-pedidos) |

**Cómo decide el interceptor cuál token mandar — y por qué NO mira la URL:**
varios endpoints de cliente comparten la misma ruta base que endpoints de
staff (ej. `GET /api/v1/pedidos/mis-pedidos` vs `GET /api/v1/pedidos` para
el staff), así que "la URL contiene `/cliente/`" no es una señal
confiable. En su lugar, cada servicio Angular marca **explícitamente** las
llamadas que el backend protege con `@PreAuthorize("hasRole('CLIENTE')")`:

```typescript
import { HttpContext } from '@angular/common/http';
import { USA_TOKEN_CLIENTE } from '../interceptors/cliente-request.context';

obtenerMisPedidos(): Observable<ApiResponse<PedidoCliente[]>> {
  return this.http.get<ApiResponse<PedidoCliente[]>>(`${this.base}/mis-pedidos`, {
    context: new HttpContext().set(USA_TOKEN_CLIENTE, true),
  });
}
```

Todo lo que **no** lleve esa marca usa el token de staff si hay sesión (o
ninguno, si no hay — los endpoints públicos no lo exigen).

**Si agregas un endpoint nuevo que requiera rol `CLIENTE` en el backend**,
tienes que repetir este paso en el servicio Angular que lo llama — no pasa
solo. Olvidarlo da un 403 silencioso (así se vivió en desarrollo: el
backend respondía bien, el frontend mandaba el token equivocado).

Un 401 real solo cierra la sesión del tipo que falló (cliente o staff),
nunca ambas a la vez — así una no tumba a la otra si ambas están activas.

## La pieza clave para botones: `*appHasAccion`

```html
<button *appHasAccion="'btn-editar-producto'" (click)="editar(p)">Editar</button>
```

Consulta `AccesoService`, que carga `GET /accesos/mis-accesos` al
loguearse (y al refrescar la página) y guarda la lista de códigos en un
signal. Ningún componente decide "si es ADMIN muestra esto" — todo pasa
por esa lista, como se diseñó en el backend.

### El sidebar también respeta accesos

`ShellComponent` arma el menú a partir de `accesos().modulos`, no de una
lista fija. Para conectar un módulo nuevo, agrega su código al
`RUTA_POR_MODULO` en `shell.component.ts`.

## Entornos

| Entorno | Comando | apiUrl | Cuándo usarlo |
|---|---|---|---|
| Local (desarrollo) | `npm start` | `http://localhost:8080/api/v1` | backend corriendo en tu máquina (`./gradlew bootRun`) |
| Producción | `npm run build:prod` | `https://bubbles-essence-backend.onrender.com/api/v1` | genera `dist/` para desplegar (Vercel) |

El swap de `apiUrl` entre ambos es automático vía `fileReplacements` en
`angular.json` (`environment.ts` ↔ `environment.prod.ts`) — nunca hay que
tocar código a mano para cambiar de entorno.

### Probar en tu máquina contra el backend ya desplegado (sin tocar código)
```bash
npm run build:prod
npx http-server dist/bubbles-essence-frontend/browser -p 4200
```

## Despliegue (Vercel)

`vercel.json` en la raíz define el build (`npm run build:prod`), el
directorio de salida (`dist/bubbles-essence-frontend/browser`) y el
rewrite necesario para que el Router de Angular funcione al refrescar
cualquier ruta (sin esto, `/productos` recargado a mano daría 404).

Deploy: conectar el repo de GitHub en Vercel ([vercel.com](https://vercel.com))
→ detecta Angular automático → respeta `vercel.json` → deploy. Cada
`git push` a `main` redespliega solo.

**Pendiente de verificar tras cada deploy nuevo del frontend**: que el
dominio real de Vercel esté en `CORS_ALLOWED_ORIGINS` del backend en
Render (separado por coma si conviven varios: Vercel + `localhost:4200`
para seguir probando local).

## Cómo correrlo en local

```bash
npm install
npm start      # ng serve, en http://localhost:4200
```

**Requisito**: backend corriendo (`./gradlew bootRun`) con las semillas de
datos aplicadas (`grp_seg_permisos.sql` → `data_prueba_permisos.sql` →
`data_prueba_catalogo_y_accesos.sql`, en ese orden), porque el login
necesita un usuario real en `tbl_seg_usuario` y el catálogo necesita
productos reales.

## Flujo para probar de punta a punta

**Panel interno:**
1. Entra a `http://localhost:4200`, loguéate con el usuario del grupo
   ADMINISTRADORES.
2. Deberías ver el catálogo y sus botones de gestión, el sidebar con los
   módulos reales de ese usuario, y Pedidos/Seguridad si los tiene.
3. Para probar el ocultamiento: crea un segundo usuario sin esos accesos
   y entra con él — debería ver una versión recortada de la UI.

**Tienda de cliente:**
1. Ve a `/cliente` (catálogo público), agrega productos al carrito.
2. Haz checkout como invitado (sin cuenta) — o regístrate/loguéate como
   cliente primero para que el pedido quede asociado a tu cuenta.
3. Si te logueaste, entra a "Mis Pedidos" — debe traer solo los tuyos.
4. Prueba el seguimiento público (`/cliente/seguimiento`) con el código +
   documento del pedido, sin necesitar sesión.

## Qué falta (próximos pasos)

- Pantalla admin para **gestión de clientes** (el backend ya expone el
  CRUD; falta la UI en el panel interno — hoy el cliente solo se
  autogestiona desde `features/cliente`).
- Paginación en el catálogo y en la lista de pedidos si crecen mucho (hoy
  traen todo de una, con el límite de 50 + orden que se ajustó en el
  backend para pedidos).
- Redirección automática a `/cliente/login` cuando expira la sesión de
  cliente (hoy solo se limpia el `localStorage`; el componente muestra su
  propio mensaje de error en vez de mandarte al login).
