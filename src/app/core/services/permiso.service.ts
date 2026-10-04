import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface PermisoResponse {
  id: number;
  accionId: number;
  accionCodigo: string;
  accionNombre: string;
  tipo: 'GRANT' | 'DENY';
}

export interface AsignarPermisoRequest {
  accionId: number;
  tipo: 'GRANT' | 'DENY';
}

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly http = inject(HttpClient);

  /** /api/v1/usuarios/{usuarioId}/permisos */
  private getBase(usuarioId: number): string {
    return `${environment.apiUrl}/usuarios/${usuarioId}/permisos`;
  }

  listarPorUsuario(usuarioId: number): Observable<ApiResponse<PermisoResponse[]>> {
    return this.http.get<ApiResponse<PermisoResponse[]>>(this.getBase(usuarioId));
  }

  asignar(usuarioId: number, req: AsignarPermisoRequest): Observable<ApiResponse<PermisoResponse>> {
    return this.http.post<ApiResponse<PermisoResponse>>(this.getBase(usuarioId), req);
  }

  quitar(usuarioId: number, accionId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.getBase(usuarioId)}/${accionId}`);
  }
}
