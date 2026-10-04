import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Producto, ProductoRequest } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  /** GET es público en el backend (ver SecurityConfig), así que esto funciona
   *  incluso para un invitado sin token; acá siempre se llama ya logueado. */
  listar(activo?: boolean): Observable<ApiResponse<Producto[]>> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo);
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
