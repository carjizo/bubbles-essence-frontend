import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AccionResponse {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  moduloId: number;
  moduloCodigo: string;
  activo: boolean;
}

export interface AccionRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  moduloId: number;
}

@Injectable({ providedIn: 'root' })
export class AccionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/acciones`;

  listar(moduloId?: number): Observable<ApiResponse<AccionResponse[]>> {
    if (moduloId) {
      return this.http.get<ApiResponse<AccionResponse[]>>(this.base, { params: { moduloId: String(moduloId) } });
    }
    return this.http.get<ApiResponse<AccionResponse[]>>(this.base);
  }

  obtenerPorId(id: number): Observable<ApiResponse<AccionResponse>> {
    return this.http.get<ApiResponse<AccionResponse>>(`${this.base}/${id}`);
  }

  crear(req: AccionRequest): Observable<ApiResponse<AccionResponse>> {
    return this.http.post<ApiResponse<AccionResponse>>(this.base, req);
  }

  actualizar(id: number, req: AccionRequest): Observable<ApiResponse<AccionResponse>> {
    return this.http.put<ApiResponse<AccionResponse>>(`${this.base}/${id}`, req);
  }

  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/desactivar`, null);
  }

  activar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activar`, null);
  }
}
