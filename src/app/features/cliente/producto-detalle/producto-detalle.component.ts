import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto } from '../../../core/models/producto.model';
import { ProductoClienteService } from '../../../core/services/producto-cliente.service';
import { CarritoService } from '../../../core/services/carrito.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producto-detalle.component.html',
  styleUrl: './producto-detalle.component.css'
})
export class ProductoDetalleComponent {
  private readonly productoService = inject(ProductoClienteService);
  private readonly carritoService = inject(CarritoService);
  private readonly route = inject(ActivatedRoute);

  readonly producto = signal<Producto | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly cantidad = signal(1);
  readonly agredandoAlCarrito = signal(false);
  readonly mensajeExito = signal<string | null>(null);

  constructor() {
    this.cargarProducto();
  }

  private cargarProducto(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Producto no encontrado');
      this.cargando.set(false);
      return;
    }

    this.productoService.obtenerPorId(parseInt(id)).subscribe({
      next: (res) => {
        this.producto.set(res.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el producto');
        this.cargando.set(false);
      }
    });
  }

  agregarAlCarrito(): void {
    const prod = this.producto();
    if (!prod || this.cantidad() <= 0) return;

    this.agredandoAlCarrito.set(true);
    this.carritoService.agregarProducto(prod, this.cantidad());
    
    setTimeout(() => {
      this.agredandoAlCarrito.set(false);
      this.mensajeExito.set(`${prod.nombre} agregado al carrito`);
      setTimeout(() => this.mensajeExito.set(null), 3000);
    }, 500);
  }

  incrementarCantidad(): void {
    const prod = this.producto();
    if (prod && this.cantidad() < prod.stock) {
      this.cantidad.set(this.cantidad() + 1);
    }
  }

  decrementarCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.set(this.cantidad() - 1);
    }
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio);
  }

  get subtotal(): number {
    const prod = this.producto();
    return prod ? prod.precio * this.cantidad() : 0;
  }
}
