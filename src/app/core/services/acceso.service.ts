import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AccesoResponse } from '../models/acceso.model';

/**
 * Guarda los accesos YA RESUELTOS del usuario logueado (grupos, módulos,
 * y la lista plana de códigos de acción tipo "btn-editar-producto").
 * Es la única fuente que consultan el menú lateral y la directiva
 * *appHasAccion para mostrar/ocultar botones — nunca se decide nada
 * mirando el rol a mano en un componente.
 */
@Injectable({ providedIn: 'root' })
export class AccesoService {
  private readonly http = inject(HttpClient);

  private readonly _accesos = signal<AccesoResponse | null>(null);
  readonly accesos = this._accesos.asReadonly();

  cargarMisAccesos(): Observable<ApiResponse<AccesoResponse>> {
    return this.http
      .get<ApiResponse<AccesoResponse>>(`${environment.apiUrl}/accesos/mis-accesos`)
      .pipe(tap((respuesta) => this._accesos.set(respuesta.data)));
  }

  limpiar(): void {
    this._accesos.set(null);
  }

  tieneAccion(codigo: string): boolean {
    const a = this._accesos();
    if (!a) return false;
    // 1) check flat acciones
    if (a.acciones?.includes(codigo)) return true;
    // 2) check per-module actions
    return a.modulos?.some((m) => m.acciones?.includes(codigo)) ?? false;
  }

  tieneModulo(codigo: string): boolean {
    return this._accesos()?.modulos.some((m) => m.codigo === codigo) ?? false;
  }

  /** ¿Tiene la acción `accionCodigo` dentro del módulo `moduloCodigo`? */
  tieneAccionEnModulo(moduloCodigo: string, accionCodigo: string): boolean {
    const a = this._accesos();
    if (!a) return false;
    const mod = a.modulos?.find((m) => m.codigo === moduloCodigo);
    return !!(mod && mod.acciones && mod.acciones.includes(accionCodigo));
  }
}
