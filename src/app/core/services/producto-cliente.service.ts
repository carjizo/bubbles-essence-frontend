import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { FiltrosProducto, Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoClienteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/productos`;

  /**
   * Listar productos activos (público). El backend devuelve como máximo 50,
   * los más recientes primero, ya filtrados en la BD:
   * - ingrediente (3+ caracteres): jabones que tengan un ingrediente cuyo
   *   nombre lo contenga (ej. "mie" -> los que llevan miel).
   * - precioMin / precioMax: rango de precio.
   * - soloConStock: solo productos con stock disponible.
   * Siempre se pide activo=true: un visitante nunca debe ver desactivados.
   */
  listar(filtros: FiltrosProducto = {}): Observable<ApiResponse<Producto[]>> {
    let params = new HttpParams().set('activo', true);
    if (filtros.ingrediente) {
      params = params.set('ingrediente', filtros.ingrediente);
    }
    if (filtros.precioMin !== undefined) {
      params = params.set('precioMin', filtros.precioMin);
    }
    if (filtros.precioMax !== undefined) {
      params = params.set('precioMax', filtros.precioMax);
    }
    if (filtros.soloConStock) {
      params = params.set('soloConStock', true);
    }
    return this.http.get<ApiResponse<Producto[]>>(this.base, { params });
  }

  /** Obtener un producto por ID (público) */
  obtenerPorId(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.base}/${id}`);
  }
}
