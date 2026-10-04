import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';

@Component({
  selector: 'app-carrito-cliente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito-cliente.component.html',
  styleUrl: './carrito-cliente.component.css'
})
export class CarritoClienteComponent {
  readonly carritoService = inject(CarritoService);

  incrementarCantidad(productoId: number, cantidadActual: number): void {
    this.carritoService.modificarCantidad(productoId, cantidadActual + 1);
  }

  decrementarCantidad(productoId: number, cantidadActual: number): void {
    this.carritoService.modificarCantidad(productoId, cantidadActual - 1);
  }

  quitarProducto(productoId: number): void {
    this.carritoService.quitarProducto(productoId);
  }

  limpiarCarrito(): void {
    if (confirm('¿Está seguro de que desea limpiar el carrito?')) {
      this.carritoService.limpiar();
    }
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio);
  }
}
