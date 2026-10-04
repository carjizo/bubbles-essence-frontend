import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { AccesoService } from './acceso.service';

const STORAGE_KEY = 'be_session';

interface SesionGuardada {
  token: string;
  usuario: LoginResponse;
}

/**
 * Autenticación: SOLO prueba identidad (login contra /auth/login, guarda el
 * JWT). La autorización (qué puede hacer el usuario) vive en AccesoService,
 * resuelta aparte contra /accesos/mis-accesos — ver el README del backend,
 * sección "Autenticación desacoplada de la autorización".
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly accesoService = inject(AccesoService);

  private readonly sesion = signal<SesionGuardada | null>(this.leerSesionGuardada());

  readonly usuarioActual = computed(() => this.sesion()?.usuario ?? null);
  readonly estaAutenticado = computed(() => this.sesion() !== null);

  constructor() {
    // Si al recargar la página ya había una sesión guardada, los accesos
    // (grupos/módulos/acciones) no sobreviven el refresh porque viven en un
    // signal en memoria, no en localStorage: hay que volver a pedirlos.
    //
    // OJO: no se llama aquí mismo, directo dentro del constructor. El
    // interceptor HTTP hace inject(AuthService), y si el HTTP call se
    // dispara mientras ESTE constructor todavía se está ejecutando, Angular
    // lo trata como una dependencia circular (AuthService pidiéndose a sí
    // mismo antes de terminar de construirse) y tira la petición ANTES de
    // que llegue a la red -> por eso nunca aparecía en el Network tab.
    // setTimeout(…, 0) difiere la llamada al siguiente tick, cuando el
    // constructor ya terminó y AuthService ya es una instancia completa.
    if (this.sesion()) {
      setTimeout(() => {
        this.accesoService.cargarMisAccesos().subscribe({
          error: (err) => {
            // Solo hace logout si el token es realmente inválido (401).
            // Otros errores (red, servidor) se ignoran para mantener la sesión guardada.
            console.warn('Error al cargar accesos, pero la sesión local se mantiene', err);
          },
        });
      }, 0);
    }
  }

  login(credenciales: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap((respuesta) => {
          const sesion: SesionGuardada = { token: respuesta.data.token, usuario: respuesta.data };
          this.sesion.set(sesion);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
          // Apenas hay sesión, se resuelven sus accesos (grupos/módulos/acciones)
          this.accesoService.cargarMisAccesos().subscribe();
        }),
      );
  }

  logout(): void {
    this.sesion.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.accesoService.limpiar();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.sesion()?.token ?? null;
  }

  private leerSesionGuardada(): SesionGuardada | null {
    const crudo = localStorage.getItem(STORAGE_KEY);
    if (!crudo) return null;
    try {
      return JSON.parse(crudo) as SesionGuardada;
    } catch {
      return null;
    }
  }
}