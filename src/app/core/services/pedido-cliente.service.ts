import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CrearPedidoClienteRequest, PedidoCliente } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class PedidoClienteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/pedidos`;

  /** Crear un pedido (público, sin login) */
  crear(request: CrearPedidoClienteRequest): Observable<ApiResponse<PedidoCliente>> {
    return this.http.post<ApiResponse<PedidoCliente>>(this.base, request);
  }

  /** Seguimiento de un pedido (público, con código + DNI) */
  seguimiento(codigoPedido: string, dniCliente: string): Observable<ApiResponse<PedidoCliente>> {
    return this.http.get<ApiResponse<PedidoCliente>>(`${this.base}/seguimiento`, {
      params: { codigoPedido, documento: dniCliente }
    });
  }

  /** Búsqueda para admin: obtener pedido por código SIN validar teléfono */
  buscarPorCodigoParaAdmin(codigo: string): Observable<ApiResponse<PedidoCliente>> {
    return this.http.get<ApiResponse<PedidoCliente>>(`${this.base}/buscar-por-codigo`, {
      params: { codigo }
    });
  }

  /** Obtener todos los pedidos del cliente logueado */
  obtenerMisPedidos(): Observable<ApiResponse<PedidoCliente[]>> {
    return this.http.get<ApiResponse<PedidoCliente[]>>(`${this.base}/mis-pedidos`);
  }

  /** Cancelar un pedido (público, con código + DNI) */
  cancelar(codigoPedido: string, dniCliente: string): Observable<ApiResponse<PedidoCliente>> {
    return this.http.patch<ApiResponse<PedidoCliente>>(
      `${this.base}/seguimiento/cancelar`,
      { codigoPedido, documento: dniCliente }
    );
  }

  // ========== OPCIÓN A - RÁPIDO: Confirmación de Pago ==========

  /**
   * Confirmar pago de un pedido (PENDING_PAYMENT → PAID).
   * El trabajador verifica el comprobante en Yape y confirma aquí.
   * Se consume el stock en este momento.
   */
  confirmarPago(
    pedidoId: number,
    request: { referenciaYape: string; montoVerificado: number; observacion?: string }
  ): Observable<ApiResponse<PedidoCliente>> {
    return this.http.patch<ApiResponse<PedidoCliente>>(
      `${this.base}/${pedidoId}/confirmar-pago`,
      request
    );
  }

  /**
   * Rechazar pago de un pedido.
   * El trabajador detecta comprobante falso o monto no coincide.
   * El pedido sigue en PENDING_PAYMENT, permitiendo reintentar.
   */
  rechazarPago(
    pedidoId: number,
    request: { motivo: string; observacion?: string }
  ): Observable<ApiResponse<PedidoCliente>> {
    return this.http.patch<ApiResponse<PedidoCliente>>(
      `${this.base}/${pedidoId}/rechazar-pago`,
      request
    );
  }

  listar(estado?: string): Observable<ApiResponse<PedidoCliente[]>> {
    const params: Record<string, string> = {};
    if (estado && estado !== 'TODOS') {
      params['estado'] = estado;
    }
    return this.http.get<ApiResponse<PedidoCliente[]>>(this.base, { params });
  }

  /** Cambiar el estado de un pedido (PAID → PREPARING → READY_TO_SHIP → SHIPPED/DELIVERED) */
  cambiarEstado(
    pedidoId: number,
    request: { nuevoEstado: string }
  ): Observable<ApiResponse<PedidoCliente>> {
    return this.http.patch<ApiResponse<PedidoCliente>>(
      `${this.base}/${pedidoId}/estado`,
      request
    );
  }
}
