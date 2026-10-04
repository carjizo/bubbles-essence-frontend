import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { UsuariosPermisosComponent } from '../seguridad/usuarios-permisos/usuarios-permisos.component';
import { AccionesComponent } from '../seguridad/acciones/acciones.component';
import { GruposComponent } from '../seguridad/grupos/grupos.component';
import { SeguimientoInternoComponent } from './seguimiento-interno/seguimiento-interno.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'catalogo',
        loadComponent: () =>
          import('../productos/productos-list/productos-list.component').then(
            (m) => m.ProductosListComponent,
          ),
        data: { title: 'Catálogo' }
      },
      {
        path: 'usuarios-permisos',
        component: UsuariosPermisosComponent,
        data: { title: 'Usuarios' }
      },
      {
        path: 'acciones',
        component: AccionesComponent,
        data: { title: 'Acciones' }
      },
      {
        path: 'grupos',
        component: GruposComponent,
        data: { title: 'Grupos' }
      },
      {
        path: 'seguimiento-pedidos',
        component: SeguimientoInternoComponent,
        data: { title: 'Pedidos' }
      },
      { path: '', redirectTo: 'catalogo', pathMatch: 'full' }
    ]
  }
];
