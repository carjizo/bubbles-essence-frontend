import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoClienteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/productos`;

  /** Listar productos activos (público) */
  listar(): Observable<ApiResponse<Producto[]>> {
    return this.http.get<ApiResponse<Producto[]>>(`${this.base}?activo=true`);
  }

  /** Obtener un producto por ID (público) */
  obtenerPorId(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.base}/${id}`);
  }
}
