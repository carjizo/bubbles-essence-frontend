import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Agrega "Authorization: Bearer <token>" a cada request saliente al backend.
 * 
 * PRIORIDAD DE TOKENS:
 * 1. Si accedes a /cliente/* → SOLO usa token de CLIENTE
 * 2. Si hay token de CLIENTE en localStorage → usa CLIENTE
 * 3. Si no hay token de cliente → usa token de STAFF
 * 
 * Esto permite que clientes usen sus propias rutas incluso si
 * el navegador tiene abierta una sesión de staff.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let token: string | null = null;
  const isClienteRoute = req.url.includes('/cliente/');

  if (isClienteRoute) {
    // Para rutas /cliente/*, SOLO usa token de cliente
    const sesionCliente = localStorage.getItem('be_session_cliente');
    if (sesionCliente) {
      try {
        const parsed = JSON.parse(sesionCliente);
        token = parsed.token;
      } catch {
        // Ignora si no es JSON válido
      }
    }
  } else {
    // Para otras rutas, prioriza token de cliente si existe
    const sesionCliente = localStorage.getItem('be_session_cliente');
    if (sesionCliente) {
      try {
        const parsed = JSON.parse(sesionCliente);
        token = parsed.token;
      } catch {
        // Ignora si no es JSON válido
      }
    }
    
    // Si no hay token de cliente, usa token de staff
    if (!token) {
      token = authService.getToken();
    }
  }

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Logout del staff
        authService.logout();
        // Logout del cliente también
        localStorage.removeItem('be_session_cliente');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
