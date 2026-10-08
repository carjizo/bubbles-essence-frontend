import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { FiltrosProducto, Producto, ProductoRequest } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  /**
   * GET es público en el backend (ver SecurityConfig), así que esto funciona
   * incluso para un invitado sin token; acá siempre se llama ya logueado.
   *
   * El backend devuelve como máximo 50 productos, ordenados por fecha de
   * creación (más nuevos primero), ya filtrados en la BD. La paginación
   * visual la hace el componente sobre esas filas.
   */
  listar(filtros: FiltrosProducto = {}): Observable<ApiResponse<Producto[]>> {
    let params = new HttpParams();
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo);
    }
    if (filtros.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta);
    }
    if (filtros.ingrediente) {
      params = params.set('ingrediente', filtros.ingrediente);
    }
    if (filtros.codigo) {
      params = params.set('codigo', filtros.codigo);
    }
    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    return this.http.get<ApiResponse<Producto[]>>(this.baseUrl, { params });
  }

  crear(request: ProductoRequest): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(this.baseUrl, request);
  }

  actualizar(id: number, request: ProductoRequest): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.baseUrl}/${id}`, request);
  }

  /** El backend desactiva (soft delete), no borra la fila. */
  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
