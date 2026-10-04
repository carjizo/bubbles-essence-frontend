import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AccionResponse } from './accion.service';
import { UsuarioResponseDTO } from './usuario.service';

export interface GrupoResponse {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface GrupoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/grupos`;

  // CRUD Grupos
  listar(): Observable<ApiResponse<GrupoResponse[]>> {
    return this.http.get<ApiResponse<GrupoResponse[]>>(this.base);
  }

  obtenerPorId(id: number): Observable<ApiResponse<GrupoResponse>> {
    return this.http.get<ApiResponse<GrupoResponse>>(`${this.base}/${id}`);
  }

  crear(req: GrupoRequest): Observable<ApiResponse<GrupoResponse>> {
    return this.http.post<ApiResponse<GrupoResponse>>(this.base, req);
  }

  actualizar(id: number, req: GrupoRequest): Observable<ApiResponse<GrupoResponse>> {
    return this.http.put<ApiResponse<GrupoResponse>>(`${this.base}/${id}`, req);
  }

  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/desactivar`, null);
  }

  activar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activar`, null);
  }

  // Acciones del grupo
  listarAcciones(grupoId: number): Observable<ApiResponse<AccionResponse[]>> {
    return this.http.get<ApiResponse<AccionResponse[]>>(`${this.base}/${grupoId}/acciones`);
  }

  asignarAccion(grupoId: number, accionId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${grupoId}/acciones/${accionId}`, null);
  }

  quitarAccion(grupoId: number, accionId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${grupoId}/acciones/${accionId}`);
  }

  // Usuarios del grupo
  listarUsuarios(grupoId: number): Observable<ApiResponse<UsuarioResponseDTO[]>> {
    return this.http.get<ApiResponse<UsuarioResponseDTO[]>>(`${this.base}/${grupoId}/usuarios`);
  }

  asignarUsuario(grupoId: number, usuarioId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${grupoId}/usuarios/${usuarioId}`, null);
  }

  quitarUsuario(grupoId: number, usuarioId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${grupoId}/usuarios/${usuarioId}`);
  }
}
