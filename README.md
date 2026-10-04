# Bubbles & Essence — Panel interno (Angular)

Frontend del panel interno: login contra el backend Spring Boot, y el
catálogo de productos como primera pantalla, con los botones de
crear/editar/desactivar mostrándose u ocultándose según los **accesos
reales** del usuario logueado (no según su rol "a mano" en el código).

## Cómo está armado

```
src/app/
├── core/
│   ├── models/         # espejo 1:1 de los DTOs del backend
│   ├── services/        # AuthService, AccesoService, ProductoService
│   ├── interceptors/     # agrega el JWT a cada request, maneja 401
│   ├── guards/           # authGuard: bloquea rutas sin sesión
│   └── directives/       # *appHasAccion: muestra/oculta por código de acción
└── features/
    ├── auth/login/
    ├── layout/shell/      # sidebar armado dinámicamente desde los módulos del usuario
    └── productos/
        ├── productos-list/   # pantalla principal
        └── producto-form/    # formulario reutilizable (crear y editar)
```

### La pieza clave: `*appHasAccion`

Cada botón sensible se envuelve así:

```html
<button *appHasAccion="'btn-editar-producto'" (click)="editar(p)">Editar</button>
```

Internamente consulta `AccesoService`, que carga una sola vez
`GET /accesos/mis-accesos` al loguearse (y al refrescar la página) y guarda
la lista de códigos en un signal. Ningún componente decide "si es ADMIN
muestra esto" — todo pasa por esa lista de códigos, exactamente como se
diseñó en el backend (ver su README, sección 5).

Hoy el código `btn-crear-producto` / `btn-editar-producto` /
`btn-eliminar-producto` ya existen en el seed del backend
(`sql/data_prueba_catalogo_y_accesos.sql`). Si mañana agregas un módulo
nuevo (ej. Pedidos) con sus propias acciones, el patrón es el mismo: creas
la acción en el backend, la asignas a un grupo, y en el Angular solo
envuelves el botón correspondiente con `*appHasAccion`.

### El sidebar también respeta accesos

`ShellComponent` arma el menú a partir de `accesos().modulos` (no de una
lista fija). Un módulo que el usuario tiene pero que todavía no tiene
pantalla en este Angular (`USUARIOS`, `PEDIDOS`, `CLIENTES` por ahora)
aparece atenuado con la etiqueta "próximamente", en vez de desaparecer —
así se nota que el backend ya lo expone y solo falta construir esa vista.
Para conectar uno nuevo, solo agregas su código al `RUTA_POR_MODULO` en
`shell.component.ts`.

## Cómo correrlo

Este entorno no tiene acceso a internet, así que no pude correr
`npm install` acá — el código está completo y lo generé directo, pero
necesitas instalarlo en tu máquina:

```bash
npm install
npm start      # equivalente a: ng serve
```

Abre `http://localhost:4200`. Por defecto apunta al backend en
`http://localhost:8080/api/v1` (`src/environments/environment.ts`); si tu
backend corre en otro puerto o dominio, cambia `apiUrl` ahí.

## Entornos

| Entorno | Comando | apiUrl | Cuándo usarlo |
|---|---|---|---|
| Local (desarrollo) | `npm start` | `http://localhost:8080/api/v1` | backend corriendo en tu máquina (`./gradlew bootRun`) |
| Producción | `npm run build:prod` | `https://TU-BACKEND.onrender.com/api/v1` | genera `dist/` para desplegar el frontend |

## Probar contra el backend ya desplegado (sin tocar código)

Para correr el frontend en tu máquina pero apuntando al backend real de
Render (útil para probar sin levantar el backend local), cambia
temporalmente `apiUrl` en `src/environments/environment.ts` a la URL de
Render, corre `npm start`, y **no hagas commit de ese cambio** — o mejor,
usa el build de producción local:

```bash
npm run build:prod
npx http-server dist/bubbles-essence-frontend/browser -p 4200
```

**Requisito**: el backend debe estar corriendo (`./gradlew bootRun` en el
proyecto Spring Boot) y con las semillas de datos aplicadas (ver su
carpeta `sql/`), porque el login necesita un usuario real en
`tbl_seg_usuario` y el catálogo necesita productos reales.

## Flujo para probarlo de punta a punta

1. Corre los 3 scripts SQL del backend en orden: `grp_seg_permisos.sql` →
   `data_prueba_permisos.sql` → `data_prueba_catalogo_y_accesos.sql`.
2. Levanta el backend (`./gradlew bootRun`).
3. `npm install && npm start` acá.
4. Entra a `http://localhost:4200`, loguéate con el usuario 1 (el que
   asignaste al grupo ADMINISTRADORES en el script 3).
5. Deberías ver el catálogo con los 6 jabones del seed, y los botones
   "+ Nuevo producto", "Editar" y "Desactivar" visibles porque
   ADMINISTRADORES tiene esas 3 acciones.
6. Para probar que el ocultamiento funciona de verdad: crea un segundo
   usuario (`POST /api/v1/usuarios`), asígnalo a un grupo sin esas acciones
   (o sin ningún grupo), y entra con ese usuario — vas a ver el catálogo
   en modo solo-lectura, sin ninguno de esos 3 botones.

## Qué falta (próximos pasos)

- Pantallas para los otros módulos ya expuestos por el backend: Usuarios,
  Clientes, Pedidos (y, dentro de Pedidos, el flujo público de invitado
  sin login — eso sería una sección aparte de este panel, no protegida por
  `authGuard`).
- Paginación en el catálogo si la lista crece mucho (hoy trae todo de una).
- Pantalla de administración de Módulos/Acciones/Grupos/Permisos (el CRUD
  ya existe en el backend, solo falta la UI).
