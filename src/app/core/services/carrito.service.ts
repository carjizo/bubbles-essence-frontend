import { Injectable, signal } from '@angular/core';
import { EstadoCarrito, ItemCarrito, Producto } from '../models/producto.model';

const STORAGE_KEY = 'be_carrito_cliente';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _carrito = signal<EstadoCarrito>(this.leerCarritoGuardado());
  readonly carrito = this._carrito.asReadonly();

  /**
   * Usa sessionStorage en lugar de localStorage para:
   * - Evitar mezcla de carritos si dos clientes usan el mismo navegador
   * - Limpiar automáticamente el carrito al cerrar la pestaña
   * - Mantener datos seguros por sesión
   */

  agregarProducto(producto: Producto, cantidad: number): void {
    const carrito = this._carrito();
    const itemExistente = carrito.items.find(i => i.productoId === producto.id);

    if (itemExistente) {
      // Incrementar cantidad
      itemExistente.cantidad += cantidad;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.producto.precio;
    } else {
      // Agregar nuevo item
      carrito.items.push({
        productoId: producto.id,
        producto,
        cantidad,
        subtotal: cantidad * producto.precio
      });
    }

    this.recalcularTotales();
    this.guardarCarrito();
  }

  modificarCantidad(productoId: number, cantidad: number): void {
    const carrito = this._carrito();
    const item = carrito.items.find(i => i.productoId === productoId);

    if (item) {
      if (cantidad <= 0) {
        this.quitarProducto(productoId);
      } else {
        item.cantidad = cantidad;
        item.subtotal = cantidad * item.producto.precio;
        this.recalcularTotales();
        this.guardarCarrito();
      }
    }
  }

  quitarProducto(productoId: number): void {
    const carrito = this._carrito();
    carrito.items = carrito.items.filter(i => i.productoId !== productoId);
    this.recalcularTotales();
    this.guardarCarrito();
  }

  limpiar(): void {
    this._carrito.set({ items: [], total: 0, cantidadTotal: 0 });
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private recalcularTotales(): void {
    const carrito = this._carrito();
    carrito.total = carrito.items.reduce((sum, item) => sum + item.subtotal, 0);
    carrito.cantidadTotal = carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
    this._carrito.set({ ...carrito });
  }

  private guardarCarrito(): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this._carrito()));
  }

  private leerCarritoGuardado(): EstadoCarrito {
    const crudo = sessionStorage.getItem(STORAGE_KEY);
    if (!crudo) return { items: [], total: 0, cantidadTotal: 0 };
    try {
      return JSON.parse(crudo) as EstadoCarrito;
    } catch {
      return { items: [], total: 0, cantidadTotal: 0 };
    }
  }
}
