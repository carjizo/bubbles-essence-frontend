import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { USA_TOKEN_CLIENTE } from './cliente-request.context';

/**
 * Agrega "Authorization: Bearer <token>" a cada request saliente al backend.
 *
 * QUÉ TOKEN USA Y POR QUÉ: NO se decide mirando la URL (varios endpoints
 * de cliente, como /pedidos/mis-pedidos, comparten la misma ruta base que
 * endpoints de staff -> la URL no es una señal confiable). Se decide por
 * una marca explícita (USA_TOKEN_CLIENTE) que cada servicio Angular pone
 * a propósito en las llamadas que el backend protege con
 * @PreAuthorize("hasRole('CLIENTE')"). Ver cliente-request.context.ts.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let token: string | null = null;

  if (req.context.get(USA_TOKEN_CLIENTE)) {
    const sesionCliente = localStorage.getItem('be_session_cliente');
    if (sesionCliente) {
      try {
        token = JSON.parse(sesionCliente).token;
      } catch {
        // Ignora si no es JSON válido
      }
    }
  } else {
    // Todo lo demás (incluido lo público) usa el token de staff si hay
    // sesión; si no hay, el request sale sin Authorization y el backend
    // decide (los endpoints públicos no lo exigen).
    token = authService.getToken();
  }

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error) => {
      if (error.status === 401) {
        if (req.context.get(USA_TOKEN_CLIENTE)) {
          localStorage.removeItem('be_session_cliente');
          // no redirijas a /login si la sesión de staff sigue activa
        } else {
          authService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};