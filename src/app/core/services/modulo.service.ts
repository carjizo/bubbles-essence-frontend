import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface ModuloResponse {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/modulos`;

  listar(): Observable<ApiResponse<ModuloResponse[]>> {
    return this.http.get<ApiResponse<ModuloResponse[]>>(this.base);
  }

  obtenerPorId(id: number): Observable<ApiResponse<ModuloResponse>> {
    return this.http.get<ApiResponse<ModuloResponse>>(`${this.base}/${id}`);
  }
}
