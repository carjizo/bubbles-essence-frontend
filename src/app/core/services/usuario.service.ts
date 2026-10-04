import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { GrupoResponse } from './grupo.service';

export interface UsuarioResponseDTO {
  id: number;
  nombreCompleto: string;
  usuario: string;
  rol: string;
  telefono?: string;
  correo?: string;
  activo: boolean;
}

export interface UsuarioRequestDTO {
  nombreCompleto: string;
  usuario: string;
  clave?: string;
  rol: string;
  telefono?: string;
  correo?: string;
  activo?: boolean;
}

/** Resumen de usuario con sus grupos */
export interface UsuarioConGrupos extends UsuarioResponseDTO {
  grupos?: GrupoResponse[];
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  listar(activo?: boolean): Observable<ApiResponse<UsuarioResponseDTO[]>> {
    if (activo !== undefined) {
      return this.http.get<ApiResponse<UsuarioResponseDTO[]>>(this.base, { params: { activo: String(activo) } });
    }
    return this.http.get<ApiResponse<UsuarioResponseDTO[]>>(this.base);
  }

  obtenerPorId(id: number): Observable<ApiResponse<UsuarioResponseDTO>> {
    return this.http.get<ApiResponse<UsuarioResponseDTO>>(`${this.base}/${id}`);
  }

  crear(req: UsuarioRequestDTO): Observable<ApiResponse<UsuarioResponseDTO>> {
    return this.http.post<ApiResponse<UsuarioResponseDTO>>(this.base, req);
  }

  actualizar(id: number, req: UsuarioRequestDTO): Observable<ApiResponse<UsuarioResponseDTO>> {
    return this.http.put<ApiResponse<UsuarioResponseDTO>>(`${this.base}/${id}`, req);
  }

  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  activar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activar`, null);
  }
}
