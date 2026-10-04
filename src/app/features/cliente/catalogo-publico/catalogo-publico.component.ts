import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../core/models/producto.model';
import { ProductoClienteService } from '../../../core/services/producto-cliente.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-catalogo-publico',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './catalogo-publico.component.html',
  styleUrl: './catalogo-publico.component.css'
})
export class CatalogoPublicoComponent {
  private readonly productoService = inject(ProductoClienteService);
  private readonly authService = inject(AuthService);

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly estaClienteLogueado = signal(this.verificarClienteLogueado());
  
  constructor() {
    this.cargar();
  }

  private verificarClienteLogueado(): boolean {
    return !!localStorage.getItem('be_session_cliente');
  }

  get esAdmin(): boolean {
    return this.authService.estaAutenticado();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService.listar().subscribe({
      next: (res) => {
        console.log('✓ Productos cargados:', res.data.length);
        this.productos.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('✗ Error cargando productos:', err);
        this.error.set('No se pudieron cargar los productos');
        this.cargando.set(false);
      }
    });
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio);
  }

  trackById(_: number, p: Producto): number {
    return p.id;
  }
}
