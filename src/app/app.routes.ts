import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ADMIN_ROUTES } from './features/admin/admin-routing.module';
import { CLIENTE_ROUTES } from './features/cliente/cliente-routing';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cliente',
    children: CLIENTE_ROUTES,
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./features/productos/productos-list/productos-list.component').then(
        (m) => m.ProductosListComponent,
      ),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: ADMIN_ROUTES,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/cliente',
  },
  { path: '**', redirectTo: '/login' },
];
